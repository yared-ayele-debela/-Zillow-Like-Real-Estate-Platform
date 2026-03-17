<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    /**
     * Handle Stripe webhooks. Subscription/customer events are delegated to
     * Laravel Cashier; payment_intent and invoice.payment_succeeded are handled here.
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $type = $event->type;

        // Delegate subscription and customer events to Laravel Cashier
        $cashierEvents = [
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'customer.updated',
            'customer.deleted',
            'payment_method.automatically_updated',
            'invoice.payment_action_required',
        ];
        if (in_array($type, $cashierEvents, true)) {
            return app(CashierWebhookController::class)->handleWebhook($request);
        }

        switch ($type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;

            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;

            case 'invoice.payment_succeeded':
                $this->handleInvoicePaymentSucceeded($event->data->object);
                break;

            case 'invoice.payment_failed':
                $this->handleInvoicePaymentFailed($event->data->object);
                break;

            default:
                Log::info('Unhandled Stripe webhook event', ['type' => $type]);
        }

        return response()->json(['received' => true]);
    }

    protected function handlePaymentIntentSucceeded($paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->update([
                'status' => 'completed',
                'transaction_id' => $paymentIntent->id,
            ]);

            if ($payment->type === 'featured_listing' && $payment->property_id) {
                $property = Property::find($payment->property_id);
                if ($property) {
                    $property->update(['is_featured' => true]);
                }
            }

            Log::info('Payment completed via webhook', [
                'payment_id' => $payment->id,
                'payment_intent_id' => $paymentIntent->id,
            ]);
        }
    }

    protected function handlePaymentIntentFailed($paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->update(['status' => 'failed']);
            Log::info('Payment failed via webhook', [
                'payment_id' => $payment->id,
                'payment_intent_id' => $paymentIntent->id,
            ]);
        }
    }

    /**
     * Create Payment record for subscription invoice (Cashier manages subscription state).
     */
    protected function handleInvoicePaymentSucceeded($invoice): void
    {
        if (empty($invoice->subscription)) {
            return;
        }

        $subscription = \Laravel\Cashier\Subscription::where('stripe_id', $invoice->subscription)->first();

        if ($subscription) {
            Payment::create([
                'user_id' => $subscription->user_id,
                'type' => 'subscription',
                'amount' => $invoice->amount_paid / 100,
                'currency' => strtoupper($invoice->currency ?? 'usd'),
                'status' => 'completed',
                'transaction_id' => $invoice->id,
                'stripe_payment_intent_id' => $invoice->payment_intent ?? null,
                'metadata' => [
                    'subscription_id' => $subscription->id,
                    'invoice_id' => $invoice->id,
                ],
            ]);
        }
    }

    protected function handleInvoicePaymentFailed($invoice): void
    {
        if (! empty($invoice->subscription)) {
            Log::warning('Subscription invoice payment failed', [
                'stripe_subscription_id' => $invoice->subscription,
                'invoice_id' => $invoice->id,
            ]);
        }
    }
}

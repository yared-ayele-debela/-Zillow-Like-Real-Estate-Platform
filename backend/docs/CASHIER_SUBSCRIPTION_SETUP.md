# Agent Subscriptions with Laravel Cashier

Agent subscriptions use **Laravel Cashier (Stripe)**. Agents are redirected to Stripe Checkout to subscribe; webhooks keep the local subscription in sync.

## Environment

In `.env`:

- `STRIPE_KEY` – Stripe publishable key
- `STRIPE_SECRET` – Stripe secret key  
- `STRIPE_WEBHOOK_SECRET` – Webhook signing secret (from Stripe Dashboard → Webhooks)
- `FRONTEND_URL` – Frontend base URL (e.g. `http://localhost:3000`) for Checkout success/cancel redirects

## Stripe setup

1. **Products and Prices**  
   In Stripe Dashboard → Products, create a product per plan (e.g. Basic, Premium, Enterprise) and add a recurring Price (e.g. monthly). Copy each **Price ID** (e.g. `price_xxx`).

2. **Subscription plans in the app**  
   Each row in `subscription_plans` must have the corresponding Stripe Price ID in `stripe_price_id`:
   - Via Admin: Payment config → edit plan → set **Stripe Price ID**.
   - Or in DB: `UPDATE subscription_plans SET stripe_price_id = 'price_xxx' WHERE slug = 'basic';`

3. **Webhook**  
   In Stripe Dashboard → Webhooks, add an endpoint:
   - URL: `https://your-api-domain.com/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `customer.updated`, `customer.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, and any others you need.
   - Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

## Flow

- **Subscribe:** Agent chooses a plan → API creates a Stripe Checkout session and returns `url` → frontend redirects to Stripe Checkout → after payment, Stripe redirects to `FRONTEND_URL/subscription?success=1&session_id={CHECKOUT_SESSION_ID}`.
- **Confirm checkout:** When the user returns with `session_id`, the frontend calls `POST /api/subscriptions/confirm-checkout` to sync the subscription from Stripe. This ensures the subscription is stored even when webhooks cannot reach the server (e.g. local development).
- **Webhooks:** In production, Stripe webhooks also sync subscriptions. Use Stripe CLI for local testing: `stripe listen --forward-to http://localhost:8000/api/webhooks/stripe`.

## API (agents)

- `POST /api/subscriptions` – body: `{ "plan": "basic" }` → returns `{ "url": "https://checkout.stripe.com/..." }`.
- `POST /api/subscriptions/confirm-checkout` – body: `{ "session_id": "cs_xxx" }` – syncs subscription from Stripe (called when user returns from Checkout).
- `GET /api/subscriptions/current` – current subscription.
- `GET /api/subscriptions/check` – subscription status and days remaining.
- `POST /api/subscriptions/{id}/cancel` – cancel at period end.

All require `auth:sanctum` and are intended for agents (and optionally admin).

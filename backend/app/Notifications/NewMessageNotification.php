<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Message $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $this->message->loadMissing('sender', 'property');
        $sender = $this->message->sender;
        $property = $this->message->property;

        $mail = (new MailMessage)
            ->subject($this->message->subject ?? 'New Message from ' . ($sender?->name ?? 'Someone'))
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('You have received a new message from ' . ($sender?->name ?? 'Someone') . '.')
            ->line('**Message:**')
            ->line($this->message->message);

        if ($property) {
            $mail->line('**Property:** ' . $property->title)
                ->line($property->address . ', ' . $property->city . ', ' . $property->state)
                ->action('View Property', url('/properties/' . $property->id));
        }

        $mail->line('Thank you for using our application!');

        return $mail;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $this->message->loadMissing('sender');

        return [
            'message_id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender?->name,
            'property_id' => $this->message->property_id,
            'subject' => $this->message->subject,
        ];
    }
}

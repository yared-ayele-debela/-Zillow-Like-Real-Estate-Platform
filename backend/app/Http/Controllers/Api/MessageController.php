<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Property;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Notifications\TourRequestNotification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    public function __construct(protected NotificationService $notificationService)
    {
    }

    /**
     * Store a new message.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:5000',
            'type' => 'sometimes|in:inquiry,general,tour_request',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $receiver = User::findOrFail($request->receiver_id);

        // Create message
        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $request->receiver_id,
            'property_id' => $request->property_id,
            'subject' => $request->subject,
            'message' => $request->message,
            'type' => $request->type ?? 'inquiry',
        ]);

        // Send email notification
        try {
            $receiver->notify(new NewMessageNotification($message));
            $this->notificationService->sendInApp(
                $receiver,
                'new_message',
                $message->subject ?? 'New Message',
                $message->message,
                [
                    'message_id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->sender?->name,
                ],
                $message->property_id
            );
        } catch (\Exception $e) {
            Log::error('Failed to send message notification', [
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => $message->load(['sender', 'receiver', 'property']),
        ], 201);
    }

    /**
     * Get user's messages (sent and received).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Message::where(function ($q) use ($user) {
            $q->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id);
        })->with(['sender:id,name,email,avatar', 'receiver:id,name,email,avatar', 'property:id,title,address']);

        // Filter by property
        if ($request->has('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by sent/received
        if ($request->has('folder')) {
            if ($request->folder === 'sent') {
                $query->where('sender_id', $user->id);
            } elseif ($request->folder === 'received') {
                $query->where('receiver_id', $user->id);
            }
        }

        // Filter by read status
        if ($request->has('is_read')) {
            $isRead = filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_read', $isRead);
        }

        // Group by thread (property + sender/receiver pair)
        if ($request->has('group_by_thread') && $request->group_by_thread) {
            $messages = $query->orderBy('created_at', 'desc')->get();

            // Group by property_id and sender/receiver pair
            $grouped = $messages->groupBy(function ($message) use ($user) {
                $otherUserId = $message->sender_id === $user->id
                    ? $message->receiver_id
                    : $message->sender_id;
                return ($message->property_id ?? 'general') . '_' . $otherUserId;
            });

            return response()->json([
                'messages' => $grouped,
                'grouped' => true,
            ]);
        }

        $messages = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        // Get unread count
        $unreadCount = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'messages' => $messages,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get a single message with thread.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $message = Message::with(['sender', 'receiver', 'property'])->findOrFail($id);

        // Check authorization
        if ($message->sender_id !== $user->id && $message->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Mark as read if user is receiver
        if ($message->receiver_id === $user->id) {
            $message->markAsRead();
        }

        // Get thread (all messages in the same conversation)
        $thread = Message::where(function ($q) use ($message) {
            $q->where(function ($q2) use ($message) {
                $q2->where('sender_id', $message->sender_id)
                    ->where('receiver_id', $message->receiver_id);
            })->orWhere(function ($q2) use ($message) {
                $q2->where('sender_id', $message->receiver_id)
                    ->where('receiver_id', $message->sender_id);
            });
        })
            ->where('property_id', $message->property_id)
            ->with(['sender:id,name,email,avatar', 'receiver:id,name,email,avatar'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'message' => $message,
            'thread' => $thread,
        ]);
    }

    /**
     * Reply to a message.
     */
    public function reply(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
            'subject' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $originalMessage = Message::findOrFail($id);

        // Check authorization
        if ($originalMessage->sender_id !== $user->id && $originalMessage->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Determine receiver (opposite of sender)
        $receiverId = $originalMessage->sender_id === $user->id
            ? $originalMessage->receiver_id
            : $originalMessage->sender_id;

        // Create reply (threaded)
        $reply = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'property_id' => $originalMessage->property_id,
            'parent_message_id' => $originalMessage->id,
            'subject' => $request->subject ?? 'Re: ' . ($originalMessage->subject ?? 'Inquiry'),
            'message' => $request->message,
            'type' => $originalMessage->type,
        ]);

        // Send email notification
        try {
            $receiver = User::findOrFail($receiverId);
            $receiver->notify(new NewMessageNotification($reply));
            $this->notificationService->sendInApp(
                $receiver,
                'new_message',
                $reply->subject ?? 'New Message',
                $reply->message,
                [
                    'message_id' => $reply->id,
                    'sender_id' => $reply->sender_id,
                    'sender_name' => $reply->sender?->name,
                ],
                $reply->property_id
            );
        } catch (\Exception $e) {
            Log::error('Failed to send reply notification', [
                'message_id' => $reply->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Reply sent successfully',
            'data' => $reply->load(['sender', 'receiver', 'property']),
        ], 201);
    }

    /**
     * Request a tour.
     */
    public function requestTour(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'receiver_id' => 'required|exists:users,id',
            'preferred_dates' => 'required|array|min:1',
            'preferred_dates.*' => 'date',
            'preferred_times' => 'nullable|array',
            'preferred_times.*' => 'string',
            'notes' => 'nullable|string|max:1000',
            'subject' => 'nullable|string|max:255',
            'message' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $property = Property::findOrFail($request->property_id);
        $receiver = User::findOrFail($request->receiver_id);

        // Create tour request message
        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $request->receiver_id,
            'property_id' => $request->property_id,
            'subject' => $request->subject ?? "Tour Request for {$property->title}",
            'message' => $request->message ?? "I would like to schedule a tour for this property.",
            'type' => 'tour_request',
            'tour_request_data' => [
                'preferred_dates' => $request->preferred_dates,
                'preferred_times' => $request->preferred_times ?? [],
                'notes' => $request->notes,
            ],
        ]);

        // Send email notification
        try {
            $receiver->notify(new TourRequestNotification($message, $property));
            $this->notificationService->sendInApp(
                $receiver,
                'tour_request',
                "Tour Request: {$property->title}",
                $message->message,
                [
                    'message_id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->sender?->name,
                    'tour_request_data' => $message->tour_request_data,
                ],
                $property->id
            );
        } catch (\Exception $e) {
            Log::error('Failed to send tour request notification', [
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Tour request submitted successfully',
            'data' => $message->load(['sender', 'receiver', 'property']),
        ], 201);
    }

    /**
     * Mark message as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $user = $request->user();
        $message = Message::findOrFail($id);

        // Check authorization
        if ($message->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $message->markAsRead();

        return response()->json([
            'message' => 'Message marked as read',
            'data' => $message,
        ]);
    }
}

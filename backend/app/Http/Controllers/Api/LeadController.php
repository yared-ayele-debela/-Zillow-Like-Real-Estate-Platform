<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class LeadController extends Controller
{
    public function __construct(protected NotificationService $notificationService)
    {
    }

    /**
     * Get leads/inquiries for agent's properties (thread roots by default).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->isAgent() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Only agents can access leads.',
            ], 403);
        }

        $query = Message::query()
            ->where(function ($q) use ($user) {
                $q->whereHas('property', function ($q2) use ($user) {
                    $q2->where('user_id', $user->id);
                })->orWhere('receiver_id', $user->id);
            });

        // Thread view: one row per conversation root (hide reply rows from main list)
        if (!$request->boolean('flat')) {
            $query->whereNull('parent_message_id');
        }

        if ($request->has('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('lead_status') && $request->lead_status !== '') {
            $query->where('lead_status', $request->lead_status);
        }

        if ($request->has('is_read')) {
            $isRead = filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_read', $isRead);
        }

        if ($request->has('group_by_property') && $request->group_by_property) {
            $messages = $query->with([
                'sender:id,name,email,phone,avatar',
                'property:id,title,address,city,state,uuid',
                'threadMessages.sender:id,name,email,phone,avatar',
            ])->get()->groupBy('property_id');

            return response()->json([
                'messages' => $messages,
                'grouped' => true,
            ]);
        }

        $messages = $query->with([
            'sender:id,name,email,phone,avatar',
            'property:id,title,address,city,state,uuid',
            'threadMessages.sender:id,name,email,phone,avatar',
        ])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'messages' => $messages,
            'grouped' => false,
        ]);
    }

    /**
     * Update lead pipeline fields (status, follow-up, score).
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $message = Message::with('property')->findOrFail($id);

        if ($message->property && $message->property->user_id !== $user->id && $message->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'lead_status' => 'sometimes|string|in:new,contacted,viewed,offer,closed',
            'next_follow_up_at' => 'sometimes|nullable|date',
            'lead_score' => 'sometimes|nullable|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $message->update($validator->validated());

        return response()->json([
            'message' => 'Lead updated successfully',
            'data' => $message->fresh(['sender:id,name,email,phone,avatar', 'property:id,title,address,city,state']),
        ]);
    }

    /**
     * Get a single lead/inquiry with full thread.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $message = Message::with(['sender', 'property', 'receiver'])->findOrFail($id);

        if ($message->property && $message->property->user_id !== $user->id && $message->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $message->markAsRead();

        $rootId = $message->thread_root_id ?? $message->id;
        $thread = Message::query()
            ->where('thread_root_id', $rootId)
            ->with(['sender:id,name,email,phone,avatar', 'receiver:id,name,email,phone,avatar'])
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'message' => $message,
            'thread' => $thread,
        ]);
    }

    /**
     * Mark message as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $user = $request->user();
        $message = Message::findOrFail($id);

        if ($message->property && $message->property->user_id !== $user->id && $message->receiver_id !== $user->id) {
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

    /**
     * Mark multiple messages as read.
     */
    public function markMultipleAsRead(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message_ids' => 'required|array',
            'message_ids.*' => 'exists:messages,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $messageIds = $request->message_ids;

        $messages = Message::whereIn('id', $messageIds)
            ->where(function ($q) use ($user) {
                $q->whereHas('property', function ($q2) use ($user) {
                    $q2->where('user_id', $user->id);
                })->orWhere('receiver_id', $user->id);
            })
            ->get();

        foreach ($messages as $message) {
            $message->markAsRead();
        }

        return response()->json([
            'message' => count($messages).' messages marked as read',
            'count' => count($messages),
        ]);
    }

    /**
     * Create a reply to a lead message (notifies buyer via email + in-app).
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
        $originalMessage = Message::with('property')->findOrFail($id);

        if ($originalMessage->property && $originalMessage->property->user_id !== $user->id && $originalMessage->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $receiverId = $originalMessage->sender_id === $user->id
            ? $originalMessage->receiver_id
            : $originalMessage->sender_id;

        $reply = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'property_id' => $originalMessage->property_id,
            'parent_message_id' => $originalMessage->id,
            'subject' => $request->subject ?? 'Re: '.($originalMessage->subject ?? 'Inquiry'),
            'message' => $request->message,
            'type' => $originalMessage->type ?? 'general',
        ]);

        $reply->load(['sender', 'receiver', 'property']);

        try {
            $receiver = User::findOrFail($receiverId);
            $receiver->notify(new NewMessageNotification($reply));
            $this->notificationService->sendInApp(
                $receiver,
                'new_message',
                $reply->subject ?? 'New message',
                $reply->message,
                [
                    'message_id' => $reply->id,
                    'sender_id' => $reply->sender_id,
                    'sender_name' => $reply->sender?->name,
                    'parent_message_id' => $originalMessage->id,
                    'thread_root_id' => $reply->thread_root_id,
                ],
                $reply->property_id
            );
        } catch (\Exception $e) {
            Log::error('Failed to send lead reply notification', [
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
     * Export leads to CSV.
     */
    public function export(Request $request)
    {
        $user = $request->user();

        if (!$user->isAgent() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $messages = Message::query()
            ->where(function ($q) use ($user) {
                $q->whereHas('property', function ($q2) use ($user) {
                    $q2->where('user_id', $user->id);
                })->orWhere('receiver_id', $user->id);
            })
            ->with(['sender', 'property'])
            ->orderBy('created_at', 'desc')
            ->get();

        $csv = "Date,Property,Name,Email,Phone,Subject,Message,Type,Read,Thread\n";

        foreach ($messages as $message) {
            $csv .= sprintf(
                "%s,\"%s\",\"%s\",%s,%s,\"%s\",\"%s\",%s,%s,%s\n",
                $message->created_at->format('Y-m-d H:i:s'),
                $message->property ? $message->property->title : 'N/A',
                $message->sender->name ?? 'N/A',
                $message->sender->email ?? 'N/A',
                $message->sender->phone ?? 'N/A',
                $message->subject ?? 'N/A',
                str_replace(["\n", "\r", '"'], [' ', ' ', '""'], $message->message),
                $message->type,
                $message->is_read ? 'Yes' : 'No',
                $message->parent_message_id ? 'reply' : 'root'
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="leads_'.date('Y-m-d').'.csv"',
        ]);
    }
}

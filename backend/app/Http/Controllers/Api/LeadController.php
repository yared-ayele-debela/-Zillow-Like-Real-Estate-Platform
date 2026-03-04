<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadController extends Controller
{
    /**
     * Get leads/inquiries for agent's properties.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Only agents and admins can access leads
        if (!$user->isAgent() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Only agents can access leads.',
            ], 403);
        }

        $query = Message::whereHas('property', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('receiver_id', $user->id)
            ->with(['sender:id,name,email,phone,avatar', 'property:id,title,address,city,state']);

        // Filter by property
        if ($request->has('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by lead status (pipeline stage)
        if ($request->has('lead_status') && $request->lead_status !== '') {
            $query->where('lead_status', $request->lead_status);
        }

        // Filter by read status
        if ($request->has('is_read')) {
            $isRead = filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_read', $isRead);
        }

        // Group by property if requested
        if ($request->has('group_by_property') && $request->group_by_property) {
            $messages = $query->get()->groupBy('property_id');

            return response()->json([
                'messages' => $messages,
                'grouped' => true,
            ]);
        }

        $messages = $query->orderBy('created_at', 'desc')
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

        // Check authorization (owns property or is receiver)
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

        $data = $validator->validated();

        $message->update($data);

        return response()->json([
            'message' => 'Lead updated successfully',
            'data' => $message->fresh(['sender:id,name,email,phone,avatar', 'property:id,title,address,city,state']),
        ]);
    }

    /**
     * Get a single lead/inquiry.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $message = Message::with(['sender', 'property', 'receiver'])->findOrFail($id);

        // Check if user owns the property or is the receiver
        if ($message->property && $message->property->user_id !== $user->id && $message->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Mark as read
        $message->markAsRead();

        return response()->json([
            'message' => $message,
        ]);
    }

    /**
     * Mark message as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $user = $request->user();
        $message = Message::findOrFail($id);

        // Check authorization
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

        // Verify ownership for all messages
        $messages = Message::whereIn('id', $messageIds)
            ->whereHas('property', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->orWhereIn('id', $messageIds)
            ->where('receiver_id', $user->id)
            ->get();

        foreach ($messages as $message) {
            $message->markAsRead();
        }

        return response()->json([
            'message' => count($messages) . ' messages marked as read',
            'count' => count($messages),
        ]);
    }

    /**
     * Create a reply to a message.
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
        if ($originalMessage->property && $originalMessage->property->user_id !== $user->id && $originalMessage->receiver_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Create reply
        $reply = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $originalMessage->sender_id,
            'property_id' => $originalMessage->property_id,
            'subject' => $request->subject ?? 'Re: ' . ($originalMessage->subject ?? 'Inquiry'),
            'message' => $request->message,
            'type' => 'general',
        ]);

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

        $messages = Message::whereHas('property', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('receiver_id', $user->id)
            ->with(['sender', 'property'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Generate CSV
        $csv = "Date,Property,Name,Email,Phone,Subject,Message,Type,Read\n";

        foreach ($messages as $message) {
            $csv .= sprintf(
                "%s,\"%s\",\"%s\",%s,%s,\"%s\",\"%s\",%s,%s\n",
                $message->created_at->format('Y-m-d H:i:s'),
                $message->property ? $message->property->title : 'N/A',
                $message->sender->name ?? 'N/A',
                $message->sender->email ?? 'N/A',
                $message->sender->phone ?? 'N/A',
                $message->subject ?? 'N/A',
                str_replace(["\n", "\r", '"'], [' ', ' ', '""'], $message->message),
                $message->type,
                $message->is_read ? 'Yes' : 'No'
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="leads_' . date('Y-m-d') . '.csv"',
        ]);
    }
}

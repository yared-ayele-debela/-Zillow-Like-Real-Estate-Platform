<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $fillable = [
        'sender_id',
        'receiver_id',
        'property_id',
        'parent_message_id',
        'thread_root_id',
        'subject',
        'message',
        'is_read',
        'read_at',
        'type',
        'tour_request_data',
        'lead_status',
        'next_follow_up_at',
        'lead_score',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'tour_request_data' => 'array',
        'next_follow_up_at' => 'datetime',
        'lead_score' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Message $message) {
            if ($message->parent_message_id) {
                $parent = static::query()->find($message->parent_message_id);
                if ($parent) {
                    $message->thread_root_id = $parent->thread_root_id ?? $parent->id;
                }
            }
        });

        static::created(function (Message $message) {
            if ($message->parent_message_id === null && $message->thread_root_id === null) {
                $message->updateQuietly(['thread_root_id' => $message->id]);
            }
        });
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'parent_message_id');
    }

    /**
     * Direct child replies (one level).
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'parent_message_id')->orderBy('created_at');
    }

    /**
     * All messages in the same conversation (same thread root).
     */
    public function threadMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'thread_root_id', 'id')->orderBy('created_at');
    }

    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }
}

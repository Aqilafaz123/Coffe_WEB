<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomReservation extends Model
{
    protected $fillable = [
        'reservation_number', 'room_id', 'user_id', 'reservation_date',
        'start_time', 'end_time', 'guests_count', 'duration_hours',
        'total_price', 'status', 'notes', 'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'reservation_date' => 'date',
            'duration_hours' => 'decimal:1',
            'total_price' => 'decimal:2',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}

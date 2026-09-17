<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'guest_name', 'guest_phone', 'table_location', 'status',
        'payment_method', 'midtrans_transaction_id', 'payment_status', 'paid_at',
        'subtotal', 'discount', 'voucher_code', 'total', 'notes', 'processed_by', 'completed_at',
        'queue_number', 'queue_called_at',
    ];

    protected $appends = ['customer_name'];

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (is_null($order->queue_number)) {
                $maxQueue = static::whereDate('created_at', today())
                    ->whereNotNull('queue_number')
                    ->max('queue_number') ?? 0;
                $order->queue_number = $maxQueue + 1;
            }
        });
    }

    public function assignQueueNumber(): int
    {
        if (! is_null($this->queue_number)) {
            return $this->queue_number;
        }

        $maxQueue = static::whereDate('created_at', $this->created_at ?? today())
            ->whereNotNull('queue_number')
            ->max('queue_number') ?? 0;

        $this->queue_number = $maxQueue + 1;
        $this->save();

        return $this->queue_number;
    }

    public function getCustomerNameAttribute(): string
    {
        return $this->user?->name ?? $this->guest_name ?? '-';
    }

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'completed_at' => 'datetime',
            'paid_at' => 'datetime',
            'queue_called_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}

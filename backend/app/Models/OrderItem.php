<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_id', 'quantity', 'options', 'notes',
        'unit_price', 'cost_price', 'subtotal',
    ];

    protected $appends = ['options_summary'];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'unit_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function getOptionsSummaryAttribute(): string
    {
        $parts = [];
        $opts = $this->options;

        if (is_array($opts)) {
            if (!empty($opts['sugar'])) {
                $parts[] = 'Gula: ' . $opts['sugar'];
            }
            if (!empty($opts['ice'])) {
                $parts[] = 'Es: ' . $opts['ice'];
            }
            if (!empty($opts['milk'])) {
                $parts[] = 'Susu: ' . $opts['milk'];
            }
            if (!empty($opts['addons']) && is_array($opts['addons'])) {
                foreach ($opts['addons'] as $addon) {
                    $qty = $addon['quantity'] ?? 1;
                    $name = $addon['name'] ?? 'Tambahan';
                    if ($qty > 0) {
                        $parts[] = "+{$qty} {$name}";
                    }
                }
            }
        }

        if (!empty($this->notes)) {
            $parts[] = 'Catatan: ' . $this->notes;
        }

        return implode(' · ', $parts);
    }

    public function getUnitCostAttribute(): float
    {
        if ((float) $this->attributes['cost_price'] > 0) {
            return (float) $this->attributes['cost_price'];
        }

        return $this->product ? (float) $this->product->calculateUnitCost() : 0.0;
    }

    public function getTotalCostAttribute(): float
    {
        return $this->unit_cost * (int) $this->quantity;
    }

    public function getGrossProfitAttribute(): float
    {
        return (float) $this->subtotal - $this->total_cost;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

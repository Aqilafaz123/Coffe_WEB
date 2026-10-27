<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'quantity', 'unit_price', 'cost_price', 'subtotal'];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
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

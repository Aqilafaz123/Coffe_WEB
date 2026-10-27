<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'unit',
        'stock',
        'min_stock',
        'cost_per_unit',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'decimal:2',
            'min_stock' => 'decimal:2',
            'cost_per_unit' => 'decimal:2',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_ingredients')
            ->withPivot('quantity_required')
            ->withTimestamps();
    }

    public function mutations(): HasMany
    {
        return $this->hasMany(IngredientMutation::class)->latest();
    }

    public function isLowStock(): bool
    {
        return $this->stock <= $this->min_stock;
    }
}

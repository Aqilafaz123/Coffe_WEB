<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'description', 'price', 'cost_price',
        'image', 'is_featured', 'is_active', 'stock',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function calculateUnitCost(): float
    {
        $this->loadMissing('ingredients');
        $recipeCost = (float) $this->ingredients->sum(function ($ing) {
            $qty = (float) ($ing->pivot->quantity_required ?? 0);
            $cost = (float) ($ing->cost_per_unit ?? 0);
            return $qty * $cost;
        });

        if ($recipeCost > 0) {
            return $recipeCost;
        }

        return (float) ($this->cost_price ?? 0);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function productIngredients(): HasMany
    {
        return $this->hasMany(ProductIngredient::class);
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'product_ingredients')
            ->withPivot('quantity_required')
            ->withTimestamps();
    }
}

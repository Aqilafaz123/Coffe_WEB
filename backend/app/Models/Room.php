<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'capacity', 'price_per_hour',
        'image', 'amenities', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_per_hour' => 'decimal:2',
            'amenities' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(RoomReservation::class);
    }
}

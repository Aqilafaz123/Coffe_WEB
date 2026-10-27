<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_number',
        'category',
        'title',
        'amount',
        'expense_date',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function categories(): array
    {
        return [
            'gaji' => 'Gaji Karyawan',
            'utilitas' => 'Listrik, Air & Internet',
            'sewa' => 'Sewa Tempat / Gedung',
            'perlengkapan' => 'Packaging & Perlengkapan',
            'operasional' => 'Operasional Harian',
            'pemasaran' => 'Pemasaran & Promosi',
            'pemeliharaan' => 'Pemeliharaan & Servis',
            'lainnya' => 'Lain-lain',
        ];
    }
}

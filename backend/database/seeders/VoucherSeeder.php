<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        $vouchers = [
            ['code' => 'COFFEE15', 'description' => 'Diskon 15% newsletter', 'type' => 'percent', 'value' => 15, 'min_order' => 50000],
            ['code' => 'WELCOME20', 'description' => 'Diskon 20% member baru', 'type' => 'percent', 'value' => 20, 'min_order' => 75000, 'max_uses' => 100],
            ['code' => 'HEMAT10K', 'description' => 'Potongan Rp 10.000', 'type' => 'fixed', 'value' => 10000, 'min_order' => 50000],
            ['code' => 'KOPI50', 'description' => 'Diskon 50% spesial', 'type' => 'percent', 'value' => 50, 'min_order' => 100000, 'max_uses' => 10],
        ];

        foreach ($vouchers as $voucher) {
            Voucher::firstOrCreate(['code' => $voucher['code']], $voucher);
        }
    }
}

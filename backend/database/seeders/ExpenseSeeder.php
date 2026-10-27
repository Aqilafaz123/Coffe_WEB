<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'superadmin')->first();
        $adminId = $admin ? $admin->id : 1;
        $now = Carbon::now();

        $sampleExpenses = [
            [
                'expense_number' => 'EXP-' . $now->copy()->subDays(20)->format('Ymd') . '-LST01',
                'category' => 'utilitas',
                'title' => 'Tagihan Listrik PLN & Internet Wi-Fi Kafe',
                'amount' => 1850000,
                'expense_date' => $now->copy()->subDays(20)->format('Y-m-d'),
                'notes' => 'Listrik operasional mesin espresso & AC kafe, internet Biznet 100 Mbps',
                'created_by' => $adminId,
            ],
            [
                'expense_number' => 'EXP-' . $now->copy()->subDays(15)->format('Ymd') . '-PKG02',
                'category' => 'perlengkapan',
                'title' => 'Restock Packaging Paper Bag, Cup Holder & Tissue',
                'amount' => 650000,
                'expense_date' => $now->copy()->subDays(15)->format('Y-m-d'),
                'notes' => '500 pcs paper bag sablon, 1000 pcs tissue kafe, 200 pcs cup sleeve',
                'created_by' => $adminId,
            ],
            [
                'expense_number' => 'EXP-' . $now->copy()->subDays(10)->format('Ymd') . '-MNT03',
                'category' => 'pemeliharaan',
                'title' => 'Servis & Kalibrasi Mesin Espresso Nuova Simonelli',
                'amount' => 450000,
                'expense_date' => $now->copy()->subDays(10)->format('Y-m-d'),
                'notes' => 'Pembersihan boiler, penggantian gasket group head dan shower screen',
                'created_by' => $adminId,
            ],
            [
                'expense_number' => 'EXP-' . $now->copy()->subDays(5)->format('Ymd') . '-MKT04',
                'category' => 'pemasaran',
                'title' => 'Iklan Instagram Ads & TikTok Promo Weekend',
                'amount' => 300000,
                'expense_date' => $now->copy()->subDays(5)->format('Y-m-d'),
                'notes' => 'Kampanye digital menu signature baru',
                'created_by' => $adminId,
            ],
            [
                'expense_number' => 'EXP-' . $now->copy()->subDays(2)->format('Ymd') . '-GAJ05',
                'category' => 'gaji',
                'title' => 'Gaji Mingguan Barista & Staff Kasir (Shift 1)',
                'amount' => 2400000,
                'expense_date' => $now->copy()->subDays(2)->format('Y-m-d'),
                'notes' => 'Pembayaran honor mingguan 2 barista dan 1 kasir',
                'created_by' => $adminId,
            ],
            [
                'expense_number' => 'EXP-' . $now->copy()->format('Ymd') . '-OPS06',
                'category' => 'operasional',
                'title' => 'Pembelian Es Batu Kristal & Gas Elpiji',
                'amount' => 120000,
                'expense_date' => $now->copy()->format('Y-m-d'),
                'notes' => '5 kantong es batu kristal higienis dan 1 tabung gas 12kg',
                'created_by' => $adminId,
            ],
        ];

        foreach ($sampleExpenses as $expenseData) {
            Expense::firstOrCreate(
                ['expense_number' => $expenseData['expense_number']],
                $expenseData
            );
        }
    }
}

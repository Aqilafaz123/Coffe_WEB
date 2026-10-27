<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\IngredientMutation;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LogisticsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Logistics User
        $logisticsUser = User::firstOrCreate(
            ['email' => 'logistik@coffee.shop'],
            [
                'name' => 'Staff Logistik',
                'password' => Hash::make('password'),
                'role' => 'logistics',
                'phone' => '081234567899',
            ]
        );

        // 2. Create Sample Ingredients
        $ingredientsData = [
            [
                'name' => 'Biji Kopi Espresso (Arabika)',
                'code' => 'BB-KPI-01',
                'unit' => 'gram',
                'stock' => 5000,
                'min_stock' => 500,
                'cost_per_unit' => 250, // Rp 250/gram = Rp 250.000/kg
            ],
            [
                'name' => 'Susu Fresh Milk UHT',
                'code' => 'BB-SSU-01',
                'unit' => 'ml',
                'stock' => 10000,
                'min_stock' => 1000,
                'cost_per_unit' => 22, // Rp 22/ml = Rp 22.000/liter
            ],
            [
                'name' => 'Sirup Gula Aren Organik',
                'code' => 'BB-GLA-01',
                'unit' => 'ml',
                'stock' => 3000,
                'min_stock' => 300,
                'cost_per_unit' => 35, // Rp 35/ml
            ],
            [
                'name' => 'Bubuk Cokelat Murni',
                'code' => 'BB-CKL-01',
                'unit' => 'gram',
                'stock' => 2000,
                'min_stock' => 200,
                'cost_per_unit' => 180,
            ],
            [
                'name' => 'Cup Dingin 16oz + Tutup',
                'code' => 'BB-CUP-16',
                'unit' => 'pcs',
                'stock' => 250,
                'min_stock' => 30,
                'cost_per_unit' => 1200,
            ],
            [
                'name' => 'Cup Panas 8oz',
                'code' => 'BB-CUP-08',
                'unit' => 'pcs',
                'stock' => 200,
                'min_stock' => 25,
                'cost_per_unit' => 900,
            ],
            [
                'name' => 'Sedotan Ramah Lingkungan',
                'code' => 'BB-SDT-01',
                'unit' => 'pcs',
                'stock' => 400,
                'min_stock' => 50,
                'cost_per_unit' => 150,
            ],
        ];

        $ingredientMap = [];
        foreach ($ingredientsData as $data) {
            $ing = Ingredient::firstOrCreate(['code' => $data['code']], $data);
            $ingredientMap[$data['name']] = $ing;

            // Mutation log if none exists
            if ($ing->mutations()->count() === 0) {
                IngredientMutation::create([
                    'ingredient_id' => $ing->id,
                    'type' => 'in',
                    'quantity' => $ing->stock,
                    'previous_stock' => 0,
                    'current_stock' => $ing->stock,
                    'notes' => 'Stok awal bahan baku dari pemasok',
                    'user_id' => $logisticsUser->id,
                ]);
            }
        }

        // 3. Connect recipes to existing products
        $recipes = [
            'Lungo Coffee' => [
                'Biji Kopi Espresso (Arabika)' => 18,
                'Cup Panas 8oz' => 1,
            ],
            'Classic Cappuccino' => [
                'Biji Kopi Espresso (Arabika)' => 18,
                'Susu Fresh Milk UHT' => 150,
                'Cup Panas 8oz' => 1,
            ],
            'Iced Coffee Latte' => [
                'Biji Kopi Espresso (Arabika)' => 18,
                'Susu Fresh Milk UHT' => 180,
                'Cup Dingin 16oz + Tutup' => 1,
                'Sedotan Ramah Lingkungan' => 1,
            ],
            'Iced Americano' => [
                'Biji Kopi Espresso (Arabika)' => 18,
                'Cup Dingin 16oz + Tutup' => 1,
                'Sedotan Ramah Lingkungan' => 1,
            ],
            'Dalgona Coffee' => [
                'Biji Kopi Espresso (Arabika)' => 20,
                'Susu Fresh Milk UHT' => 200,
                'Sirup Gula Aren Organik' => 25,
                'Cup Dingin 16oz + Tutup' => 1,
                'Sedotan Ramah Lingkungan' => 1,
            ],
            'Cold Brew' => [
                'Biji Kopi Espresso (Arabika)' => 25,
                'Cup Dingin 16oz + Tutup' => 1,
                'Sedotan Ramah Lingkungan' => 1,
            ],
        ];

        foreach ($recipes as $productName => $items) {
            $product = Product::where('name', $productName)->first();
            if (! $product) {
                continue;
            }

            $syncData = [];
            foreach ($items as $ingName => $qty) {
                if (isset($ingredientMap[$ingName])) {
                    $syncData[$ingredientMap[$ingName]->id] = [
                        'quantity_required' => $qty,
                    ];
                }
            }

            $product->ingredients()->sync($syncData);
        }
    }
}

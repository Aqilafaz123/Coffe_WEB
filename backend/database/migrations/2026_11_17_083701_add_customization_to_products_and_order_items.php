<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_customizable')->default(false)->after('is_active');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->json('options')->nullable()->after('quantity');
            $table->text('notes')->nullable()->after('options');
        });

        // Backfill: Set is_customizable = true for coffee and beverages, leave dessert / ice cream / food as false
        try {
            DB::table('products')
                ->whereIn('category_id', function ($query) {
                    $query->select('id')
                        ->from('categories')
                        ->whereIn('slug', ['hot-coffee', 'cold-coffee', 'cup-coffee']);
                })
                ->orWhere('name', 'like', '%Coffee%')
                ->orWhere('name', 'like', '%Kopi%')
                ->orWhere('name', 'like', '%Latte%')
                ->orWhere('name', 'like', '%Cappuccino%')
                ->orWhere('name', 'like', '%Frappe%')
                ->orWhere('name', 'like', '%Brew%')
                ->orWhere('name', 'like', '%Macchiato%')
                ->update(['is_customizable' => true]);

            // Ensure dessert items (like Es Cream, Cakes) are explicitly false
            DB::table('products')
                ->whereIn('category_id', function ($query) {
                    $query->select('id')
                        ->from('categories')
                        ->where('slug', 'dessert');
                })
                ->update(['is_customizable' => false]);
        } catch (\Throwable $e) {
            // Log or ignore if categories table doesn't match yet
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['options', 'notes']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_customizable');
        });
    }
};

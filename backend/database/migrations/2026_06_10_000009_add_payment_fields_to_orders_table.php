<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('awaiting_payment', 'pending', 'preparing', 'completed', 'cancelled') NOT NULL DEFAULT 'awaiting_payment'");

        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('status');
            $table->enum('payment_status', ['unpaid', 'paid', 'failed'])->default('unpaid')->after('payment_method');
            $table->timestamp('paid_at')->nullable()->after('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_status', 'paid_at']);
        });

        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'preparing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedTinyInteger('qris_code')->nullable();
            $table->unsignedTinyInteger('qris_slot')->nullable()->unique();
            $table->decimal('qris_amount', 12, 2)->nullable();
            $table->string('payment_proof_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['qris_slot']);
            $table->dropColumn(['qris_code', 'qris_slot', 'qris_amount', 'payment_proof_path']);
        });
    }
};

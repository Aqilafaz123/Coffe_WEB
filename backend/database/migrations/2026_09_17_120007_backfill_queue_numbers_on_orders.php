<?php

use App\Models\Order;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For each date, assign sequential queue numbers to orders that have queue_number == null
        $dates = DB::table('orders')
            ->selectRaw('DATE(created_at) as order_date')
            ->distinct()
            ->pluck('order_date');

        foreach ($dates as $date) {
            $orders = Order::whereDate('created_at', $date)
                ->whereNull('queue_number')
                ->orderBy('created_at')
                ->orderBy('id')
                ->get();

            $maxQueue = Order::whereDate('created_at', $date)
                ->whereNotNull('queue_number')
                ->max('queue_number') ?? 0;

            foreach ($orders as $order) {
                $maxQueue++;
                $order->update(['queue_number' => $maxQueue]);
            }
        }
    }

    public function down(): void
    {
        // No-op
    }
};

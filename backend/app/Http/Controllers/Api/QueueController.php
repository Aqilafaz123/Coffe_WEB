<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QueueController extends Controller
{
    /**
     * GET /queue/status?order_id=X
     * Returns the customer's queue number and the currently called number.
     */
    public function status(Request $request): JsonResponse
    {
        $order = Order::where('id', $request->query('order_id'))
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if (is_null($order->queue_number)) {
            return response()->json([
                'has_queue'      => false,
                'message'        => 'Pesanan ini belum memiliki nomor antrian.',
                'order_status'   => $order->status,
                'payment_status' => $order->payment_status,
            ]);
        }

        // The currently called queue number (latest queue_called_at today)
        $currentCalled = Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->orderByDesc('queue_called_at')
            ->value('queue_number') ?? 0;

        $isReady = $order->queue_number <= $currentCalled;

        // How many orders are ahead of this one
        $ahead = Order::whereDate('created_at', today())
            ->whereNotNull('queue_number')
            ->where('queue_number', '>', $currentCalled)
            ->where('queue_number', '<', $order->queue_number)
            ->count();

        return response()->json([
            'has_queue'      => true,
            'queue_number'   => $order->queue_number,
            'current_called' => $currentCalled,
            'orders_ahead'   => $ahead,
            'is_ready'       => $isReady,
            'order_status'   => $order->status,
            'payment_status' => $order->payment_status,
            'order_number'   => $order->order_number,
        ]);
    }

    /**
     * GET /queue/current  (cashier panel)
     * Returns the currently called number and all today's queued orders.
     */
    public function current(Request $request): JsonResponse
    {
        $currentCalled = Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->orderByDesc('queue_called_at')
            ->value('queue_number') ?? 0;

        $orders = Order::with(['user', 'items.product'])
            ->whereDate('created_at', today())
            ->whereNotNull('queue_number')
            ->orderBy('queue_number')
            ->get()
            ->map(fn($o) => [
                'id'             => $o->id,
                'queue_number'   => $o->queue_number,
                'order_number'   => $o->order_number,
                'customer_name'  => $o->customer_name,
                'status'         => $o->status,
                'is_called'      => $o->queue_number <= $currentCalled,
            ]);

        $nextQueue = Order::whereDate('created_at', today())
            ->whereNotNull('queue_number')
            ->where('queue_number', '>', $currentCalled)
            ->min('queue_number');

        return response()->json([
            'current_called' => $currentCalled,
            'next_queue'     => $nextQueue,
            'orders'         => $orders,
        ]);
    }

    /**
     * PATCH /queue/call  (cashier/admin)
     * Calls the next queue number.
     */
    public function call(Request $request): JsonResponse
    {
        $currentCalled = Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->orderByDesc('queue_called_at')
            ->value('queue_number') ?? 0;

        $nextOrder = Order::whereDate('created_at', today())
            ->whereNotNull('queue_number')
            ->where('queue_number', '>', $currentCalled)
            ->orderBy('queue_number')
            ->first();

        if (! $nextOrder) {
            return response()->json(['message' => 'Tidak ada antrian berikutnya.'], 422);
        }

        $nextOrder->update(['queue_called_at' => now()]);

        return response()->json([
            'message'        => "Antrian #{$nextOrder->queue_number} dipanggil.",
            'current_called' => $nextOrder->queue_number,
            'order'          => $nextOrder->load(['user', 'items.product']),
        ]);
    }

    /**
     * POST /queue/reset  (admin only)
     * Resets today's queue called state.
     */
    public function reset(Request $request): JsonResponse
    {
        Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->update(['queue_called_at' => null]);

        return response()->json(['message' => 'Antrian hari ini berhasil direset.']);
    }
}

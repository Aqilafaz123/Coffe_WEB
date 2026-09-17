<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    /**
     * GET /queue/now-serving (public)
     * Returns the currently called queue number and total queued today.
     */
    public function nowServing(): JsonResponse
    {
        $currentCalled = Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->orderByDesc('queue_called_at')
            ->value('queue_number') ?? 0;

        $totalWaiting = Order::whereDate('created_at', today())
            ->whereNotNull('queue_number')
            ->where('queue_number', '>', $currentCalled)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();

        $totalToday = Order::whereDate('created_at', today())
            ->whereNotNull('queue_number')
            ->count();

        return response()->json([
            'current_called' => (int) $currentCalled,
            'total_waiting'  => (int) $totalWaiting,
            'total_today'    => (int) $totalToday,
        ]);
    }

    /**
     * GET /queue/status?order_id=X or order_number=ORD-XXXX
     * Returns the customer's queue number and current progress.
     */
    public function status(Request $request): JsonResponse
    {
        $identifier = $request->query('order_id') ?? $request->query('order_number');

        if (! $identifier) {
            return response()->json(['message' => 'Parameter order_id atau order_number diperlukan.'], 400);
        }

        $query = Order::with(['items.product', 'user']);

        if (is_numeric($identifier)) {
            $query->where(function ($q) use ($identifier) {
                $q->where('id', $identifier)
                  ->orWhere('order_number', $identifier);
            });
        } else {
            $query->where('order_number', $identifier);
        }

        $user = $request->user();
        if ($user && $user->role === 'user') {
            $order = (clone $query)->where('user_id', $user->id)->first() ?? $query->first();
        } else {
            $order = $query->first();
        }

        if (! $order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.'], 404);
        }

        // Auto-assign queue number if still missing
        if (is_null($order->queue_number)) {
            $order->assignQueueNumber();
            $order->refresh();
        }

        $currentCalled = Order::whereDate('created_at', $order->created_at ? $order->created_at->format('Y-m-d') : today())
            ->whereNotNull('queue_called_at')
            ->orderByDesc('queue_called_at')
            ->value('queue_number') ?? 0;

        $isReady = $order->queue_number <= $currentCalled;

        $ahead = Order::whereDate('created_at', $order->created_at ? $order->created_at->format('Y-m-d') : today())
            ->whereNotNull('queue_number')
            ->where('queue_number', '>', $currentCalled)
            ->where('queue_number', '<', $order->queue_number)
            ->count();

        return response()->json([
            'id'             => $order->id,
            'has_queue'      => true,
            'queue_number'   => $order->queue_number,
            'current_called' => (int) $currentCalled,
            'orders_ahead'   => max(0, $ahead),
            'is_ready'       => $isReady,
            'order_status'   => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment_method,
            'order_number'   => $order->order_number,
            'customer_name'  => $order->customer_name,
            'table_location' => $order->table_location,
            'total'          => $order->total,
            'items'          => $order->items->map(fn ($i) => [
                'name'     => $i->product?->name ?? 'Produk',
                'quantity' => $i->quantity,
                'subtotal' => $i->subtotal,
            ]),
            'created_at'     => $order->created_at->toIso8601String(),
        ]);
    }

    /**
     * GET /queue/track?query=ORD-XXXX (public track by order number or phone)
     */
    public function track(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('query', ''));

        if (strlen($q) < 3) {
            return response()->json(['message' => 'Masukkan minimal 3 karakter untuk mencari pesanan.'], 422);
        }

        $orders = Order::with(['items.product', 'user'])
            ->where(function ($query) use ($q) {
                $query->where('order_number', 'like', "%{$q}%")
                      ->orWhere('guest_phone', 'like', "%{$q}%")
                      ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', "%{$q}%"));
            })
            ->latest()
            ->limit(5)
            ->get();

        if ($orders->isEmpty()) {
            return response()->json(['message' => 'Tidak ada pesanan yang sesuai dengan pencarian.', 'orders' => []], 404);
        }

        $currentCalled = Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->orderByDesc('queue_called_at')
            ->value('queue_number') ?? 0;

        $data = $orders->map(function ($order) use ($currentCalled) {
            if (is_null($order->queue_number)) {
                $order->assignQueueNumber();
                $order->refresh();
            }

            $ahead = Order::whereDate('created_at', today())
                ->whereNotNull('queue_number')
                ->where('queue_number', '>', $currentCalled)
                ->where('queue_number', '<', $order->queue_number)
                ->count();

            return [
                'id'             => $order->id,
                'order_number'   => $order->order_number,
                'queue_number'   => $order->queue_number,
                'status'         => $order->status,
                'payment_status' => $order->payment_status,
                'customer_name'  => $order->customer_name,
                'table_location' => $order->table_location,
                'total'          => $order->total,
                'is_ready'       => $order->queue_number <= $currentCalled,
                'orders_ahead'   => max(0, $ahead),
                'created_at'     => $order->created_at->toIso8601String(),
                'items_summary'  => $order->items->map(fn ($i) => "{$i->quantity}x {$i->product?->name}")->join(', '),
            ];
        });

        return response()->json([
            'current_called' => (int) $currentCalled,
            'orders'         => $data,
        ]);
    }

    /**
     * GET /queue/active (auth user active orders)
     */
    public function active(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = Order::with(['items.product'])
            ->where('user_id', $user->id)
            ->whereNotIn('status', ['cancelled'])
            ->where('created_at', '>=', now()->subDays(2))
            ->latest()
            ->limit(5)
            ->get();

        $currentCalled = Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->orderByDesc('queue_called_at')
            ->value('queue_number') ?? 0;

        $data = $orders->map(function ($order) use ($currentCalled) {
            if (is_null($order->queue_number)) {
                $order->assignQueueNumber();
                $order->refresh();
            }

            $ahead = Order::whereDate('created_at', today())
                ->whereNotNull('queue_number')
                ->where('queue_number', '>', $currentCalled)
                ->where('queue_number', '<', $order->queue_number)
                ->count();

            return [
                'id'             => $order->id,
                'order_number'   => $order->order_number,
                'queue_number'   => $order->queue_number,
                'status'         => $order->status,
                'payment_status' => $order->payment_status,
                'table_location' => $order->table_location,
                'total'          => $order->total,
                'is_ready'       => $order->queue_number <= $currentCalled,
                'orders_ahead'   => max(0, $ahead),
                'created_at'     => $order->created_at->toIso8601String(),
                'items_summary'  => $order->items->map(fn ($i) => "{$i->quantity}x {$i->product?->name}")->join(', '),
            ];
        });

        return response()->json([
            'current_called' => (int) $currentCalled,
            'orders'         => $data,
        ]);
    }

    /**
     * GET /queue/current (cashier panel)
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
            ->map(fn ($o) => [
                'id'            => $o->id,
                'queue_number'  => $o->queue_number,
                'order_number'  => $o->order_number,
                'customer_name' => $o->customer_name,
                'status'        => $o->status,
                'is_called'     => $o->queue_number <= $currentCalled,
            ]);

        $nextQueue = Order::whereDate('created_at', today())
            ->whereNotNull('queue_number')
            ->where('queue_number', '>', $currentCalled)
            ->min('queue_number');

        return response()->json([
            'current_called' => (int) $currentCalled,
            'next_queue'     => $nextQueue,
            'orders'         => $orders,
        ]);
    }

    /**
     * PATCH /queue/call (cashier/admin)
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
     * POST /queue/reset (admin only)
     */
    public function reset(Request $request): JsonResponse
    {
        Order::whereDate('created_at', today())
            ->whereNotNull('queue_called_at')
            ->update(['queue_called_at' => null]);

        return response()->json(['message' => 'Antrian hari ini berhasil direset.']);
    }
}

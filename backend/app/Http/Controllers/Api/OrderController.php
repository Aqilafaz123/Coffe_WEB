<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderPaymentService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperadmin() || $user->isCashier()) {
            $query = Order::with(['user', 'items.product', 'processor']);

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('date')) {
                $query->whereDate('created_at', $request->date);
            }

            return response()->json($query->latest()->get());
        }

        return response()->json(
            $user->orders()->with(['items.product'])->latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();

        $rules = [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'table_location' => ['required', 'string', 'max:100'],
            'discount' => ['nullable', 'numeric', 'min:0'],
        ];

        $guestName = null;
        $guestPhone = null;

        if ($authUser->isSuperadmin() || $authUser->isCashier()) {
            $rules['user_id'] = ['nullable', 'exists:users,id', 'required_without:guest_name'];
            $rules['guest_name'] = ['nullable', 'string', 'max:255', 'required_without:user_id'];
            $rules['guest_phone'] = ['nullable', 'string', 'max:20'];
        }

        $validated = $request->validate($rules);

        $orderUserId = $authUser->id;

        if ($authUser->isSuperadmin() || $authUser->isCashier()) {
            $staffNote = '[Dipesan oleh: '.$authUser->name.' ('.($authUser->isCashier() ? 'Kasir' : 'Admin').')]';
            $validated['notes'] = trim($staffNote.($validated['notes'] ? "\n\n".$validated['notes'] : ''));

            if (! empty($validated['user_id'])) {
                $customer = User::findOrFail($validated['user_id']);

                if ($customer->role !== 'user') {
                    return response()->json([
                        'message' => 'Pesanan hanya dapat dibuat untuk akun pelanggan (user).',
                    ], 422);
                }

                $orderUserId = $customer->id;
            } else {
                $orderUserId = null;
                $guestName = $validated['guest_name'];
                $guestPhone = $validated['guest_phone'] ?? null;
            }
        }

        $order = DB::transaction(function () use ($validated, $orderUserId, $guestName, $guestPhone) {
            $subtotal = 0;
            $orderItems = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    abort(422, "Stok {$product->name} tidak mencukupi.");
                }

                $lineSubtotal = $product->price * $item['quantity'];
                $subtotal += $lineSubtotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal' => $lineSubtotal,
                ];

                $product->decrement('stock', $item['quantity']);
            }

            $discount = $validated['discount'] ?? 0;
            $total = max(0, $subtotal - $discount);

            $order = Order::create([
                'order_number' => 'ORD-'.strtoupper(Str::random(8)),
                'user_id' => $orderUserId,
                'guest_name' => $guestName,
                'guest_phone' => $guestPhone,
                'table_location' => $validated['table_location'],
                'status' => 'awaiting_payment',
                'payment_status' => 'unpaid',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            return $order;
        });

        return response()->json($order->load(['items.product']), 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['user', 'items.product', 'processor']));
    }

    public function receipt(Request $request, Order $order): Response|JsonResponse
    {
        if (! $this->canAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($order->payment_status !== 'paid') {
            return response()->json(['message' => 'Struk hanya tersedia untuk pesanan yang sudah dibayar.'], 422);
        }

        $order->load(['user', 'items.product']);

        $paymentLabels = [
            'qris' => 'QRIS',
            'gopay' => 'GoPay',
            'ovo' => 'OVO',
            'dana' => 'DANA',
            'bank_transfer' => 'Transfer Bank',
            'card' => 'Kartu Debit/Kredit',
            'cash' => 'Tunai',
        ];

        $formatPrice = fn ($amount) => 'Rp '.number_format((float) $amount, 0, ',', '.');

        $pdf = Pdf::loadView('receipts.order', [
            'order' => $order,
            'paymentLabel' => $paymentLabels[$order->payment_method] ?? $order->payment_method ?? '-',
            'formatPrice' => $formatPrice,
        ])->setPaper([0, 0, 226.77, 841.89], 'portrait');

        $filename = 'struk-'.$order->order_number.'.pdf';

        return $pdf->download($filename);
    }

    public function processPayment(Request $request, Order $order, OrderPaymentService $paymentService): JsonResponse
    {
        if ($order->status !== 'awaiting_payment') {
            return response()->json(['message' => 'Pesanan ini sudah dibayar atau tidak valid.'], 422);
        }

        if (! $this->canAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'in:cash'],
        ]);

        $user = $request->user();

        if ($user->isSuperadmin() || $user->isCashier()) {
            $order = $paymentService->markAsPaid($order, $validated['payment_method']);

            return response()->json($order);
        }

        $order->update(['payment_method' => 'cash']);

        return response()->json([
            'message' => 'Silakan bayar tunai di kasir.',
            'order' => $order->fresh()->load(['user', 'items.product']),
        ]);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        if ($order->status !== 'awaiting_payment') {
            return response()->json(['message' => 'Hanya pesanan yang belum dibayar yang dapat dibatalkan.'], 422);
        }

        if (! $this->canAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
            }

            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
            ]);
        });

        return response()->json(['message' => 'Pesanan dibatalkan.']);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,preparing,completed,cancelled'],
        ]);

        if ($order->status === 'awaiting_payment') {
            return response()->json(['message' => 'Pesanan harus dibayar terlebih dahulu.'], 422);
        }

        $updateData = [
            'status'       => $validated['status'],
            'processed_by' => $request->user()->id,
            'completed_at' => $validated['status'] === 'completed' ? now() : null,
        ];

        // Auto-assign daily queue number when order moves to 'pending'
        if ($validated['status'] === 'pending' && is_null($order->queue_number)) {
            $maxQueue = Order::whereDate('created_at', today())
                ->whereNotNull('queue_number')
                ->max('queue_number') ?? 0;
            $updateData['queue_number'] = $maxQueue + 1;
        }

        $order->update($updateData);

        return response()->json($order->load(['user', 'items.product', 'processor']));
    }

    private function canAccessOrder(User $user, Order $order): bool
    {
        if ($user->isSuperadmin() || $user->isCashier()) {
            return true;
        }

        return $order->user_id === $user->id;
    }
}

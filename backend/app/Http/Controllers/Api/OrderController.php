<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderPaymentService;
use App\Services\QrisService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
        abort_if($request->input('order_source') === 'pos' && ! $authUser->isCashier() && ! $authUser->isSuperadmin(), 403, 'POS hanya tersedia untuk kasir.');

        $rules = [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'table_location' => ['nullable', 'string', 'max:100'],
            'discount' => ['nullable', 'numeric', 'min:0'],
        ];

        $guestName = null;
        $guestPhone = null;

        if ($authUser->isSuperadmin() || $authUser->isCashier()) {
            $rules['order_source'] = ['sometimes', 'in:pos,online'];
            $rules['user_id'] = ['nullable', 'exists:users,id'];
            $rules['guest_name'] = ['nullable', 'string', 'max:255'];
            $rules['guest_phone'] = ['nullable', 'string', 'max:20'];
        }

        $validated = $request->validate($rules);

        $orderUserId = $authUser->id;

        if ($authUser->isSuperadmin() || $authUser->isCashier()) {
            $staffNote = '[Dipesan oleh: '.$authUser->name.' ('.($authUser->isCashier() ? 'Kasir' : 'Admin').')]';
            $validated['notes'] = trim($staffNote.(($validated['notes'] ?? null) ? "\n\n".$validated['notes'] : ''));

            if (! empty($validated['user_id'])) {
                $customer = User::find($validated['user_id']);
                $orderUserId = $customer ? $customer->id : $authUser->id;
            } elseif (! empty($validated['guest_name'])) {
                $orderUserId = null;
                $guestName = trim($validated['guest_name']);
                $guestPhone = $validated['guest_phone'] ?? null;
            } else {
                $orderUserId = $authUser->id;
                $guestName = null;
                $guestPhone = null;
            }
        }

        $order = DB::transaction(function () use ($validated, $orderUserId, $guestName, $guestPhone) {
            $subtotal = 0;
            $orderItems = [];

            foreach ($validated['items'] as $item) {
                $product = Product::whereKey($item['product_id'])->lockForUpdate()->firstOrFail();
                abort_unless($product->is_active, 422, 'Produk tidak aktif.');

                if ($product->stock < $item['quantity']) {
                    abort(422, "Stok {$product->name} tidak mencukupi.");
                }

                $lineSubtotal = $product->price * $item['quantity'];
                $subtotal += $lineSubtotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'cost_price' => $product->calculateUnitCost(),
                    'subtotal' => $lineSubtotal,
                ];

                $product->decrement('stock', $item['quantity']);
            }

            $discount = $validated['discount'] ?? 0;
            $total = max(0, $subtotal - $discount);

            $order = Order::create([
                'order_source' => $validated['order_source'] ?? 'online',
                'order_number' => 'ORD-'.strtoupper(Str::random(8)),
                'user_id' => $orderUserId,
                'guest_name' => $guestName,
                'guest_phone' => $guestPhone,
                'table_location' => $validated['table_location'] ?? null,
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

    public function show(Request $request, Order $order): JsonResponse
    {
        abort_unless($this->canAccessOrder($request->user(), $order), 403);

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

    public function cashierReceipt(Request $request, Order $order): Response|JsonResponse
    {
        $user = $request->user();
        if (! $user->isSuperadmin() && ! $user->isCashier() && ! $user->isLogistics()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $order->load(['user', 'items.product.ingredients', 'processor']);

        $paymentLabels = [
            'qris' => 'QRIS',
            'gopay' => 'GoPay',
            'ovo' => 'OVO',
            'dana' => 'DANA',
            'bank_transfer' => 'Transfer Bank',
            'card' => 'Kartu Debit/Kredit',
            'cash' => 'Tunai',
        ];

        // Aggregate all ingredients used in this order
        $inventoryBreakdown = [];
        foreach ($order->items as $item) {
            if (! $item->product) {
                continue;
            }
            foreach ($item->product->ingredients as $ingredient) {
                $qtyRequired = (float) ($ingredient->pivot->quantity_required ?? 0);
                $totalUsed = $qtyRequired * $item->quantity;
                $ingId = $ingredient->id;

                if (! isset($inventoryBreakdown[$ingId])) {
                    $inventoryBreakdown[$ingId] = [
                        'name' => $ingredient->name,
                        'unit' => $ingredient->unit,
                        'total_used' => 0,
                        'current_stock' => (float) $ingredient->stock,
                    ];
                }
                $inventoryBreakdown[$ingId]['total_used'] += $totalUsed;
            }
        }

        $formatPrice = fn ($amount) => 'Rp '.number_format((float) $amount, 0, ',', '.');

        $pdf = Pdf::loadView('receipts.cashier', [
            'order' => $order,
            'paymentLabel' => $paymentLabels[$order->payment_method] ?? $order->payment_method ?? '-',
            'inventoryBreakdown' => array_values($inventoryBreakdown),
            'formatPrice' => $formatPrice,
        ])->setPaper([0, 0, 226.77, 841.89], 'portrait');

        $filename = 'tiket-kasir-'.$order->order_number.'.pdf';

        return $pdf->download($filename);
    }

    public function qris(Request $request, Order $order, QrisService $qris): JsonResponse
    {
        abort_unless($this->canAccessOrder($request->user(), $order), 403);
        abort_unless($order->status === 'awaiting_payment' && $order->payment_status !== 'paid', 422, 'Pesanan tidak dapat dibayar.');
        try {
            $order = $qris->prepare($order);
            $payload = $qris->payload((string) $order->qris_amount);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['payload' => $payload, 'total' => $order->qris_amount, 'unique_code' => $order->qris_code, 'order' => $order]);
    }

    public function uploadPaymentProof(Request $request, Order $order): JsonResponse
    {
        abort_unless($this->canAccessOrder($request->user(), $order), 403);
        $request->validate(['proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048']]);

        return DB::transaction(function () use ($request, $order) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            abort_unless($order->status === 'awaiting_payment' && $order->payment_method === 'qris' && $order->qris_amount !== null, 422, 'Buat QRIS sebelum mengunggah bukti.');
            $path = $request->file('proof')->store('payment-proofs', 'local');
            abort_unless($path, 500, 'Bukti gagal disimpan.');
            $old = $order->payment_proof_path;
            $order->update(['payment_proof_path' => $path]);
            if ($old) {
                Storage::disk('local')->delete($old);
            }

            return response()->json($order);
        });
    }

    public function paymentProof(Request $request, Order $order)
    {
        abort_unless($this->canAccessOrder($request->user(), $order), 403);
        abort_unless($order->payment_proof_path, 404);

        return Storage::disk('local')->response($order->payment_proof_path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
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
            'payment_method' => ['required', 'in:cash,qris'],
            'cash_received' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
        ]);

        $user = $request->user();
        abort_if($validated['payment_method'] === 'cash' && $order->has_payment_proof, 422, 'Bukti QRIS sudah dikirim; periksa pembayaran QRIS.');
        if ($validated['payment_method'] === 'qris' && ($user->isSuperadmin() || $user->isCashier())) {
            abort_unless($order->qris_amount !== null && ($order->has_payment_proof || $order->order_source === 'pos'), 422, 'Nominal QRIS dan bukti bayar harus tersedia.');
        }

        if ($user->isSuperadmin() || $user->isCashier()) {
            if ($order->order_source === 'pos' && $validated['payment_method'] === 'cash') {
                abort_unless(isset($validated['cash_received']) && (float) $validated['cash_received'] >= (float) $order->total, 422, 'Uang diterima kurang dari total belanja.');
            }
            $order = DB::transaction(function () use ($order, $paymentService, $validated) {
                if ($validated['payment_method'] === 'cash' && isset($validated['cash_received'])) {
                    $order->update(['cash_received' => $validated['cash_received']]);
                }

                return $paymentService->markAsPaid($order, $validated['payment_method']);
            });

            return response()->json($order);
        }

        abort_if($validated['payment_method'] === 'qris', 403, 'Pembayaran QRIS harus dikonfirmasi kasir.');

        $order->update(['payment_method' => 'cash', 'qris_slot' => null, 'qris_code' => null, 'qris_amount' => null]);

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
                'qris_slot' => null,
            ]);
        });

        return response()->json(['message' => 'Pesanan dibatalkan.']);
    }

    public function updateStatus(Request $request, Order $order, OrderPaymentService $paymentService): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,preparing,completed,cancelled'],
        ]);

        if ($order->status === 'awaiting_payment') {
            return response()->json(['message' => 'Pesanan harus dibayar terlebih dahulu.'], 422);
        }

        DB::transaction(function () use ($validated, $request, $order, $paymentService) {
            if ($validated['status'] === 'cancelled' && $order->status !== 'cancelled') {
                foreach ($order->items as $item) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
                if ($order->payment_status === 'paid') {
                    $paymentService->restoreOrderIngredients($order);
                }
            }

            $updateData = [
                'status' => $validated['status'],
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
        });

        return response()->json($order->fresh()->load(['user', 'items.product', 'processor']));
    }

    private function canAccessOrder(User $user, Order $order): bool
    {
        if ($user->isSuperadmin() || $user->isCashier()) {
            return true;
        }

        return $order->user_id === $user->id;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class VoucherController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Voucher::latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateVoucher($request);

        $voucher = Voucher::create($validated);

        return response()->json($voucher, 201);
    }

    public function update(Request $request, Voucher $voucher): JsonResponse
    {
        $validated = $this->validateVoucher($request, $voucher->id);

        $voucher->update($validated);

        return response()->json($voucher);
    }

    public function destroy(Voucher $voucher): JsonResponse
    {
        $voucher->delete();

        return response()->json(['message' => 'Voucher berhasil dihapus.']);
    }

    public function validateCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $voucher = Voucher::where('code', strtoupper(trim($validated['code'])))->first();

        if (! $voucher || ! $voucher->isValid()) {
            return response()->json(['message' => 'Kode voucher tidak valid atau sudah kadaluarsa.'], 422);
        }

        if ($validated['subtotal'] < $voucher->min_order) {
            return response()->json([
                'message' => 'Minimal belanja '.number_format($voucher->min_order, 0, ',', '.').' untuk voucher ini.',
            ], 422);
        }

        $discount = $voucher->calculateDiscount((float) $validated['subtotal']);

        return response()->json([
            'code' => $voucher->code,
            'description' => $voucher->description,
            'type' => $voucher->type,
            'value' => $voucher->value,
            'discount' => $discount,
            'total' => max(0, $validated['subtotal'] - $discount),
        ]);
    }

    public function applyToOrder(Request $request, Order $order): JsonResponse
    {
        if ($order->status !== 'awaiting_payment') {
            return response()->json(['message' => 'Voucher hanya bisa dipakai untuk pesanan yang belum dibayar.'], 422);
        }

        if (! $this->canAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $voucher = Voucher::where('code', strtoupper(trim($validated['code'])))->first();

        if (! $voucher || ! $voucher->isValid()) {
            return response()->json(['message' => 'Kode voucher tidak valid atau sudah kadaluarsa.'], 422);
        }

        if ($order->subtotal < $voucher->min_order) {
            return response()->json([
                'message' => 'Minimal belanja '.number_format($voucher->min_order, 0, ',', '.').' untuk voucher ini.',
            ], 422);
        }

        $discount = $voucher->calculateDiscount((float) $order->subtotal);

        $order->update([
            'voucher_code' => $voucher->code,
            'discount' => $discount,
            'total' => max(0, $order->subtotal - $discount),
        ]);

        return response()->json($order->load(['items.product']));
    }

    public function removeFromOrder(Request $request, Order $order): JsonResponse
    {
        if ($order->status !== 'awaiting_payment') {
            return response()->json(['message' => 'Tidak dapat menghapus voucher.'], 422);
        }

        if (! $this->canAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $order->update([
            'voucher_code' => null,
            'discount' => 0,
            'total' => $order->subtotal,
        ]);

        return response()->json($order->load(['items.product']));
    }

    private function validateVoucher(Request $request, ?int $ignoreId = null): array
    {
        $uniqueRule = 'unique:vouchers,code';
        if ($ignoreId) {
            $uniqueRule .= ','.$ignoreId;
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', $uniqueRule],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:percent,fixed'],
            'value' => ['required', 'numeric', 'min:1'],
            'min_order' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);

        if ($validated['type'] === 'percent') {
            if ($validated['value'] > 100) {
                throw ValidationException::withMessages([
                    'value' => ['Persentase diskon maksimal 100%.'],
                ]);
            }
            $validated['value'] = (int) $validated['value'];
        } else {
            $validated['value'] = (int) $validated['value'];
        }

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['min_order'] = $validated['min_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        return $validated;
    }

    private function canAccessOrder($user, Order $order): bool
    {
        if ($user->isSuperadmin() || $user->isCashier()) {
            return true;
        }

        return $order->user_id === $user->id;
    }
}

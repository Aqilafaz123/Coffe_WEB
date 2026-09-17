<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Services\MidtransService;
use App\Services\OrderPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MidtransController extends Controller
{
    public function snapToken(Request $request, Order $order, MidtransService $midtrans): JsonResponse
    {
        if ($order->status !== 'awaiting_payment') {
            return response()->json(['message' => 'Pesanan ini sudah dibayar atau tidak valid.'], 422);
        }

        if (! $this->canAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        try {
            $snapToken = $midtrans->createSnapToken($order);

            return response()->json([
                'snap_token' => $snapToken,
                'client_key' => config('midtrans.client_key'),
                'is_production' => config('midtrans.is_production'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat pembayaran: '.$e->getMessage(),
            ], 500);
        }
    }

    public function notification(Request $request, MidtransService $midtrans): JsonResponse
    {
        $midtrans->handleNotification($request->all());

        return response()->json(['message' => 'OK']);
    }

    public function verifyPayment(Request $request, Order $order, MidtransService $midtrans): JsonResponse
    {
        if (! $this->canAccessOrder($request->user(), $order)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        try {
            $order = $midtrans->verifyOrderPayment($order);

            return response()->json($order);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Verifikasi pembayaran gagal: '.$e->getMessage(),
            ], 500);
        }
    }

    private function canAccessOrder(User $user, Order $order): bool
    {
        if ($user->isSuperadmin() || $user->isCashier()) {
            return true;
        }

        return $order->user_id === $user->id;
    }
}

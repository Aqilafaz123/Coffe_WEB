<?php

namespace App\Services;

use App\Models\Order;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');
    }

    public function createSnapToken(Order $order): string
    {
        $order->load(['user', 'items.product']);

        $customerName = $order->user?->name ?? $order->guest_name ?? 'Pelanggan';
        $customerEmail = $order->user?->email ?? 'guest@coffee.shop';
        $customerPhone = $order->user?->phone ?? $order->guest_phone ?? '08123456789';

        $itemDetails = $order->items->map(fn ($item) => [
            'id' => (string) $item->product_id,
            'price' => (int) round($item->unit_price),
            'quantity' => $item->quantity,
            'name' => substr($item->product->name, 0, 50),
        ])->values()->all();

        if ($order->discount > 0) {
            $itemDetails[] = [
                'id' => 'discount',
                'price' => -1 * (int) round($order->discount),
                'quantity' => 1,
                'name' => 'Diskon Voucher',
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id' => $order->order_number,
                'gross_amount' => (int) round($order->total),
            ],
            'customer_details' => [
                'first_name' => $customerName,
                'email' => $customerEmail,
                'phone' => $customerPhone,
            ],
            'item_details' => $itemDetails,
            'callbacks' => [
                'finish' => config('app.frontend_url').'/pembayaran/'.$order->id.'/selesai',
            ],
        ];

        return Snap::getSnapToken($params);
    }

    public function handleNotification(array $payload): ?Order
    {
        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';
        $signatureKey = $payload['signature_key'] ?? '';

        $expectedSignature = hash(
            'sha512',
            $orderId.$statusCode.$grossAmount.config('midtrans.server_key')
        );

        if (! hash_equals($expectedSignature, $signatureKey)) {
            abort(403, 'Invalid signature.');
        }

        $order = Order::where('order_number', $orderId)->first();

        if (! $order) {
            return null;
        }

        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus = $payload['fraud_status'] ?? '';
        $paymentType = $payload['payment_type'] ?? null;
        $transactionId = $payload['transaction_id'] ?? null;

        $paymentService = new OrderPaymentService;

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'accept') {
                return $paymentService->markAsPaid(
                    $order,
                    $paymentService->mapMidtransPaymentType($paymentType),
                    $transactionId
                );
            }
        } elseif ($transactionStatus === 'settlement') {
            return $paymentService->markAsPaid(
                $order,
                $paymentService->mapMidtransPaymentType($paymentType),
                $transactionId
            );
        } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'], true)) {
            if ($order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'failed',
                    'midtrans_transaction_id' => $transactionId,
                ]);
            }
        }

        return $order->fresh();
    }

    public function verifyOrderPayment(Order $order): Order
    {
        if ($order->payment_status === 'paid') {
            return $order;
        }

        $status = Transaction::status($order->order_number);

        $this->handleNotification([
            'order_id' => $status->order_id,
            'status_code' => $status->status_code,
            'gross_amount' => $status->gross_amount,
            'signature_key' => $status->signature_key,
            'transaction_status' => $status->transaction_status,
            'fraud_status' => $status->fraud_status ?? '',
            'payment_type' => $status->payment_type ?? null,
            'transaction_id' => $status->transaction_id ?? null,
        ]);

        return $order->fresh()->load(['user', 'items.product']);
    }
}

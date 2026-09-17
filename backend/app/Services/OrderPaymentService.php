<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;

class OrderPaymentService
{
    public function markAsPaid(Order $order, string $paymentMethod, ?string $transactionId = null): Order
    {
        if ($order->payment_status === 'paid') {
            return $order;
        }

        return DB::transaction(function () use ($order, $paymentMethod, $transactionId) {
            $order->refresh();

            if ($order->payment_status === 'paid') {
                return $order;
            }

            if ($order->voucher_code) {
                $voucher = Voucher::where('code', $order->voucher_code)->first();
                if ($voucher) {
                    $voucher->increment('used_count');
                }
            }

            $order->update([
                'payment_method' => $paymentMethod,
                'payment_status' => 'paid',
                'status' => 'pending',
                'paid_at' => now(),
                'midtrans_transaction_id' => $transactionId ?? $order->midtrans_transaction_id,
            ]);

            return $order->load(['user', 'items.product']);
        });
    }

    public function mapMidtransPaymentType(?string $paymentType): string
    {
        return match ($paymentType) {
            'gopay' => 'gopay',
            'qris' => 'qris',
            'shopeepay' => 'dana',
            'bank_transfer' => 'bank_transfer',
            'credit_card' => 'card',
            default => 'qris',
        };
    }
}

<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientMutation;
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

            if (is_null($order->queue_number)) {
                $maxQueue = Order::whereDate('created_at', today())
                    ->whereNotNull('queue_number')
                    ->max('queue_number') ?? 0;
                $order->queue_number = $maxQueue + 1;
            }

            $order->update([
                'payment_method' => $paymentMethod,
                'payment_status' => 'paid',
                'status' => 'pending',
                'paid_at' => now(),
                'queue_number' => $order->queue_number,
                'midtrans_transaction_id' => $transactionId ?? $order->midtrans_transaction_id,
            ]);

            // Deduct ingredients automatically
            $this->deductOrderIngredients($order);

            return $order->load(['user', 'items.product']);
        });
    }

    public function deductOrderIngredients(Order $order): void
    {
        $order->loadMissing('items.product.ingredients');

        foreach ($order->items as $item) {
            $product = $item->product;
            if (! $product) {
                continue;
            }

            foreach ($product->ingredients as $ingredient) {
                $quantityRequired = (float) ($ingredient->pivot->quantity_required ?? 0);
                $totalDeduction = $quantityRequired * $item->quantity;

                if ($totalDeduction <= 0) {
                    continue;
                }

                $previousStock = (float) $ingredient->stock;
                $currentStock = max(0, $previousStock - $totalDeduction);

                $ingredient->update(['stock' => $currentStock]);

                IngredientMutation::create([
                    'ingredient_id' => $ingredient->id,
                    'type' => 'out',
                    'quantity' => $totalDeduction,
                    'previous_stock' => $previousStock,
                    'current_stock' => $currentStock,
                    'reference_id' => (string) $order->id,
                    'notes' => "Pesanan #{$order->order_number} ({$product->name} x{$item->quantity})",
                    'user_id' => auth()->id() ?? $order->user_id,
                ]);
            }
        }
    }

    public function restoreOrderIngredients(Order $order): void
    {
        $order->loadMissing('items.product.ingredients');

        foreach ($order->items as $item) {
            $product = $item->product;
            if (! $product) {
                continue;
            }

            foreach ($product->ingredients as $ingredient) {
                $quantityRequired = (float) ($ingredient->pivot->quantity_required ?? 0);
                $totalRestore = $quantityRequired * $item->quantity;

                if ($totalRestore <= 0) {
                    continue;
                }

                $previousStock = (float) $ingredient->stock;
                $currentStock = $previousStock + $totalRestore;

                $ingredient->update(['stock' => $currentStock]);

                IngredientMutation::create([
                    'ingredient_id' => $ingredient->id,
                    'type' => 'in',
                    'quantity' => $totalRestore,
                    'previous_stock' => $previousStock,
                    'current_stock' => $currentStock,
                    'reference_id' => (string) $order->id,
                    'notes' => "Pengembalian Pesanan Batal #{$order->order_number} ({$product->name} x{$item->quantity})",
                    'user_id' => auth()->id() ?? $order->user_id,
                ]);
            }
        }
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

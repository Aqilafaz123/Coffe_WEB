<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class QrisService
{
    public function prepare(Order $order): Order
    {
        $codes = range(1, 99);
        shuffle($codes);
        foreach ($codes as $code) {
            try {
                return DB::transaction(function () use ($order, $code) {
                    $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
                    abort_unless($locked->status === 'awaiting_payment' && $locked->payment_status !== 'paid', 422, 'Pesanan tidak dapat dibayar.');
                    if ($locked->qris_amount !== null) {
                        return $locked;
                    }
                    $this->payload((string) $locked->total);
                    $locked->update([
                        'payment_method' => 'qris', 'qris_code' => $code, 'qris_slot' => $code,
                        'qris_amount' => ceil((float) $locked->total) + $code,
                    ]);

                    return $locked;
                });
            } catch (QueryException $e) {
                if (! in_array((string) $e->getCode(), ['23000', '23505'])) {
                    throw $e;
                }
            }
        }
        abort(422, 'Kode unik QRIS sedang penuh. Silakan coba lagi setelah kasir mengonfirmasi pembayaran lain.');
    }

    public function payload(string $amount): string
    {
        if (! preg_match('/^\d+(?:\.\d{1,2})?$/', $amount) || (float) $amount <= 0) {
            throw new InvalidArgumentException('Nominal QRIS harus lebih besar dari nol.');
        }
        $amount = str_contains($amount, '.') ? rtrim(rtrim($amount, '0'), '.') : $amount;
        if (strlen($amount) > 13) {
            throw new InvalidArgumentException('Nominal QRIS terlalu besar.');
        }
        $payload = '00020101021126610014COM.GO-JEK.WWW01189360091438879313890210G8879313890303UKE51440014ID.CO.QRIS.WWW0215ID10254411020560303UKE520458125303360';
        $payload .= '54'.sprintf('%02d', strlen($amount)).$amount;
        $payload .= '5802ID5924Rahardja Tea, Coffee and6009TANGERANG61051556062140703A0111036216304';

        return $payload.$this->crc($payload);
    }

    public function crc(string $payload): string
    {
        $crc = 0xFFFF;
        foreach (unpack('C*', $payload) as $byte) {
            $crc ^= $byte << 8;
            for ($i = 0; $i < 8; $i++) {
                $crc = (($crc & 0x8000) ? ($crc << 1) ^ 0x1021 : $crc << 1) & 0xFFFF;
            }
        }

        return sprintf('%04X', $crc);
    }
}

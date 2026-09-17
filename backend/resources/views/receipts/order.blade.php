<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Struk {{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #2c1810; padding: 24px; }
        .header { text-align: center; border-bottom: 2px dashed #8b6914; padding-bottom: 16px; margin-bottom: 16px; }
        .header h1 { font-size: 22px; letter-spacing: 2px; margin-bottom: 4px; }
        .header p { font-size: 11px; color: #666; }
        .meta { margin-bottom: 16px; }
        .meta table { width: 100%; }
        .meta td { padding: 3px 0; vertical-align: top; }
        .meta td:first-child { width: 110px; color: #666; }
        .location { background: #f5f0eb; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-weight: bold; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.items th { text-align: left; border-bottom: 1px solid #ccc; padding: 6px 4px; font-size: 11px; color: #666; }
        table.items td { padding: 6px 4px; border-bottom: 1px dotted #ddd; }
        table.items .right { text-align: right; }
        .totals { margin-top: 8px; }
        .totals table { width: 100%; }
        .totals td { padding: 4px 0; }
        .totals .grand td { font-weight: bold; font-size: 14px; border-top: 2px solid #2c1810; padding-top: 8px; }
        .totals .right { text-align: right; }
        .paid { text-align: center; margin: 20px 0; padding: 10px; border: 2px solid #16a34a; color: #16a34a; font-weight: bold; font-size: 14px; }
        .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px dashed #8b6914; font-size: 11px; color: #666; }
        .notes { margin-top: 12px; font-size: 11px; color: #555; white-space: pre-line; }
    </style>
</head>
<body>
    <div class="header">
        <h1>COFFEE SHOP</h1>
        <p>Jl. Kopi Nusantara No. 123 · Jakarta</p>
        <p>Telp: (021) 1234-5678</p>
    </div>

    <div class="meta">
        <table>
            <tr><td>No. Pesanan</td><td><strong>{{ $order->order_number }}</strong></td></tr>
            <tr><td>Tanggal</td><td>{{ $order->created_at->timezone('Asia/Jakarta')->format('d/m/Y H:i') }}</td></tr>
            <tr><td>Pelanggan</td><td>{{ $order->customer_name }}</td></tr>
            @if($order->user?->email)
            <tr><td>Email</td><td>{{ $order->user->email }}</td></tr>
            @endif
            @if($order->paid_at)
            <tr><td>Dibayar</td><td>{{ $order->paid_at->timezone('Asia/Jakarta')->format('d/m/Y H:i') }}</td></tr>
            @endif
            @if($order->payment_method)
            <tr><td>Metode Bayar</td><td>{{ $paymentLabel }}</td></tr>
            @endif
        </table>
    </div>

    @if($order->table_location)
    <div class="location">Lokasi: {{ $order->table_location }}</div>
    @endif

    <table class="items">
        <thead>
            <tr>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Harga</th>
                <th class="right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item->product?->name ?? 'Produk' }}</td>
                <td class="right">{{ $item->quantity }}</td>
                <td class="right">{{ $formatPrice($item->unit_price) }}</td>
                <td class="right">{{ $formatPrice($item->subtotal) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal</td>
                <td class="right">{{ $formatPrice($order->subtotal) }}</td>
            </tr>
            @if($order->discount > 0)
            <tr>
                <td>Diskon ({{ $order->voucher_code }})</td>
                <td class="right">-{{ $formatPrice($order->discount) }}</td>
            </tr>
            @endif
            <tr class="grand">
                <td>TOTAL</td>
                <td class="right">{{ $formatPrice($order->total) }}</td>
            </tr>
        </table>
    </div>

    <div class="paid">LUNAS</div>

    @if($order->notes)
    <div class="notes"><strong>Catatan:</strong><br>{{ $order->notes }}</div>
    @endif

    <div class="footer">
        <p>Terima kasih telah berkunjung!</p>
        <p>Simpan struk ini sebagai bukti pembayaran.</p>
    </div>
</body>
</html>

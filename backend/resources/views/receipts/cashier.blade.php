<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Tiket Kasir & Dapur {{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #081b56; padding: 20px; }
        .header { text-align: center; border-bottom: 2px dashed #081b56; padding-bottom: 12px; margin-bottom: 12px; }
        .header h1 { font-size: 20px; letter-spacing: 2px; color: #081b56; margin-bottom: 2px; }
        .header .badge { display: inline-block; background: #081b56; color: #fff; font-size: 9px; font-weight: bold; padding: 3px 8px; border-radius: 4px; letter-spacing: 1.5px; margin-top: 4px; }
        
        .queue-box { background: #eef3fb; border: 1.5px solid #cfe0fb; border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 12px; }
        .queue-title { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #6893e4; font-weight: bold; }
        .queue-number { font-size: 32px; font-weight: bold; color: #081b56; line-height: 1.1; }

        .meta { margin-bottom: 12px; }
        .meta table { width: 100%; }
        .meta td { padding: 2px 0; vertical-align: top; }
        .meta td:first-child { width: 95px; color: #666; font-size: 10px; }
        .meta td:last-child { font-size: 11px; font-weight: bold; }

        .location { background: #081b56; color: #fff; padding: 6px 10px; border-radius: 6px; margin-bottom: 12px; font-weight: bold; font-size: 12px; text-align: center; }

        .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #081b56; border-bottom: 1px solid #081b56; padding-bottom: 3px; margin: 12px 0 6px 0; }

        table.items { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        table.items th { text-align: left; border-bottom: 1px solid #ccc; padding: 5px 2px; font-size: 10px; color: #555; }
        table.items td { padding: 5px 2px; border-bottom: 1px dotted #ddd; vertical-align: top; }
        table.items .right { text-align: right; }
        .item-notes { font-size: 9px; color: #c99826; font-style: italic; margin-top: 2px; }

        /* INVENTORY BREAKDOWN BOX */
        .inventory-box { background: #fdfaf2; border: 1.5px solid #ebd79b; border-radius: 8px; padding: 8px 10px; margin-top: 10px; }
        .inventory-box .inv-title { font-size: 10px; font-weight: bold; color: #8a6a11; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px dashed #ebd79b; padding-bottom: 3px; }
        table.inv-table { width: 100%; border-collapse: collapse; }
        table.inv-table th { text-align: left; font-size: 9px; color: #8a6a11; padding: 3px 2px; }
        table.inv-table td { font-size: 9.5px; padding: 3px 2px; border-bottom: 1px dotted #f2e4bd; color: #443206; }
        table.inv-table .right { text-align: right; }

        .footer { text-align: center; margin-top: 16px; padding-top: 10px; border-top: 1px dashed #aaa; font-size: 9px; color: #777; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RAHARDJA</h1>
        <div class="badge">TIKET KASIR &amp; SLIP INVENTORY</div>
        <p style="font-size: 10px; color: #666; margin-top: 4px;">Jl. Kopi Nusantara No. 123 · Jakarta</p>
    </div>

    @if($order->queue_number)
    <div class="queue-box">
        <div class="queue-title">Nomor Antrian</div>
        <div class="queue-number">#{{ str_pad($order->queue_number, 3, '0', STR_PAD_LEFT) }}</div>
    </div>
    @endif

    <div class="meta">
        <table>
            <tr><td>No. Pesanan</td><td>{{ $order->order_number }}</td></tr>
            <tr><td>Waktu</td><td>{{ $order->created_at->timezone('Asia/Jakarta')->format('d/m/Y H:i') }} WIB</td></tr>
            <tr><td>Pelanggan</td><td>{{ $order->customer_name }}</td></tr>
            @if($order->processor)
            <tr><td>Kasir / Staff</td><td>{{ $order->processor->name }}</td></tr>
            @endif
            @if($order->payment_method)
            <tr><td>Pembayaran</td><td>{{ $paymentLabel }} ({{ strtoupper($order->payment_status) }})</td></tr>
            @endif
        </table>
    </div>

    @if($order->table_location)
    <div class="location">LOKASI / MEJA: {{ strtoupper($order->table_location) }}</div>
    @endif

    <div class="section-title">Pesanan Menu</div>
    <table class="items">
        <thead>
            <tr>
                <th>Menu</th>
                <th class="right">Qty</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>
                    <strong>{{ $item->product?->name ?? 'Produk' }}</strong>
                </td>
                <td class="right" style="font-size: 13px; font-weight: bold;">x{{ $item->quantity }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($order->notes)
    <div style="background: #f8fafc; border-left: 3px solid #081b56; padding: 6px 8px; margin: 8px 0; font-size: 10px;">
        <strong>Catatan Pesanan:</strong><br>
        <span style="white-space: pre-line; color: #475569;">{{ $order->notes }}</span>
    </div>
    @endif

    <!-- INVENTORY BREAKDOWN -->
    <div class="inventory-box">
        <div class="inv-title">&#x1F4E6; Bahan Baku Terpakai (Inventory Logistik)</div>
        @if(count($inventoryBreakdown) > 0)
        <table class="inv-table">
            <thead>
                <tr>
                    <th>Bahan Baku</th>
                    <th class="right">Dikeluarkan</th>
                    <th class="right">Sisa Stok</th>
                </tr>
            </thead>
            <tbody>
                @foreach($inventoryBreakdown as $inv)
                <tr>
                    <td><strong>{{ $inv['name'] }}</strong></td>
                    <td class="right" style="font-weight: bold; color: #b45309;">
                        -{{ number_format($inv['total_used'], 1, ',', '.') }} {{ $inv['unit'] }}
                    </td>
                    <td class="right" style="color: #666;">
                        {{ number_format($inv['current_stock'], 1, ',', '.') }} {{ $inv['unit'] }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <p style="font-size: 9.5px; color: #777; font-style: italic;">Menu dalam pesanan ini belum disetel resep bahan bakunya.</p>
        @endif
    </div>

    <div class="footer">
        Dicetak untuk persiapan dapur &amp; sinkronisasi inventory logistik.<br>
        {{ now()->timezone('Asia/Jakarta')->format('d/m/Y H:i:s') }}
    </div>
</body>
</html>

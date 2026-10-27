<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Order;
use App\Models\RoomReservation;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PnLController extends Controller
{
    public function report(Request $request): JsonResponse
    {
        $period = $request->input('period', 'this_month');
        $now = Carbon::now();

        switch ($period) {
            case 'today':
                $startDate = $now->copy()->startOfDay();
                $endDate = $now->copy()->endOfDay();
                $periodLabel = 'Hari Ini (' . $now->translatedFormat('d F Y') . ')';
                break;
            case 'yesterday':
                $yesterday = $now->copy()->subDay();
                $startDate = $yesterday->copy()->startOfDay();
                $endDate = $yesterday->copy()->endOfDay();
                $periodLabel = 'Kemarin (' . $yesterday->translatedFormat('d F Y') . ')';
                break;
            case 'this_week':
                $startDate = $now->copy()->startOfWeek();
                $endDate = $now->copy()->endOfWeek();
                $periodLabel = 'Minggu Ini (' . $startDate->translatedFormat('d M') . ' - ' . $endDate->translatedFormat('d M Y') . ')';
                break;
            case 'last_month':
                $lastMonth = $now->copy()->subMonth();
                $startDate = $lastMonth->copy()->startOfMonth();
                $endDate = $lastMonth->copy()->endOfMonth();
                $periodLabel = 'Bulan Lalu (' . $lastMonth->translatedFormat('F Y') . ')';
                break;
            case 'this_year':
                $startDate = $now->copy()->startOfYear();
                $endDate = $now->copy()->endOfYear();
                $periodLabel = 'Tahun Ini (' . $now->year . ')';
                break;
            case 'all_time':
                $startDate = Carbon::create(2020, 1, 1)->startOfDay();
                $endDate = $now->copy()->endOfDay();
                $periodLabel = 'Semua Waktu';
                break;
            case 'custom':
                $s = $request->input('start_date');
                $e = $request->input('end_date');
                $startDate = $s ? Carbon::parse($s)->startOfDay() : $now->copy()->startOfMonth();
                $endDate = $e ? Carbon::parse($e)->endOfDay() : $now->copy()->endOfDay();
                $periodLabel = $startDate->translatedFormat('d M Y') . ' - ' . $endDate->translatedFormat('d M Y');
                break;
            case 'this_month':
            default:
                $period = 'this_month';
                $startDate = $now->copy()->startOfMonth();
                $endDate = $now->copy()->endOfMonth();
                $periodLabel = 'Bulan Ini (' . $now->translatedFormat('F Y') . ')';
                break;
        }

        $startDateStr = $startDate->format('Y-m-d H:i:s');
        $endDateStr = $endDate->format('Y-m-d H:i:s');
        $startDateOnly = $startDate->format('Y-m-d');
        $endDateOnly = $endDate->format('Y-m-d');

        // 1. Fetch eligible orders (paid or completed, not cancelled)
        $orders = Order::with(['items.product.ingredients', 'items.product.category', 'user'])
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                  ->orWhere('status', 'completed');
            })
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($startDateStr, $endDateStr) {
                $q->whereBetween(DB::raw('COALESCE(paid_at, completed_at, created_at)'), [$startDateStr, $endDateStr]);
            })
            ->latest('created_at')
            ->get();

        // 2. Fetch room reservations
        $reservations = RoomReservation::with('room')
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('reservation_date', [$startDateOnly, $endDateOnly])
            ->get();

        $reservationsRevenue = (float) $reservations->sum('total_price');

        // 3. Process orders & calculate COGS
        $grossSales = 0.0;
        $totalDiscounts = 0.0;
        $netOrderRevenue = 0.0;
        $totalCogs = 0.0;
        $totalItemsSold = 0;
        $productMetrics = [];
        $ordersWithPnl = [];

        foreach ($orders as $order) {
            $orderGross = (float) $order->subtotal;
            $orderDiscount = (float) $order->discount;
            $orderNet = (float) $order->total;
            $orderCogs = 0.0;

            $grossSales += $orderGross;
            $totalDiscounts += $orderDiscount;
            $netOrderRevenue += $orderNet;

            foreach ($order->items as $item) {
                $unitPrice = (float) $item->unit_price;
                $quantity = (int) $item->quantity;
                $totalItemsSold += $quantity;

                // Determine unit cost
                $unitCost = (float) $item->cost_price;
                if ($unitCost <= 0 && $item->product) {
                    $unitCost = $item->product->calculateUnitCost();
                }

                $itemCogs = $unitCost * $quantity;
                $orderCogs += $itemCogs;
                $itemRevenue = (float) $item->subtotal;
                $itemProfit = $itemRevenue - $itemCogs;

                $productId = $item->product_id;
                $productName = $item->product ? $item->product->name : "Produk #{$productId}";
                $categoryName = ($item->product && $item->product->category) ? $item->product->category->name : 'Uncategorized';

                if (! isset($productMetrics[$productId])) {
                    $productMetrics[$productId] = [
                        'id' => $productId,
                        'name' => $productName,
                        'category' => $categoryName,
                        'unit_price' => $unitPrice,
                        'unit_cost' => $unitCost,
                        'quantity_sold' => 0,
                        'total_revenue' => 0.0,
                        'total_cogs' => 0.0,
                        'gross_profit' => 0.0,
                        'margin_pct' => 0.0,
                    ];
                }

                $productMetrics[$productId]['quantity_sold'] += $quantity;
                $productMetrics[$productId]['total_revenue'] += $itemRevenue;
                $productMetrics[$productId]['total_cogs'] += $itemCogs;
                $productMetrics[$productId]['gross_profit'] += $itemProfit;
            }

            $totalCogs += $orderCogs;
            $orderGrossProfit = $orderNet - $orderCogs;
            $orderMarginPct = $orderNet > 0 ? round(($orderGrossProfit / $orderNet) * 100, 1) : 0;

            $ordersWithPnl[] = [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'date' => Carbon::parse($order->paid_at ?? $order->completed_at ?? $order->created_at)->format('Y-m-d H:i'),
                'customer_name' => $order->user ? $order->user->name : ($order->guest_name ?: 'Pelanggan'),
                'payment_method' => $order->payment_method ?: 'cash',
                'subtotal' => $orderGross,
                'discount' => $orderDiscount,
                'total' => $orderNet,
                'cogs' => round($orderCogs, 2),
                'gross_profit' => round($orderGrossProfit, 2),
                'margin_pct' => $orderMarginPct,
            ];
        }

        // Calculate margin % for each product metric
        foreach ($productMetrics as &$pm) {
            $pm['total_revenue'] = round($pm['total_revenue'], 2);
            $pm['total_cogs'] = round($pm['total_cogs'], 2);
            $pm['gross_profit'] = round($pm['gross_profit'], 2);
            $pm['margin_pct'] = $pm['total_revenue'] > 0
                ? round(($pm['gross_profit'] / $pm['total_revenue']) * 100, 1)
                : 0.0;
        }
        unset($pm);

        // Sort products by gross profit desc
        usort($productMetrics, fn ($a, $b) => $b['gross_profit'] <=> $a['gross_profit']);

        // 4. Fetch expenses
        $expenses = Expense::whereBetween('expense_date', [$startDateOnly, $endDateOnly])
            ->orderByDesc('expense_date')
            ->get();

        $totalExpenses = (float) $expenses->sum('amount');

        // Expense category breakdown
        $categoryLabels = Expense::categories();
        $expensesByCategory = [];
        foreach ($categoryLabels as $catKey => $catLabel) {
            $catAmount = (float) $expenses->where('category', $catKey)->sum('amount');
            if ($catAmount > 0) {
                $expensesByCategory[] = [
                    'key' => $catKey,
                    'label' => $catLabel,
                    'amount' => $catAmount,
                    'percentage' => $totalExpenses > 0 ? round(($catAmount / $totalExpenses) * 100, 1) : 0,
                ];
            }
        }
        usort($expensesByCategory, fn ($a, $b) => $b['amount'] <=> $a['amount']);

        // 5. Final PnL Calculations
        $netRevenue = $netOrderRevenue + $reservationsRevenue;
        $grossProfit = $netRevenue - $totalCogs;
        $grossProfitMargin = $netRevenue > 0 ? round(($grossProfit / $netRevenue) * 100, 1) : 0.0;
        $netProfit = $grossProfit - $totalExpenses;
        $netProfitMargin = $netRevenue > 0 ? round(($netProfit / $netRevenue) * 100, 1) : 0.0;
        $ordersCount = $orders->count();
        $avgOrderValue = $ordersCount > 0 ? round($netOrderRevenue / $ordersCount, 2) : 0.0;

        // 6. Trend / Chart Data
        $chartData = $this->buildChartData($startDate, $endDate, $orders, $reservations, $expenses);

        return response()->json([
            'period' => $period,
            'period_label' => $periodLabel,
            'start_date' => $startDateOnly,
            'end_date' => $endDateOnly,
            'summary' => [
                'gross_sales' => round($grossSales, 2),
                'reservations_revenue' => round($reservationsRevenue, 2),
                'total_discounts' => round($totalDiscounts, 2),
                'net_revenue' => round($netRevenue, 2),
                'total_cogs' => round($totalCogs, 2),
                'gross_profit' => round($grossProfit, 2),
                'gross_profit_margin' => $grossProfitMargin,
                'total_expenses' => round($totalExpenses, 2),
                'net_profit' => round($netProfit, 2),
                'net_profit_margin' => $netProfitMargin,
                'status' => $netProfit > 0 ? 'profit' : ($netProfit < 0 ? 'loss' : 'break_even'),
                'orders_count' => $ordersCount,
                'items_sold_count' => $totalItemsSold,
                'avg_order_value' => $avgOrderValue,
            ],
            'chart_data' => $chartData,
            'expenses_by_category' => $expensesByCategory,
            'product_margins' => array_values($productMetrics),
            'recent_orders' => array_slice($ordersWithPnl, 0, 15),
        ]);
    }

    private function buildChartData(Carbon $startDate, Carbon $endDate, $orders, $reservations, $expenses): array
    {
        $diffInDays = $startDate->diffInDays($endDate);

        if ($diffInDays <= 31) {
            // Group by Day
            $points = [];
            $current = $startDate->copy()->startOfDay();
            $end = $endDate->copy()->startOfDay();

            while ($current->lte($end)) {
                $dateKey = $current->format('Y-m-d');
                $label = $current->translatedFormat('d M');

                // Day orders
                $dayOrders = $orders->filter(function ($order) use ($dateKey) {
                    $orderDate = Carbon::parse($order->paid_at ?? $order->completed_at ?? $order->created_at)->format('Y-m-d');
                    return $orderDate === $dateKey;
                });

                $dayReservations = $reservations->filter(function ($r) use ($dateKey) {
                    return Carbon::parse($r->reservation_date)->format('Y-m-d') === $dateKey;
                });

                $dayExpenses = $expenses->filter(function ($e) use ($dateKey) {
                    return Carbon::parse($e->expense_date)->format('Y-m-d') === $dateKey;
                });

                $rev = (float) $dayOrders->sum('total') + (float) $dayReservations->sum('total_price');

                $cogs = 0.0;
                foreach ($dayOrders as $o) {
                    foreach ($o->items as $item) {
                        $cost = (float) $item->cost_price > 0 ? (float) $item->cost_price : ($item->product ? $item->product->calculateUnitCost() : 0);
                        $cogs += $cost * (int) $item->quantity;
                    }
                }

                $exp = (float) $dayExpenses->sum('amount');
                $gross = $rev - $cogs;
                $net = $gross - $exp;

                $points[] = [
                    'date' => $dateKey,
                    'label' => $label,
                    'revenue' => round($rev, 2),
                    'cogs' => round($cogs, 2),
                    'gross_profit' => round($gross, 2),
                    'expenses' => round($exp, 2),
                    'net_profit' => round($net, 2),
                ];

                $current->addDay();
            }

            return $points;
        } else {
            // Group by Month
            $points = [];
            $current = $startDate->copy()->startOfMonth();
            $end = $endDate->copy()->startOfMonth();

            while ($current->lte($end)) {
                $monthKey = $current->format('Y-m');
                $label = $current->translatedFormat('M Y');

                $monthOrders = $orders->filter(function ($order) use ($monthKey) {
                    $orderMonth = Carbon::parse($order->paid_at ?? $order->completed_at ?? $order->created_at)->format('Y-m');
                    return $orderMonth === $monthKey;
                });

                $monthReservations = $reservations->filter(function ($r) use ($monthKey) {
                    return Carbon::parse($r->reservation_date)->format('Y-m') === $monthKey;
                });

                $monthExpenses = $expenses->filter(function ($e) use ($monthKey) {
                    return Carbon::parse($e->expense_date)->format('Y-m') === $monthKey;
                });

                $rev = (float) $monthOrders->sum('total') + (float) $monthReservations->sum('total_price');

                $cogs = 0.0;
                foreach ($monthOrders as $o) {
                    foreach ($o->items as $item) {
                        $cost = (float) $item->cost_price > 0 ? (float) $item->cost_price : ($item->product ? $item->product->calculateUnitCost() : 0);
                        $cogs += $cost * (int) $item->quantity;
                    }
                }

                $exp = (float) $monthExpenses->sum('amount');
                $gross = $rev - $cogs;
                $net = $gross - $exp;

                $points[] = [
                    'date' => $monthKey,
                    'label' => $label,
                    'revenue' => round($rev, 2),
                    'cogs' => round($cogs, 2),
                    'gross_profit' => round($gross, 2),
                    'expenses' => round($exp, 2),
                    'net_profit' => round($net, 2),
                ];

                $current->addMonth();
            }

            return $points;
        }
    }
}

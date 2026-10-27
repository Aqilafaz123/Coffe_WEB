<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isCashier()) {
            $today = now()->toDateString();

            return response()->json([
                'awaiting_payment' => Order::where('status', 'awaiting_payment')->count(),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'preparing_orders' => Order::where('status', 'preparing')->count(),
                'completed_today' => Order::where('status', 'completed')
                    ->whereDate('completed_at', $today)->count(),
                'revenue_today' => Order::where('status', 'completed')
                    ->whereDate('completed_at', $today)->sum('total'),
            ]);
        }

        $totalRevenue = Order::where('status', 'completed')->sum('total');
        $monthlyRevenue = Order::where('status', 'completed')
            ->whereMonth('completed_at', now()->month)
            ->whereYear('completed_at', now()->year)
            ->sum('total');

        $salesByDay = Order::where('status', 'completed')
            ->where('completed_at', '>=', now()->subDays(7))
            ->select(DB::raw('DATE(completed_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        $monthlyOrders = Order::with('items.product.ingredients')
            ->where('status', 'completed')
            ->whereMonth('completed_at', now()->month)
            ->whereYear('completed_at', now()->year)
            ->get();

        $monthlyCogs = 0.0;
        foreach ($monthlyOrders as $order) {
            foreach ($order->items as $item) {
                $cost = (float) $item->cost_price > 0 ? (float) $item->cost_price : ($item->product ? $item->product->calculateUnitCost() : 0);
                $monthlyCogs += $cost * (int) $item->quantity;
            }
        }

        $monthlyExpenses = (float) \App\Models\Expense::whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');

        $monthlyGrossProfit = $monthlyRevenue - $monthlyCogs;
        $monthlyNetProfit = $monthlyGrossProfit - $monthlyExpenses;
        $monthlyNetMargin = $monthlyRevenue > 0 ? round(($monthlyNetProfit / $monthlyRevenue) * 100, 1) : 0;

        return response()->json([
            'total_users' => User::where('role', 'user')->count(),
            'total_products' => Product::count(),
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'monthly_cogs' => round($monthlyCogs, 2),
            'monthly_gross_profit' => round($monthlyGrossProfit, 2),
            'monthly_expenses' => round($monthlyExpenses, 2),
            'monthly_net_profit' => round($monthlyNetProfit, 2),
            'monthly_net_margin' => $monthlyNetMargin,
            'sales_by_day' => $salesByDay,
            'top_products' => $topProducts,
        ]);
    }
}

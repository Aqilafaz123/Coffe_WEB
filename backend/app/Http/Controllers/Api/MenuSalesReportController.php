<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuSalesReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $dates = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        // Use the same sale eligibility and date as the financial report.
        $sales = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', '!=', 'cancelled')
            ->where(fn ($query) => $query->where('orders.payment_status', 'paid')->orWhere('orders.status', 'completed'))
            ->whereBetween(DB::raw('COALESCE(orders.paid_at, orders.completed_at, orders.created_at)'), [
                Carbon::parse($dates['start_date'])->startOfDay(),
                Carbon::parse($dates['end_date'])->endOfDay(),
            ])
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('order_items.product_id');

        $rows = DB::table('products')
            ->leftJoinSub($sales, 'sales', 'sales.product_id', '=', 'products.id')
            ->select('products.id', 'products.name', DB::raw('COALESCE(sales.total_sold, 0) as total_sold'))
            ->orderBy('products.name')
            ->get()
            ->map(fn ($row) => ['id' => $row->id, 'name' => $row->name, 'total_sold' => (int) $row->total_sold]);

        return response()->json([
            ...$dates,
            'rows' => $rows,
            'total_sold' => $rows->sum('total_sold'),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::with('creator');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('expense_date', [$request->start_date, $request->end_date]);
        } elseif ($request->filled('month') && $request->filled('year')) {
            $query->whereMonth('expense_date', $request->month)
                  ->whereYear('expense_date', $request->year);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('expense_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $expenses = $query->orderByDesc('expense_date')->orderByDesc('id')->get();
        $totalAmount = (float) $query->sum('amount');

        return response()->json([
            'expenses' => $expenses,
            'total_amount' => $totalAmount,
            'categories' => Expense::categories(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:'.implode(',', array_keys(Expense::categories()))],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:1'],
            'expense_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $randomCode = strtoupper(Str::random(6));
        $datePrefix = date('Ymd', strtotime($validated['expense_date']));
        $expenseNumber = "EXP-{$datePrefix}-{$randomCode}";

        $expense = Expense::create([
            'expense_number' => $expenseNumber,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'amount' => $validated['amount'],
            'expense_date' => $validated['expense_date'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($expense->load('creator'), 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json($expense->load('creator'));
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'in:'.implode(',', array_keys(Expense::categories()))],
            'title' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:1'],
            'expense_date' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $expense->update($validated);

        return response()->json($expense->fresh()->load('creator'));
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json(['message' => 'Pengeluaran operasional berhasil dihapus.']);
    }

    public function categories(): JsonResponse
    {
        return response()->json(Expense::categories());
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\IngredientMutation;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IngredientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Ingredient::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('stock', '<=', 'min_stock');
        }

        $ingredients = $query->orderBy('name')->get();

        return response()->json($ingredients);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:ingredients,code'],
            'unit' => ['required', 'string', 'max:50'],
            'stock' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'cost_per_unit' => ['nullable', 'numeric', 'min:0'],
        ]);

        $ingredient = DB::transaction(function () use ($validated, $request) {
            $ing = Ingredient::create($validated);

            if ($ing->stock > 0) {
                IngredientMutation::create([
                    'ingredient_id' => $ing->id,
                    'type' => 'in',
                    'quantity' => $ing->stock,
                    'previous_stock' => 0,
                    'current_stock' => $ing->stock,
                    'notes' => 'Stok awal bahan baku',
                    'user_id' => $request->user()->id,
                ]);
            }

            return $ing;
        });

        return response()->json($ingredient, 201);
    }

    public function show(Ingredient $ingredient): JsonResponse
    {
        return response()->json(
            $ingredient->load(['mutations.user', 'products'])
        );
    }

    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:ingredients,code,'.$ingredient->id],
            'unit' => ['sometimes', 'string', 'max:50'],
            'min_stock' => ['sometimes', 'numeric', 'min:0'],
            'cost_per_unit' => ['nullable', 'numeric', 'min:0'],
        ]);

        $ingredient->update($validated);

        return response()->json($ingredient);
    }

    public function restock(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'numeric'],
            'type' => ['required', 'in:in,adjustment'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $qty = (float) $validated['quantity'];
        $type = $validated['type'];
        $notes = $validated['notes'] ?? ($type === 'in' ? 'Restock bahan baku' : 'Penyesuaian stok');

        DB::transaction(function () use ($ingredient, $qty, $type, $notes, $request) {
            $previous = (float) $ingredient->stock;
            $current = $type === 'adjustment' ? max(0, $qty) : max(0, $previous + $qty);
            $changeQty = $type === 'adjustment' ? abs($current - $previous) : abs($qty);

            $ingredient->update(['stock' => $current]);

            IngredientMutation::create([
                'ingredient_id' => $ingredient->id,
                'type' => $type === 'adjustment' ? 'adjustment' : ($qty >= 0 ? 'in' : 'out'),
                'quantity' => $changeQty,
                'previous_stock' => $previous,
                'current_stock' => $current,
                'notes' => $notes,
                'user_id' => $request->user()->id,
            ]);
        });

        return response()->json($ingredient->fresh());
    }

    public function destroy(Ingredient $ingredient): JsonResponse
    {
        if ($ingredient->products()->count() > 0) {
            return response()->json([
                'message' => 'Bahan ini sedang digunakan dalam resep produk. Hapus relasi resep terlebih dahulu.',
            ], 422);
        }

        $ingredient->delete();

        return response()->json(['message' => 'Bahan baku berhasil dihapus.']);
    }

    public function mutations(Request $request): JsonResponse
    {
        $query = IngredientMutation::with(['ingredient', 'user']);

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->ingredient_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->latest()->paginate(50));
    }

    public function productsWithRecipes(): JsonResponse
    {
        $products = Product::with(['category', 'ingredients'])->orderBy('name')->get();

        return response()->json($products);
    }

    public function saveRecipe(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'ingredients' => ['array'],
            'ingredients.*.ingredient_id' => ['required', 'exists:ingredients,id'],
            'ingredients.*.quantity_required' => ['required', 'numeric', 'min:0.01'],
        ]);

        DB::transaction(function () use ($product, $validated) {
            $syncData = [];
            foreach ($validated['ingredients'] as $item) {
                $syncData[$item['ingredient_id']] = [
                    'quantity_required' => $item['quantity_required'],
                ];
            }

            $product->ingredients()->sync($syncData);
        });

        return response()->json($product->load(['category', 'ingredients']));
    }

    public function stats(): JsonResponse
    {
        $totalIngredients = Ingredient::count();
        $lowStockQuery = Ingredient::whereColumn('stock', '<=', 'min_stock');
        $lowStockCount = $lowStockQuery->count();
        $lowStockItems = $lowStockQuery->take(5)->get();

        $mutationsToday = IngredientMutation::whereDate('created_at', today())->count();
        $recentMutations = IngredientMutation::with(['ingredient', 'user'])
            ->latest()
            ->take(6)
            ->get();

        return response()->json([
            'total_ingredients' => $totalIngredients,
            'low_stock_count' => $lowStockCount,
            'low_stock_items' => $lowStockItems,
            'mutations_today' => $mutationsToday,
            'recent_mutations' => $recentMutations,
        ]);
    }
}

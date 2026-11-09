<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Category::where('is_active', true)->withCount('products')->get()
        );
    }

    public function manage(): JsonResponse
    {
        return response()->json(Category::withCount('products')->orderBy('name')->get());
    }

    private function validateSlug(string $name, ?Category $category = null): string
    {
        $slug = Str::slug($name);
        Validator::make(['slug' => $slug], [
            'slug' => ['required', 'max:255', Rule::unique('categories', 'slug')->ignore($category?->id)],
        ], ['slug.required' => 'Nama kategori harus berisi huruf atau angka.', 'slug.unique' => 'Nama kategori sudah digunakan.'])->validate();

        return $slug;
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = $this->validateSlug($validated['name']);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = $this->validateSlug($validated['name'], $category);
        }

        $category->update($validated);

        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json(['message' => 'Kategori masih digunakan produk. Pindahkan produknya atau nonaktifkan kategori.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }
}

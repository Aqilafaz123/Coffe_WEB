<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category')->where('is_active', true);

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%"));
        }

        return response()->json($query->latest()->get());
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load('category'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'string', 'max:2048'],
            'image_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
            'stock' => ['integer', 'min:0'],
        ]);

        unset($validated['image_file']);

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('products', 'public');
            abort_unless($path, 500, 'Gambar produk gagal disimpan.');
            $validated['image'] = '/api/media/'.$path;
        }

        $validated['slug'] = Str::slug($validated['name']).'-'.Str::random(4);

        $product = Product::create($validated);

        return response()->json($product->load('category'), 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['sometimes', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'image' => ['nullable', 'string', 'max:2048'],
            'image_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
            'stock' => ['integer', 'min:0'],
        ]);

        unset($validated['image_file'], $validated['remove_image']);

        $oldImage = $product->image;

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('products', 'public');
            abort_unless($path, 500, 'Gambar produk gagal disimpan.');
            $validated['image'] = '/api/media/'.$path;
        } elseif ($request->boolean('remove_image')) {
            $validated['image'] = null;
        }

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']).'-'.Str::random(4);
        }

        $product->update($validated);

        if (($request->hasFile('image_file') || $request->boolean('remove_image')) && $oldImage !== $product->image) {
            $this->deleteLocalMedia($oldImage);
        }

        return response()->json($product->load('category'));
    }

    public function destroy(Product $product): JsonResponse
    {
        $oldImage = $product->image;
        $product->delete();
        $this->deleteLocalMedia($oldImage);

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }

    private function deleteLocalMedia(?string $imageUrl): void
    {
        if (! $imageUrl || ! str_starts_with($imageUrl, '/api/media/')) {
            return;
        }

        $relativePath = substr($imageUrl, strlen('/api/media/'));
        if (preg_match('#^(products|rooms)/[A-Za-z0-9._-]+$#', $relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }
}

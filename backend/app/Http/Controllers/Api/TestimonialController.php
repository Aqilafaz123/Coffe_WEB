<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Testimonial::where('is_active', true)->latest()->get()
        );
    }

    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'min:10', 'max:500'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $user = $request->user();

        $testimonial = Testimonial::create([
            'name' => $user->name,
            'role' => 'Pelanggan',
            'content' => $validated['content'],
            'rating' => $validated['rating'],
            'avatar' => 'https://ui-avatars.com/api/?name='.urlencode($user->name).'&background=5c3a28&color=fff&size=128',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Terima kasih! Ulasan Anda telah ditambahkan.',
            'testimonial' => $testimonial,
        ], 201);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'rating' => ['integer', 'min:1', 'max:5'],
            'avatar' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $testimonial = Testimonial::create($validated);

        return response()->json($testimonial, 201);
    }

    public function update(Request $request, Testimonial $testimonial): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'rating' => ['integer', 'min:1', 'max:5'],
            'avatar' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $testimonial->update($validated);

        return response()->json($testimonial);
    }

    public function destroy(Testimonial $testimonial): JsonResponse
    {
        $testimonial->delete();

        return response()->json(['message' => 'Testimonial berhasil dihapus.']);
    }
}

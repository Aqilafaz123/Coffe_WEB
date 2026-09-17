<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SubscriberController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'unique:subscribers,email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Email belum terdaftar. Silakan buat akun terlebih dahulu untuk mendapatkan diskon.'],
            ]);
        }

        $subscriber = Subscriber::create([
            'email' => $validated['email'],
            'discount_code' => 'COFFEE15-'.strtoupper(Str::random(6)),
        ]);

        return response()->json([
            'message' => 'Berhasil berlangganan! Gunakan kode diskon Anda.',
            'discount_code' => $subscriber->discount_code,
        ], 201);
    }

    public function index(): JsonResponse
    {
        return response()->json(Subscriber::latest()->get());
    }
}

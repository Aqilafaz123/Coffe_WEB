<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaController extends Controller
{
    public function show(string $path): StreamedResponse
    {
        if (! preg_match('#^(products|rooms)/[A-Za-z0-9._-]+$#', $path) || str_contains($path, '..')) {
            abort(404);
        }

        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404);

        $mime = $disk->mimeType($path) ?: '';
        abort_unless(in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true), 404);

        return $disk->response($path, null, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}


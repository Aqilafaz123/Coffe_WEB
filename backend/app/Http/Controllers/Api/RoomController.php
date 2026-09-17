<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Room::where('is_active', true)->latest()->get());
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(Room::latest()->get());
    }

    public function show(Room $room): JsonResponse
    {
        if (! $room->is_active && ! request()->user()?->isSuperadmin()) {
            return response()->json(['message' => 'Ruangan tidak tersedia.'], 404);
        }

        return response()->json($room);
    }

    public function availability(Request $request, Room $room): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $booked = RoomReservation::where('room_id', $room->id)
            ->where('reservation_date', $validated['date'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->get(['start_time', 'end_time', 'status']);

        return response()->json([
            'date' => $validated['date'],
            'booked_slots' => $booked->map(fn ($r) => [
                'start_time' => substr((string) $r->start_time, 0, 5),
                'end_time' => substr((string) $r->end_time, 0, 5),
                'status' => $r->status,
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'capacity' => ['required', 'integer', 'min:1'],
            'price_per_hour' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'string'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = Str::slug($validated['name']).'-'.Str::random(4);

        $room = Room::create($validated);

        return response()->json($room, 201);
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'price_per_hour' => ['sometimes', 'numeric', 'min:0'],
            'image' => ['nullable', 'string'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']).'-'.Str::random(4);
        }

        $room->update($validated);

        return response()->json($room);
    }

    public function destroy(Room $room): JsonResponse
    {
        if ($room->reservations()->whereIn('status', ['pending', 'confirmed'])->exists()) {
            return response()->json([
                'message' => 'Ruangan memiliki reservasi aktif dan tidak dapat dihapus.',
            ], 422);
        }

        $room->delete();

        return response()->json(['message' => 'Ruangan berhasil dihapus.']);
    }
}

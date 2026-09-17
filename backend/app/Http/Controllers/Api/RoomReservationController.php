<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomReservation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RoomReservationController extends Controller
{
    private const OPEN_HOUR = 8;

    private const CLOSE_HOUR = 22;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = RoomReservation::with(['room', 'user', 'processor']);

        if ($user->isSuperadmin() || $user->isCashier()) {
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('date')) {
                $query->whereDate('reservation_date', $request->date);
            }

            return response()->json($query->latest()->get());
        }

        return response()->json(
            $query->where('user_id', $user->id)->latest()->get()
        );
    }

    public function show(Request $request, RoomReservation $reservation): JsonResponse
    {
        if (! $this->canAccess($request->user(), $reservation)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($reservation->load(['room', 'user', 'processor']));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => ['required', 'exists:rooms,id'],
            'reservation_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'guests_count' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $room = Room::where('id', $validated['room_id'])->where('is_active', true)->firstOrFail();

        if ($validated['guests_count'] > $room->capacity) {
            throw ValidationException::withMessages([
                'guests_count' => ["Kapasitas ruangan maksimal {$room->capacity} orang."],
            ]);
        }

        [$startHour, $startMinute] = array_map('intval', explode(':', $validated['start_time']));
        [$endHour, $endMinute] = array_map('intval', explode(':', $validated['end_time']));

        if ($startHour < self::OPEN_HOUR || $endHour > self::CLOSE_HOUR || ($endHour === self::CLOSE_HOUR && $endMinute > 0)) {
            throw ValidationException::withMessages([
                'start_time' => ['Jam operasional reservasi: 08:00 - 22:00.'],
            ]);
        }

        $durationMinutes = ($endHour * 60 + $endMinute) - ($startHour * 60 + $startMinute);
        $durationHours = round($durationMinutes / 60, 1);

        if ($durationHours < 1) {
            throw ValidationException::withMessages([
                'end_time' => ['Durasi minimal reservasi adalah 1 jam.'],
            ]);
        }

        if ($this->hasConflict($room->id, $validated['reservation_date'], $validated['start_time'], $validated['end_time'])) {
            throw ValidationException::withMessages([
                'start_time' => ['Ruangan sudah direservasi pada jam tersebut. Pilih waktu lain.'],
            ]);
        }

        $reservation = RoomReservation::create([
            'reservation_number' => 'RSV-'.strtoupper(Str::random(8)),
            'room_id' => $room->id,
            'user_id' => $request->user()->id,
            'reservation_date' => $validated['reservation_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'guests_count' => $validated['guests_count'],
            'duration_hours' => $durationHours,
            'total_price' => $durationHours * $room->price_per_hour,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($reservation->load(['room', 'user']), 201);
    }

    public function cancel(Request $request, RoomReservation $reservation): JsonResponse
    {
        if (! $this->canAccess($request->user(), $reservation)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (! in_array($reservation->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => 'Reservasi ini tidak dapat dibatalkan.'], 422);
        }

        $reservation->update(['status' => 'cancelled']);

        return response()->json($reservation->load(['room', 'user']));
    }

    public function updateStatus(Request $request, RoomReservation $reservation): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,cancelled,completed'],
        ]);

        $reservation->update([
            'status' => $validated['status'],
            'processed_by' => $request->user()->id,
        ]);

        return response()->json($reservation->load(['room', 'user', 'processor']));
    }

    private function hasConflict(int $roomId, string $date, string $startTime, string $endTime): bool
    {
        return RoomReservation::where('room_id', $roomId)
            ->where('reservation_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();
    }

    private function canAccess(User $user, RoomReservation $reservation): bool
    {
        if ($user->isSuperadmin() || $user->isCashier()) {
            return true;
        }

        return $reservation->user_id === $user->id;
    }
}

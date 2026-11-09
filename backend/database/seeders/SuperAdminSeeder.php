<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('role', 'superadmin')->exists()) {
            $this->command?->info('Superadmin sudah tersedia. Akun dan password tidak diubah.');

            return;
        }

        if (! $this->command) {
            throw new RuntimeException('Jalankan seeder melalui php artisan db:seed --class=SuperAdminSeeder.');
        }

        $data = [
            'name' => trim((string) $this->command->ask('Nama superadmin', 'Super Admin')),
            'email' => strtolower(trim((string) $this->command->ask('Email superadmin'))),
            'password' => $this->command->secret('Password superadmin (minimal 12 karakter)'),
            'password_confirmation' => $this->command->secret('Ulangi password superadmin'),
        ];

        Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ])->validate();

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'superadmin',
        ]);

        $this->command->info('Superadmin berhasil dibuat. Tidak ada data contoh yang ditambahkan.');
    }
}

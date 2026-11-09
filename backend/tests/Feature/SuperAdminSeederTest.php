<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SuperAdminSeederTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        (require database_path('migrations/0001_01_01_000000_create_users_table.php'))->up();
        (require database_path('migrations/2026_06_10_000001_add_role_to_users_table.php'))->up();
    }

    private function seeder(string $email, string $password): SuperAdminSeeder
    {
        $command = $this->createMock(Command::class);
        $command->method('ask')->willReturnOnConsecutiveCalls('Production Admin', $email);
        $command->method('secret')->willReturn($password);
        $seeder = new SuperAdminSeeder;
        $seeder->setCommand($command);

        return $seeder;
    }

    public function test_it_creates_only_one_superadmin_and_preserves_existing_credentials_on_rerun(): void
    {
        $seeder = $this->seeder('admin@example.com', 'abc123');
        $seeder->run();
        $user = User::sole();
        $this->assertSame('superadmin', $user->role);
        $this->assertSame('admin@example.com', $user->email);
        $this->assertTrue(Hash::check('abc123', $user->password));
        $hash = $user->password;
        $seeder->run();
        $this->assertSame(1, User::count());
        $this->assertSame($hash, $user->fresh()->password);
    }

    public function test_weak_password_creates_no_user(): void
    {
        $this->expectException(ValidationException::class);
        try {
            $this->seeder('admin@example.com', '12345')->run();
        } finally {
            $this->assertSame(0, User::count());
        }
    }

    public function test_existing_customer_is_not_promoted(): void
    {
        $user = User::factory()->create(['email' => 'customer@example.com', 'role' => 'user']);
        $this->expectException(ValidationException::class);
        try {
            $this->seeder($user->email, 'abc123')->run();
        } finally {
            $this->assertSame('user', $user->fresh()->role);
            $this->assertSame(1, User::count());
        }
    }
}

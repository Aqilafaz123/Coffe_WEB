<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        foreach (['0001_01_01_000000_create_users_table.php', '2026_06_09_183427_create_personal_access_tokens_table.php'] as $file) {
            (require database_path('migrations/'.$file))->up();
        }
        // The final role enum is migrated with MySQL-specific SQL in production.
        Schema::table('users', fn (Blueprint $table) => $table->string('role')->default('user'));
    }

    public static function roles(): array
    {
        return [['user'], ['cashier'], ['superadmin'], ['logistics']];
    }

    #[DataProvider('roles')]
    public function test_all_roles_can_change_only_their_own_password_and_other_tokens_are_revoked(string $role): void
    {
        $user = User::factory()->create(['role' => $role, 'password' => Hash::make('old123')]);
        $other = User::factory()->create();
        $otherHash = $other->password;
        $current = $user->createToken('current');
        $stale = $user->createToken('other-device');
        $otherToken = $other->createToken('other-user');

        $this->withToken($current->plainTextToken)->putJson('/api/me/password', [
            'current_password' => 'old123', 'password' => 'new123', 'password_confirmation' => 'new123', 'user_id' => $other->id,
        ])->assertOk();

        $this->assertTrue(Hash::check('new123', $user->fresh()->password));
        $this->assertSame($otherHash, $other->fresh()->password);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $current->accessToken->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $stale->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $otherToken->accessToken->id]);
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'old123'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'new123'])->assertOk();
    }

    public function test_invalid_password_requests_do_not_change_password_or_revoke_tokens(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old123')]);
        $token = $user->createToken('current');
        $base = ['current_password' => 'old123', 'password' => 'new123', 'password_confirmation' => 'new123'];
        foreach ([
            ['current_password' => 'wrong'],
            ['password' => '12345', 'password_confirmation' => '12345'],
            ['password_confirmation' => 'mismatch'],
            ['password' => 'old123', 'password_confirmation' => 'old123'],
        ] as $invalid) {
            $this->withToken($token->plainTextToken)->putJson('/api/me/password', array_replace($base, $invalid))->assertUnprocessable();
            $this->assertTrue(Hash::check('old123', $user->fresh()->password));
            $this->assertSame(1, $user->tokens()->count());
        }
    }

    public function test_guest_cannot_change_password(): void
    {
        $this->putJson('/api/me/password', ['current_password' => 'old123', 'password' => 'new123', 'password_confirmation' => 'new123'])->assertUnauthorized();
    }
}

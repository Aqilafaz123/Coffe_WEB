<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MenuSalesReportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        (require database_path('migrations/0001_01_01_000000_create_users_table.php'))->up();
        Schema::table('users', fn (Blueprint $table) => $table->string('role')->default('user'));
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('status');
            $table->string('payment_status');
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('created_at');
        });
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('quantity');
        });
    }

    public function test_staff_report_counts_quantities_and_excludes_cancelled_unpaid_and_outside_dates(): void
    {
        DB::table('products')->insert([['id' => 1, 'name' => 'Kopi Aren'], ['id' => 2, 'name' => 'Es Teh']]);
        foreach ([
            ['preparing', 'paid', '2026-11-18 00:00:00', null, 3],
            ['completed', 'unpaid', null, '2026-11-18 23:59:59', 2],
            ['cancelled', 'paid', '2026-11-18 12:00:00', null, 50],
            ['pending', 'unpaid', null, null, 50],
            ['completed', 'paid', '2026-11-17 23:59:59', '2026-11-18 12:00:00', 50],
            ['preparing', 'paid', null, null, 1],
        ] as [$status, $payment, $paid, $completed, $quantity]) {
            $id = DB::table('orders')->insertGetId(['status' => $status, 'payment_status' => $payment, 'paid_at' => $paid, 'completed_at' => $completed, 'created_at' => '2026-11-18 12:00:00']);
            DB::table('order_items')->insert(['order_id' => $id, 'product_id' => 1, 'quantity' => $quantity]);
        }
        foreach (['superadmin', 'cashier'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))
                ->getJson('/api/reports/menu-sales?start_date=2026-11-18&end_date=2026-11-18')
                ->assertOk()->assertJsonPath('total_sold', 6)
                ->assertJsonPath('rows.0.name', 'Es Teh')->assertJsonPath('rows.0.total_sold', 0)
                ->assertJsonPath('rows.1.total_sold', 6);
        }
    }

    public function test_permissions_and_date_validation(): void
    {
        $this->getJson('/api/reports/menu-sales')->assertUnauthorized();
        foreach (['user', 'logistics'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->getJson('/api/reports/menu-sales')->assertForbidden();
        }
        $this->actingAs(User::factory()->create(['role' => 'cashier']));
        $this->getJson('/api/reports/menu-sales')->assertUnprocessable();
        $this->getJson('/api/reports/menu-sales?start_date=2026-11-19&end_date=2026-11-18')
            ->assertUnprocessable()->assertJsonValidationErrors('end_date');
    }
}

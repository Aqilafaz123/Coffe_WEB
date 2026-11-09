<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        foreach (['0001_01_01_000000_create_users_table.php', '2026_06_10_000002_create_categories_table.php', '2026_06_10_000003_create_products_table.php'] as $file) {
            (require database_path('migrations/'.$file))->up();
        }
        Schema::table('users', fn (Blueprint $table) => $table->string('role')->default('user'));
    }

    public function test_admin_can_manage_inactive_categories_and_duplicate_slugs_are_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin']);
        $response = $this->actingAs($admin)->postJson('/api/categories', ['name' => 'Es Krim', 'is_active' => true])->assertCreated();
        $id = $response->json('id');
        $this->postJson('/api/categories', ['name' => 'Es-Krim'])->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->putJson("/api/categories/{$id}", ['name' => 'Gelato', 'is_active' => false])->assertOk();
        $this->getJson('/api/admin/categories')->assertOk()->assertJsonFragment(['name' => 'Gelato', 'is_active' => false]);
        $this->getJson('/api/categories')->assertOk()->assertExactJson([]);
        $this->deleteJson("/api/categories/{$id}")->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $id]);
    }

    public function test_used_category_cannot_be_deleted_with_its_products(): void
    {
        $category = Category::create(['name' => 'Kopi', 'slug' => 'kopi']);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Latte', 'slug' => 'latte', 'price' => 20000]);
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->deleteJson("/api/categories/{$category->id}")->assertUnprocessable();
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_customers_and_cashiers_cannot_manage_categories(): void
    {
        foreach (['user', 'cashier'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]));
            $this->getJson('/api/admin/categories')->assertForbidden();
            $this->postJson('/api/categories', ['name' => 'Unauthorized'])->assertForbidden();
        }
    }
}

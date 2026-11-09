<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\QrisService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class QrisPaymentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        (require database_path('migrations/0001_01_01_000000_create_users_table.php'))->up();
        Schema::table('users', fn (Blueprint $t) => $t->string('role')->default('user'));
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->nullable();
            $t->unsignedBigInteger('processed_by')->nullable();
            foreach (['order_number', 'status', 'payment_status'] as $field) {
                $t->string($field);
            }
            foreach (['payment_method', 'voucher_code', 'midtrans_transaction_id'] as $field) {
                $t->string($field)->nullable();
            }
            foreach (['subtotal', 'discount', 'total'] as $field) {
                $t->decimal($field, 12, 2);
            }
            $t->unsignedInteger('queue_number')->nullable();
            $t->timestamp('paid_at')->nullable();
            foreach (['guest_name', 'guest_phone', 'table_location', 'notes'] as $field) {
                $t->string($field)->nullable();
            }
            $t->timestamps();
        });
        (require database_path('migrations/2026_11_10_000001_add_qris_proof_to_orders.php'))->up();
        (require database_path('migrations/2026_11_10_000002_add_pos_source_to_orders.php'))->up();
        Storage::fake('local');
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('order_id');
            $t->unsignedBigInteger('product_id');
            $t->integer('quantity');
            $t->decimal('unit_price', 12, 2);
            $t->decimal('subtotal', 12, 2);
            $t->timestamps();
        });
        foreach (['2026_06_10_000002_create_categories_table.php', '2026_06_10_000003_create_products_table.php', '2026_10_21_000002_create_ingredients_table.php', '2026_10_21_000003_create_product_ingredients_table.php', '2026_10_27_000002_add_cost_price_to_products_and_order_items.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
    }

    public function test_qris_uses_order_total_and_customer_cannot_confirm_payment(): void
    {
        $user = User::factory()->create();
        $order = Order::create(['order_number' => 'QR-TEST', 'user_id' => $user->id, 'subtotal' => 20000, 'discount' => 10000, 'total' => 10000, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);
        $response = $this->actingAs($user)->postJson("/api/orders/{$order->id}/qris", ['total' => 1])
            ->assertOk();
        $code = $response->json('unique_code');
        $this->assertGreaterThanOrEqual(1, $code);
        $this->assertLessThanOrEqual(99, $code);
        $amount = number_format(10000 + $code, 2, '.', '');
        $response->assertJsonPath('total', $amount)->assertJsonPath('payload', (new QrisService)->payload($amount));
        $this->postJson("/api/orders/{$order->id}/qris")->assertJsonPath('total', $amount);
        $this->assertSame('unpaid', $order->fresh()->payment_status);
        $this->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'qris'])->assertForbidden();
        $other = User::factory()->create();
        $this->actingAs($other)->postJson("/api/orders/{$order->id}/qris")->assertForbidden();
        $this->getJson("/api/orders/{$order->id}/payment-proof")->assertForbidden();
        $this->actingAs($user)->postJson("/api/orders/{$order->id}/payment-proof", ['proof' => UploadedFile::fake()->create('bad.pdf', 10, 'application/pdf')])->assertUnprocessable();
        $this->postJson("/api/orders/{$order->id}/payment-proof", ['proof' => UploadedFile::fake()->image('proof.png')])->assertOk()->assertJsonPath('has_payment_proof', true)->assertJsonMissingPath('payment_proof_path');
        Storage::disk('local')->assertExists($order->fresh()->payment_proof_path);
        $this->assertSame('unpaid', $order->fresh()->payment_status);
        $this->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'cash'])->assertUnprocessable();
        $cashier = User::factory()->create(['role' => 'cashier']);
        $this->actingAs($cashier)->get("/api/orders/{$order->id}/payment-proof")->assertOk();
        $this->actingAs($cashier)->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'qris'])->assertOk()->assertJsonPath('payment_status', 'paid');
        $this->assertNull($order->fresh()->qris_slot);
        $this->postJson("/api/orders/{$order->id}/qris")->assertUnprocessable();
    }

    public function test_pending_orders_have_distinct_persistent_codes_and_require_proof(): void
    {
        $user = User::factory()->create();
        $one = Order::create(['order_number' => 'ONE', 'user_id' => $user->id, 'subtotal' => 20000, 'discount' => 0, 'total' => 20000, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);
        $two = Order::create(['order_number' => 'TWO', 'user_id' => $user->id, 'subtotal' => 20000, 'discount' => 0, 'total' => 20000, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);
        $this->actingAs($user)->postJson("/api/orders/{$one->id}/payment-proof", ['proof' => UploadedFile::fake()->image('early.png')])->assertUnprocessable();
        $first = $this->postJson("/api/orders/{$one->id}/qris")->assertOk()->json('unique_code');
        $second = $this->postJson("/api/orders/{$two->id}/qris")->assertOk()->json('unique_code');
        $this->assertNotSame($first, $second);
        $this->postJson("/api/orders/{$one->id}/qris")->assertJsonPath('unique_code', $first);
        $cashier = User::factory()->create(['role' => 'cashier']);
        $this->actingAs($cashier)->postJson("/api/orders/{$one->id}/pay", ['payment_method' => 'qris'])->assertUnprocessable();
    }

    public function test_pos_checkout_cash_validation_and_stock(): void
    {
        $cashier = User::factory()->create(['role' => 'cashier']);
        $category = Category::create(['name' => 'Coffee', 'slug' => 'coffee']);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Latte', 'slug' => 'latte', 'price' => 15000, 'stock' => 5, 'is_active' => true]);
        $payload = ['order_source' => 'pos', 'guest_name' => 'Walk-in', 'items' => [['product_id' => $product->id, 'quantity' => 2]]];
        $customer = User::factory()->create();
        $this->actingAs($customer)->postJson('/api/orders', $payload)->assertForbidden();
        $response = $this->actingAs($cashier)->postJson('/api/orders', $payload)->assertCreated()->assertJsonPath('order_source', 'pos')->assertJsonPath('total', '30000.00');
        $id = $response->json('id');
        $this->assertSame(3, $product->fresh()->stock);
        $this->postJson("/api/orders/{$id}/pay", ['payment_method' => 'cash', 'cash_received' => 20000])->assertUnprocessable();
        $this->assertSame('unpaid', Order::find($id)->payment_status);
        $this->postJson("/api/orders/{$id}/pay", ['payment_method' => 'cash', 'cash_received' => 50000])->assertOk()->assertJsonPath('cash_received', '50000.00')->assertJsonPath('payment_status', 'paid');
        $this->postJson("/api/orders/{$id}/pay", ['payment_method' => 'cash', 'cash_received' => 50000])->assertUnprocessable();
    }

    public function test_pos_qris_requires_generated_amount_and_only_staff_can_confirm_without_proof(): void
    {
        $customer = User::factory()->create();
        $cashier = User::factory()->create(['role' => 'cashier']);
        $order = Order::create(['order_number' => 'POS-QR', 'order_source' => 'pos', 'user_id' => $customer->id, 'subtotal' => 10000, 'discount' => 0, 'total' => 10000, 'status' => 'awaiting_payment', 'payment_status' => 'unpaid']);
        $this->actingAs($cashier)->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'qris'])->assertUnprocessable();
        $this->postJson("/api/orders/{$order->id}/qris")->assertOk();
        $this->assertFalse($order->fresh()->has_payment_proof);
        $this->actingAs($customer)->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'qris'])->assertForbidden();
        $this->actingAs($cashier)->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'qris'])->assertOk()->assertJsonPath('payment_status', 'paid');
        $this->assertNull($order->fresh()->qris_slot);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Room;
use App\Models\Testimonial;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@coffee.shop',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'phone' => '081234567890',
        ]);

        User::create([
            'name' => 'Kasir Utama',
            'email' => 'kasir@coffee.shop',
            'password' => Hash::make('password'),
            'role' => 'cashier',
            'phone' => '081234567891',
        ]);

        User::create([
            'name' => 'John Doe',
            'email' => 'user@coffee.shop',
            'password' => Hash::make('password'),
            'role' => 'user',
            'phone' => '081234567892',
        ]);

        $categories = [
            ['name' => 'Hot Coffee', 'slug' => 'hot-coffee', 'icon' => 'coffee'],
            ['name' => 'Cold Coffee', 'slug' => 'cold-coffee', 'icon' => 'snowflake'],
            ['name' => 'Cup Coffee', 'slug' => 'cup-coffee', 'icon' => 'cup-soda'],
            ['name' => 'Dessert', 'slug' => 'dessert', 'icon' => 'cake'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        $products = [
            ['category_id' => 1, 'name' => 'Lungo Coffee', 'description' => 'Espresso panjang dengan rasa kaya dan halus', 'price' => 35000, 'image' => 'https://images.unsplash.com/photo-1514432324607-09f976329a59?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 1, 'name' => 'Dalgona Coffee', 'description' => 'Kopi whipped creamy yang viral dan lezat', 'price' => 42000, 'image' => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 1, 'name' => 'Iced Coffee Latte', 'description' => 'Perpaduan espresso dan susu dingin', 'price' => 38000, 'image' => 'https://images.unsplash.com/photo-1517701550927-30cf4c1e86c3?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 1, 'name' => 'Classic Cappuccino', 'description' => 'Espresso dengan foam susu yang sempurna', 'price' => 36000, 'image' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 2, 'name' => 'Iced Americano', 'description' => 'Espresso dingin yang menyegarkan', 'price' => 32000, 'image' => 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 2, 'name' => 'Cold Brew', 'description' => 'Seduhan dingin 18 jam, smooth dan rendah asam', 'price' => 45000, 'image' => 'https://images.unsplash.com/photo-1517701603779-8ce7bd7dd6f5?w=400&h=400&fit=crop', 'is_featured' => false],
            ['category_id' => 3, 'name' => 'Mocha Frappe', 'description' => 'Blend cokelat dan kopi yang creamy', 'price' => 48000, 'image' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 3, 'name' => 'Caramel Macchiato', 'description' => 'Espresso dengan caramel dan susu berlapis', 'price' => 44000, 'image' => 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=400&fit=crop', 'is_featured' => false],
            ['category_id' => 4, 'name' => 'Chocolate Tiramisu', 'description' => 'Dessert klasik Italia dengan sentuhan kopi', 'price' => 55000, 'image' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 4, 'name' => 'Cheesecake', 'description' => 'Cheesecake lembut dengan topping karamel', 'price' => 48000, 'image' => 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 4, 'name' => 'Croissant', 'description' => 'Pastry Prancis renyah dan buttery', 'price' => 28000, 'image' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop', 'is_featured' => true],
            ['category_id' => 4, 'name' => 'Brownies', 'description' => 'Brownies cokelat pekat yang fudgy', 'price' => 32000, 'image' => 'https://images.unsplash.com/photo-1607924480599-8159a04a4c4?w=400&h=400&fit=crop', 'is_featured' => false],
        ];

        foreach ($products as $product) {
            Product::create([
                ...$product,
                'slug' => Str::slug($product['name']).'-'.Str::random(4),
                'stock' => 50,
            ]);
        }

        $testimonials = [
            ['name' => 'Sam Williams', 'role' => 'Entrepreneur', 'content' => 'Kopi terbaik di kota! Suasana nyaman dan barista sangat profesional. Sudah jadi tempat favorit saya setiap pagi.', 'rating' => 5, 'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'],
            ['name' => 'Sarah Chen', 'role' => 'Designer', 'content' => 'Desain interior yang cantik dan kopi yang konsisten enaknya. Perfect spot untuk meeting atau kerja remote.', 'rating' => 5, 'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'],
            ['name' => 'Michael Ross', 'role' => 'Developer', 'content' => 'Dalgona coffee mereka luar biasa! Harga terjangkau dengan kualitas premium. Highly recommended!', 'rating' => 5, 'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'],
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::create($testimonial);
        }

        $vouchers = [
            ['code' => 'COFFEE15', 'description' => 'Diskon 15% newsletter', 'type' => 'percent', 'value' => 15, 'min_order' => 50000],
            ['code' => 'WELCOME20', 'description' => 'Diskon 20% member baru', 'type' => 'percent', 'value' => 20, 'min_order' => 75000, 'max_uses' => 100],
            ['code' => 'HEMAT10K', 'description' => 'Potongan Rp 10.000', 'type' => 'fixed', 'value' => 10000, 'min_order' => 50000],
            ['code' => 'KOPI50', 'description' => 'Diskon 50% spesial', 'type' => 'percent', 'value' => 50, 'min_order' => 100000, 'max_uses' => 10],
        ];

        foreach ($vouchers as $voucher) {
            Voucher::create($voucher);
        }

        $rooms = [
            [
                'name' => 'Private Room A',
                'description' => 'Ruangan privat nyaman untuk meeting kecil atau hangout 2-4 orang.',
                'capacity' => 4,
                'price_per_hour' => 75000,
                'image' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
                'amenities' => ['WiFi', 'AC', 'TV'],
            ],
            [
                'name' => 'Meeting Room B',
                'description' => 'Ruang meeting dengan meja besar, cocok untuk diskusi tim 6-10 orang.',
                'capacity' => 10,
                'price_per_hour' => 150000,
                'image' => 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop',
                'amenities' => ['WiFi', 'AC', 'Proyektor', 'Whiteboard'],
            ],
            [
                'name' => 'Lounge VIP',
                'description' => 'Lounge eksklusif dengan sofa premium, ideal untuk acara privat.',
                'capacity' => 8,
                'price_per_hour' => 200000,
                'image' => 'https://images.unsplash.com/photo-1600607686527-6e2d0b0e0b0a?w=600&h=400&fit=crop',
                'amenities' => ['WiFi', 'AC', 'Sound System', 'Mini Bar'],
            ],
        ];

        foreach ($rooms as $room) {
            Room::create([
                ...$room,
                'slug' => Str::slug($room['name']).'-'.Str::random(4),
            ]);
        }
    }
}

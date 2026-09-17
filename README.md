# Coffee Shop — Full Stack Application

Aplikasi web coffee shop dengan frontend React dan backend Laravel API yang terpisah.

## Struktur Project

```
coffee/
├── backend/     # Laravel API (Laravel 12 + Sanctum)
├── frontend/    # React + Vite + Tailwind CSS
└── README.md
```

## Fitur

### Publik
- Landing page modern dengan hero, kategori, produk, testimonial, newsletter
- Halaman shop dengan filter kategori & pencarian
- Registrasi & login

### Role: User
- Belanja produk & keranjang
- Checkout & riwayat pesanan

### Role: Kasir
- Dashboard ringkasan harian
- Kelola pesanan (pending → preparing → completed)

### Role: Super Admin
- Dashboard analytics (pendapatan, produk terlaris)
- CRUD produk & kategori
- Kelola semua user & role
- Kelola semua pesanan

## Requirements

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL (database: `coffe_shop`)
- Laragon (recommended)

## Setup Backend

```bash
cd backend

# Pastikan database coffe_shop sudah dibuat di MySQL
# Konfigurasi .env sudah diset:
# DB_DATABASE=coffe_shop
# DB_USERNAME=root
# DB_PASSWORD=

php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8080
```

API berjalan di: `http://127.0.0.1:8080`

> **Penting:** Gunakan port **8080**, bukan 8000. Port 8000 sering sudah dipakai aplikasi lain di Laragon sehingga API akan 404.

## Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di: `http://localhost:5173`

### Jalankan Keduanya Sekaligus (Windows)

Double-click `start-dev.bat` di folder root project, atau:

```bash
# Terminal 1 - Backend
cd backend
php artisan serve --host=127.0.0.1 --port=8080

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Akun Demo

| Role        | Email               | Password |
|-------------|---------------------|----------|
| Super Admin | admin@coffee.shop   | password |
| Kasir       | kasir@coffee.shop   | password |
| User        | user@coffee.shop    | password |

## API Endpoints

### Public
- `POST /api/register` — Registrasi user
- `POST /api/login` — Login
- `GET /api/products` — List produk
- `GET /api/categories` — List kategori
- `GET /api/testimonials` — Testimonial
- `POST /api/subscribe` — Newsletter

### Authenticated (Bearer Token)
- `GET /api/me` — Profile user
- `POST /api/orders` — Buat pesanan
- `GET /api/orders` — List pesanan

### Kasir & Admin
- `PATCH /api/orders/{id}/status` — Update status pesanan
- `GET /api/dashboard/stats` — Statistik dashboard

### Super Admin Only
- CRUD `/api/products`, `/api/categories`, `/api/users`, `/api/testimonials`
- `GET /api/subscribers` — List subscriber

## Tech Stack

**Backend:** Laravel 12, Sanctum, MySQL  
**Frontend:** React 19, Vite, Tailwind CSS v4, React Router, Axios, Lucide Icons

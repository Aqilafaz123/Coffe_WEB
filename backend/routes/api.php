<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MidtransController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomReservationController;
use App\Http\Controllers\Api\SubscriberController;
use App\Http\Controllers\Api\TestimonialController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/testimonials', [TestimonialController::class, 'index']);
Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/{room}', [RoomController::class, 'show']);
Route::get('/rooms/{room}/availability', [RoomController::class, 'availability']);
Route::post('/subscribe', [SubscriberController::class, 'subscribe']);
Route::post('/midtrans/notification', [MidtransController::class, 'notification']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::get('/orders/{order}/receipt', [OrderController::class, 'receipt']);
    Route::post('/orders/{order}/pay', [OrderController::class, 'processPayment']);
    Route::post('/orders/{order}/snap-token', [MidtransController::class, 'snapToken']);
    Route::post('/orders/{order}/verify-payment', [MidtransController::class, 'verifyPayment']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{order}/voucher', [VoucherController::class, 'applyToOrder']);
    Route::delete('/orders/{order}/voucher', [VoucherController::class, 'removeFromOrder']);
    Route::post('/vouchers/validate', [VoucherController::class, 'validateCode']);
    Route::post('/testimonials/submit', [TestimonialController::class, 'submit']);

    Route::get('/reservations', [RoomReservationController::class, 'index']);
    Route::post('/reservations', [RoomReservationController::class, 'store']);
    Route::get('/reservations/{reservation}', [RoomReservationController::class, 'show']);
    Route::post('/reservations/{reservation}/cancel', [RoomReservationController::class, 'cancel']);

    Route::middleware('role:cashier,superadmin')->group(function () {
        Route::patch('/reservations/{reservation}/status', [RoomReservationController::class, 'updateStatus']);
        Route::get('/customers', [UserController::class, 'customers']);
        Route::post('/customers', [UserController::class, 'storeCustomer']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    });

    Route::middleware('role:superadmin')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);

        Route::post('/testimonials', [TestimonialController::class, 'store']);
        Route::put('/testimonials/{testimonial}', [TestimonialController::class, 'update']);
        Route::delete('/testimonials/{testimonial}', [TestimonialController::class, 'destroy']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        Route::get('/subscribers', [SubscriberController::class, 'index']);

        Route::get('/vouchers', [VoucherController::class, 'index']);
        Route::post('/vouchers', [VoucherController::class, 'store']);
        Route::put('/vouchers/{voucher}', [VoucherController::class, 'update']);
        Route::delete('/vouchers/{voucher}', [VoucherController::class, 'destroy']);

        Route::get('/manage/rooms', [RoomController::class, 'adminIndex']);
        Route::post('/rooms', [RoomController::class, 'store']);
        Route::put('/rooms/{room}', [RoomController::class, 'update']);
        Route::delete('/rooms/{room}', [RoomController::class, 'destroy']);
    });
});

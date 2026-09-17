import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import UserHistory from './pages/UserHistory';
import CashierDashboard from './pages/cashier/CashierDashboard';
import CashierOrders from './pages/cashier/CashierOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminVouchers from './pages/admin/AdminVouchers';
import StaffCreateCustomer from './pages/staff/StaffCreateCustomer';
import Payment from './pages/Payment';
import PaymentFinish from './pages/PaymentFinish';
import Reservasi from './pages/Reservasi';
import Location from './pages/Location';
import AdminRooms from './pages/admin/AdminRooms';
import StaffReservations from './pages/staff/StaffReservations';
import QueueStatus from './pages/QueueStatus';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reservasi" element={<Reservasi />} />
            <Route path="/lokasi" element={<Location />} />
            <Route path="/keranjang" element={
              <ProtectedRoute roles={['user', 'cashier', 'superadmin']}>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/riwayat" element={
              <ProtectedRoute roles={['user']}>
                <UserHistory />
              </ProtectedRoute>
            } />
            <Route path="/pesanan" element={
              <ProtectedRoute roles={['user']}>
                <UserHistory />
              </ProtectedRoute>
            } />
            <Route path="/reservasi/saya" element={
              <ProtectedRoute roles={['user']}>
                <UserHistory />
              </ProtectedRoute>
            } />
            <Route path="/pembayaran/:orderId" element={
              <ProtectedRoute roles={['user', 'cashier', 'superadmin']}>
                <Payment />
              </ProtectedRoute>
            } />
            <Route path="/pembayaran/:orderId/selesai" element={
              <ProtectedRoute roles={['user', 'cashier', 'superadmin']}>
                <PaymentFinish />
              </ProtectedRoute>
            } />
            <Route path="/antrian/:orderId" element={
              <ProtectedRoute roles={['user', 'cashier', 'superadmin']}>
                <QueueStatus />
              </ProtectedRoute>
            } />
            <Route path="/kasir" element={
              <ProtectedRoute roles={['cashier']}>
                <CashierDashboard />
              </ProtectedRoute>
            } />
            <Route path="/kasir/orders" element={
              <ProtectedRoute roles={['cashier']}>
                <CashierOrders />
              </ProtectedRoute>
            } />
            <Route path="/kasir/pelanggan" element={
              <ProtectedRoute roles={['cashier']}>
                <StaffCreateCustomer />
              </ProtectedRoute>
            } />
            <Route path="/kasir/reservasi" element={
              <ProtectedRoute roles={['cashier']}>
                <StaffReservations role="cashier" />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute roles={['superadmin']}>
                <AdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/vouchers" element={
              <ProtectedRoute roles={['superadmin']}>
                <AdminVouchers />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['superadmin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute roles={['superadmin']}>
                <AdminOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/pelanggan" element={
              <ProtectedRoute roles={['superadmin']}>
                <StaffCreateCustomer />
              </ProtectedRoute>
            } />
            <Route path="/admin/rooms" element={
              <ProtectedRoute roles={['superadmin']}>
                <AdminRooms />
              </ProtectedRoute>
            } />
            <Route path="/admin/reservasi" element={
              <ProtectedRoute roles={['superadmin']}>
                <StaffReservations role="superadmin" />
              </ProtectedRoute>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

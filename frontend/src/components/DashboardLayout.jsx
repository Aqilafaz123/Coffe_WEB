import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, Coffee, BarChart3, Store, ShoppingBag, UserPlus, Tag, DoorOpen, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sharedOrderLinks = [
  { to: '/shop', icon: Store, label: 'Menu / Shop' },
  { to: '/keranjang', icon: ShoppingBag, label: 'Pesan untuk Pelanggan' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/pelanggan', icon: UserPlus, label: 'Buat Akun Pelanggan' },
  ...sharedOrderLinks,
  { to: '/admin/products', icon: Package, label: 'Produk' },
  { to: '/admin/rooms', icon: DoorOpen, label: 'Ruangan' },
  { to: '/admin/vouchers', icon: Tag, label: 'Voucher' },
  { to: '/admin/users', icon: Users, label: 'Pengguna' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Pesanan' },
  { to: '/admin/reservasi', icon: CalendarDays, label: 'Reservasi' },
];

const cashierLinks = [
  { to: '/kasir', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kasir/pelanggan', icon: UserPlus, label: 'Buat Akun Pelanggan' },
  ...sharedOrderLinks,
  { to: '/kasir/orders', icon: ShoppingCart, label: 'Pesanan' },
  { to: '/kasir/reservasi', icon: CalendarDays, label: 'Reservasi' },
];

export default function DashboardLayout({ children, title, role }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const links = role === 'superadmin' ? adminLinks : cashierLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-coffee-50 flex">
      <aside className="w-64 bg-coffee-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <Coffee className="text-gold" size={28} />
            <span className="font-display text-xl font-bold">COFFEE</span>
          </Link>
          <p className="text-white/50 text-xs mt-2 capitalize">{role === 'superadmin' ? 'Super Admin' : 'Kasir'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-white/50">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-coffee-100 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-coffee-900">{title}</h1>
            <Link to="/" className="text-coffee-500 text-sm hover:text-coffee-900 transition-colors flex items-center gap-2">
              <BarChart3 size={16} />
              Kembali ke Website
            </Link>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

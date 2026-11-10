import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, BarChart3, Store, ShoppingBag, UserPlus, Tag, Boxes, ScrollText, History, TrendingUp, KeyRound, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sharedOrderLinks = [
  { to: '/shop', icon: Store, label: 'Menu / Shop' },
  { to: '/keranjang', icon: ShoppingBag, label: 'Pesan untuk Pelanggan' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/pnl', icon: TrendingUp, label: 'Laba Rugi (P&L)' },
  { to: '/admin/pelanggan', icon: UserPlus, label: 'Buat Akun Pelanggan' },
  ...sharedOrderLinks,
  { to: '/admin/categories', icon: Tag, label: 'Kategori' },
  { to: '/admin/products', icon: Package, label: 'Produk' },
  { to: '/admin/bahan', icon: Boxes, label: 'Bahan Baku' },
  { to: '/admin/resep', icon: ScrollText, label: 'Resep Produk' },
  { to: '/admin/vouchers', icon: Tag, label: 'Voucher' },
  { to: '/admin/users', icon: Users, label: 'Pengguna' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Pesanan' },
];

const cashierLinks = [
  { to: '/kasir', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kasir/pos', icon: Store, label: 'Transaksi Offline / POS' },
  { to: '/kasir/pelanggan', icon: UserPlus, label: 'Buat Akun Pelanggan' },
  ...sharedOrderLinks,
  { to: '/kasir/orders', icon: ShoppingCart, label: 'Pesanan' },
];

const logisticsLinks = [
  { to: '/logistik', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/logistik/bahan', icon: Boxes, label: 'Bahan Baku (Stok)' },
  { to: '/logistik/resep', icon: ScrollText, label: 'Resep Produk (BOM)' },
  { to: '/logistik/mutasi', icon: History, label: 'Riwayat Mutasi' },
];

export default function DashboardLayout({ children, title, role }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openPath, setOpenPath] = useState(null);
  const sidebarOpen = openPath === location.pathname;
  const links = role === 'superadmin' ? adminLinks : role === 'logistics' ? logisticsLinks : cashierLinks;
  const roleName = role === 'superadmin' ? 'Super Admin' : role === 'logistics' ? 'Staff Logistik' : 'Kasir';

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenPath(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
          <div className="min-h-screen bg-coffee-50 flex print:bg-white print:block w-full overflow-x-clip">
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40 lg:hidden no-print print:hidden"
                onClick={() => setOpenPath(null)}
                aria-hidden="true"
              />
            )}

            <aside
              className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[82vw] bg-coffee-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 no-print print:hidden ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                }`}
            >
              <div className="p-5 sm:p-6 border-b border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/" className="flex items-center gap-3 group min-w-0">
                    <img
                      src="/logo-white.png"
                      alt="Rahardja"
                      className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-display text-lg font-bold text-white tracking-wider leading-none">RAHARDJA</span>
                      <span className="text-[9px] tracking-widest text-gold uppercase font-medium mt-0.5 truncate">Es Krim, Teh &amp; Kopi</span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpenPath(null)}
                    className="lg:hidden p-1.5 -mr-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    aria-label="Tutup menu"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-2.5 capitalize">{roleName}</p>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpenPath(null)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${location.pathname === to
                        ? 'bg-white/15 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-white/10">
                  <div className="px-4 py-2 mb-2 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-white/50 truncate">{user?.email}</p>
                  </div>
                    <Link
                      to="/akun/password"
                      onClick={() => setOpenPath(null)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/80 hover:bg-white/10"
                    >
                      <KeyRound size={18} className="shrink-0" /> Ganti Password
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 w-full transition-colors"
                    >
                      <LogOut size={18} className="shrink-0" />
                      Logout
                    </button>
                </div>
            </aside>

                    <main className="flex-1 min-w-0 lg:ml-64 print:ml-0 print:p-0">
                      <header className="bg-white border-b border-coffee-100 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 sticky top-0 z-30 no-print print:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => setOpenPath(location.pathname)}
                              className="lg:hidden p-2 -ml-2 rounded-xl text-coffee-700 hover:text-coffee-900 hover:bg-coffee-50 transition-colors shrink-0"
                              aria-label="Buka menu navigasi"
                            >
                              <Menu size={22} />
                            </button>
                            <h1 className="font-display text-lg sm:text-2xl font-bold text-coffee-900 truncate min-w-0">{title}</h1>
                          </div>
                          <Link
                            to="/"
                            className="text-coffee-500 text-xs sm:text-sm hover:text-coffee-900 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap"
                          >
                            <BarChart3 size={16} className="shrink-0" />
                            <span className="hidden sm:inline">Kembali ke Website</span>
                            <span className="sm:hidden">Website</span>
                          </Link>
                        </div>
                      </header>
                      <div className="p-4 sm:p-6 lg:p-8 print:p-0 max-w-full">{children}</div>
                    </main>
                </div>
                );
}

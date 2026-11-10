import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, User, LogOut, History, Clock, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api, { formatPrice } from '../lib/api';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/pantau-pesanan', label: 'Pantau Pesanan', isSpecial: true },
  { to: '/shop?category=hot-coffee', label: 'Coffee' },
  { to: '/shop?category=dessert', label: 'Bakery' },
  { to: '/lokasi', label: 'Location' },
  { to: '/#about', label: 'About' },
];

export default function Navbar() {
  const [openRouteKey, setOpenRouteKey] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const { user, logout, getDashboardPath } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const routeKey = location.pathname + location.search;
  const open = openRouteKey === routeKey;
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!searchOpen) return;

    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      api.get('/products', { params: { search: q } })
        .then((r) => setResults(r.data.slice(0, 5)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToSearch = (query) => {
    const q = query.trim();
    if (!q) return;
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToSearch(searchQuery);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? 'glass-nav' : 'bg-coffee-900 shadow-lg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-2 h-16 md:h-20">
              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
                <img
                  src="/logo-white.png"
                  alt="Rahardja"
                  className="h-8 sm:h-9 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
                />
                    <div className="flex flex-col min-w-0">
                      <span className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wider leading-none truncate">
                        RAHARDJA
                      </span>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] tracking-widest text-gold uppercase font-medium mt-0.5 truncate">
                          Es Krim, Teh &amp; Kopi
                        </span>
                    </div>
                  </Link>

                    <div className="hidden lg:flex items-center gap-5 xl:gap-8">
                      {navLinks.map((link) => (
                        <Link
                          key={link.label}
                          to={link.to}
                          className={
                            link.isSpecial
                                ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold hover:bg-gold/30 text-xs font-bold tracking-wider uppercase border border-gold/40 transition-all hover:scale-105 shadow-sm whitespace-nowrap shrink-0'
                                : 'text-white/80 hover:text-white text-sm font-medium tracking-wide uppercase transition-colors whitespace-nowrap shrink-0'
                          }
                        >
                          {link.isSpecial && <Clock size={13} className="text-gold animate-pulse shrink-0" />}
                          {link.label}
                        </Link>
                      ))}
                    </div>

                      <div className="flex items-center gap-1 sm:gap-2.5 lg:gap-4 shrink-0">
                        <button
                          onClick={() => setSearchOpen(!searchOpen)}
                          className="text-white/80 hover:text-white transition-colors p-2"
                          aria-label="Search"
                        >
                          <Search size={20} />
                        </button>

                        {user && ['user', 'cashier', 'superadmin'].includes(user.role) && (
                            <Link to="/keranjang" className="relative text-white/80 hover:text-white transition-colors p-2" aria-label="Keranjang">
                              <ShoppingBag size={20} />
                              {itemCount > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-coffee-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {itemCount}
                                  </span>
                )}
                                </Link>
                              )}

                              {user ? (
                                  <div className="hidden lg:flex items-center gap-2.5 xl:gap-3">
                                    {user.role === 'user' && (
                                      <Link
                                        to="/riwayat"
                                        className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors whitespace-nowrap"
                                        title="Riwayat"
                                      >
                                        <History size={18} />
                                        <span>Riwayat</span>
                                      </Link>
                                    )}
                                    <Link
                                      to={getDashboardPath(user.role)}
                                      className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors whitespace-nowrap"
                                    >
                                      <User size={18} />
                                      <span className="max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                                    </Link>
                                    <Link to="/akun/password" title="Ganti Password" aria-label="Ganti Password" className="text-white/80 hover:text-white p-2"><KeyRound size={18} /></Link>
                                    <button onClick={logout} className="text-white/60 hover:text-white transition-colors p-2" aria-label="Logout">
                                      <LogOut size={18} />
                                    </button>
                                  </div>
                                  ) : (
                                  <Link
                                    to="/login"
                                    className="hidden lg:block text-white/80 hover:text-white text-sm font-medium tracking-wide uppercase transition-colors whitespace-nowrap"
                                  >
                                    Login
                                  </Link>
            )}

                                  <button
                                    onClick={() => setOpenRouteKey(open ? null : routeKey)}
                                    className="lg:hidden text-white p-2 -mr-1"
                                    aria-label="Menu"
                                  >
                                    {open ? <X size={24} /> : <Menu size={24} />}
                                  </button>
                                </div>
        </div>

                            {searchOpen && (
                              <div ref={searchRef} className="pb-4 animate-fade-in relative">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari kopi, dessert... (min. 2 huruf)"
                                    className="flex-1 min-w-0 px-4 py-2 rounded-full bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                                    autoFocus
                                  />
                                  <button
                                    type="submit"
                                    disabled={searchQuery.trim().length < 2}
                                    className="px-4 sm:px-5 py-2 rounded-full bg-white text-coffee-900 text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                  >
                                    Cari
                                  </button>
                                </form>

                                {(searching || results.length > 0 || (searchQuery.trim().length >= 2 && !searching)) && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-coffee-100 overflow-hidden z-50 max-h-[65vh] overflow-y-auto">
                                      {searching ? (
                                        <p className="px-4 py-3 text-sm text-coffee-500">Mencari...</p>
                                      ) : results.length > 0 ? (
                                        <>
                                          {results.map((p) => (
                                            <button
                                              key={p.id}
                                              type="button"
                                              onClick={() => goToSearch(p.name)}
                                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-coffee-50 text-left transition-colors"
                                            >
                                              {p.image && (
                          <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-coffee-100 shrink-0" />
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-coffee-900 truncate">{p.name}</p>
                                                <p className="text-xs text-coffee-500 truncate">{p.category?.name}</p>
                                              </div>
                                              <span className="text-sm text-coffee-700 shrink-0">{formatPrice(p.price)}</span>
                                            </button>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() => goToSearch(searchQuery)}
                                            className="w-full px-4 py-2.5 text-sm text-coffee-700 bg-coffee-50 hover:bg-coffee-100 border-t border-coffee-100 truncate"
                                          >
                                            Lihat semua hasil untuk &quot;{searchQuery.trim()}&quot;
                                          </button>
                                        </>
                                      ) : (
                                        <p className="px-4 py-3 text-sm text-coffee-500">Tidak ada produk ditemukan.</p>
                                      )}
                                    </div>
            )}
                                  </div>
                                )}
                              </div>

      {open && (
                                  <div className="lg:hidden bg-coffee-900/95 backdrop-blur-lg border-t border-white/10 animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
                                    <div className="px-4 py-4 space-y-2.5">
                                      {navLinks.map((link) => (
                                        link.isSpecial ? (
                                          <Link
                                            key={link.label}
                                            to={link.to}
                                            onClick={() => setOpenRouteKey(null)}
                                            className="flex items-center gap-2 text-gold font-bold py-2.5 px-3 rounded-xl bg-gold/15 border border-gold/30 text-sm tracking-wide uppercase shadow-sm"
                                          >
                                            <Clock size={16} className="text-gold animate-pulse shrink-0" />
                                            {link.label}
                                          </Link>
                                        ) : (
                                          <Link
                                            key={link.label}
                                            to={link.to}
                                            onClick={() => setOpenRouteKey(null)}
                                            className="block text-white/80 hover:text-white py-2 text-sm font-medium tracking-wide uppercase"
                                          >
                                            {link.label}
                                          </Link>
                                        )
                                      ))}
                                            <div className="border-t border-white/10 pt-2.5 space-y-2">
                                              {user ? (
                                                <>
                                                  {['user', 'cashier', 'superadmin'].includes(user.role) && (
                                                    <Link
                                                      to="/keranjang"
                                                      onClick={() => setOpenRouteKey(null)}
                                                      className="block text-white/80 hover:text-white py-2 text-sm"
                                                    >
                                                      Keranjang {itemCount > 0 && `(${itemCount})`}
                                                    </Link>
                                                  )}
                                                  {user.role === 'user' && (
                                                    <Link
                                                      to="/riwayat"
                                                      onClick={() => setOpenRouteKey(null)}
                                                      className="block text-white/80 hover:text-white py-2 text-sm"
                                                    >
                                                      Riwayat Saya
                                                    </Link>
                                                  )}
                                                  <Link
                                                    to={getDashboardPath(user.role)}
                                                    onClick={() => setOpenRouteKey(null)}
                                                    className="block text-white/80 hover:text-white py-2 text-sm"
                                                  >
                                                    {user.role === 'user' ? 'Akun Saya' : 'Dashboard'}
                                                  </Link>
                                                    <Link to="/akun/password" onClick={() => setOpenRouteKey(null)} className="block text-white/80 hover:text-white py-2 text-sm">Ganti Password</Link>
                                                    <button onClick={() => { logout(); setOpenRouteKey(null); }} className="block w-full text-left text-white/60 hover:text-white py-2 text-sm">
                                                      Logout
                                                    </button>
                                                  </>
                                                  ) : (
                                                  <Link to="/login" onClick={() => setOpenRouteKey(null)} className="block text-white/80 hover:text-white py-2 text-sm font-medium uppercase">
                                                    Login
                                                  </Link>
              )}
                                            </div>
          </div>
                                    </div>
      )}
                                  </nav>
                                  );
}

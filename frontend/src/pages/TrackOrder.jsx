import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock, Search, CheckCircle, Package, ArrowRight,
  RefreshCw, MapPin, Sparkles, ChevronRight, User, AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api, { formatPrice } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  awaiting_payment: { label: 'Menunggu Pembayaran', color: 'bg-amber-100 text-amber-800 border-amber-300', step: 1 },
  pending:          { label: 'Pesanan Diterima',      color: 'bg-yellow-100 text-yellow-800 border-yellow-300', step: 2 },
  preparing:        { label: 'Sedang Disiapkan',     color: 'bg-blue-100 text-blue-800 border-blue-300', step: 3 },
  completed:        { label: 'Pesanan Selesai',       color: 'bg-green-100 text-green-800 border-green-300', step: 4 },
  cancelled:        { label: 'Dibatalkan',            color: 'bg-red-100 text-red-800 border-red-300', step: 0 },
};

export default function TrackOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Live board data
  const [nowServing, setNowServing] = useState({ current_called: 0, total_waiting: 0, total_today: 0 });
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch now serving board
  const fetchNowServing = useCallback(async () => {
    try {
      const res = await api.get('/queue/now-serving');
      setNowServing(res.data);
      setLastRefreshed(new Date());
    } catch {
      // ignore
    }
  }, []);

  // Fetch logged in customer active orders
  const fetchActiveOrders = useCallback(async () => {
    if (!user) return;
    setLoadingActive(true);
    try {
      const res = await api.get('/queue/active');
      setActiveOrders(res.data?.orders || []);
    } catch {
      setActiveOrders([]);
    } finally {
      setLoadingActive(false);
    }
  }, [user]);

  // Handle Search
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchError('Silakan masukkan nomor pesanan (contoh: ORD-...)');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await api.get('/queue/track', { params: { query: q } });
      const orders = res.data?.orders || [];
      if (orders.length === 0) {
        setSearchError('Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.');
      } else {
        setSearchResult(orders);
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchNowServing();
    fetchActiveOrders();
  }, [fetchNowServing, fetchActiveOrders]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-coffee-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 text-coffee-900 border border-gold/30 text-xs font-semibold mb-3 tracking-wide uppercase">
              <Sparkles size={14} className="text-gold" />
              Live Order Tracker & Queue
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-coffee-900 mb-3">
              Pantau Pesanan & Nomor Antrian
            </h1>
            <p className="text-coffee-600 max-w-md mx-auto text-sm sm:text-base">
              Cek posisi antrian pesanan kopi Anda secara real-time. Ambil pesanan saat nomor antrian Anda dipanggil.
            </p>
          </div>

          {/* Digital Queue Display Board */}
          <div className="bg-gradient-to-br from-coffee-950 via-coffee-900 to-coffee-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-coffee-800/80 mb-10 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-coffee-700/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-ping" />
                  <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/80">
                    Papan Informasi Antrian Hari Ini
                  </span>
                </div>
                <button
                  onClick={() => { fetchNowServing(); if (user) fetchActiveOrders(); }}
                  className="flex items-center gap-1.5 text-xs text-gold hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 active:scale-95"
                  title="Segarkan Data"
                >
                  <RefreshCw size={13} className="hover:rotate-180 transition-transform duration-300" />
                  <span>Segarkan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {/* Currently Called */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center">
                  <span className="text-xs text-white/60 font-medium uppercase tracking-wider mb-1">
                    Sedang Dipanggil
                  </span>
                  <div className="font-mono text-4xl sm:text-5xl font-black text-gold tracking-tight py-1">
                    {nowServing.current_called > 0 ? (
                      `#${String(nowServing.current_called).padStart(3, '0')}`
                    ) : (
                      <span className="text-2xl text-white/40 font-normal">Belum ada</span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/50 mt-1">Nomor antrian di kasir</span>
                </div>

                {/* Waiting in Queue */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center">
                  <span className="text-xs text-white/60 font-medium uppercase tracking-wider mb-1">
                    Sedang Disiapkan
                  </span>
                  <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight py-1">
                    {nowServing.total_waiting}
                  </div>
                  <span className="text-[11px] text-white/50 mt-1">Antrian menunggu panggilan</span>
                </div>

                {/* Total Orders Today */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center">
                  <span className="text-xs text-white/60 font-medium uppercase tracking-wider mb-1">
                    Total Pesanan Hari Ini
                  </span>
                  <div className="font-mono text-4xl sm:text-5xl font-black text-white/90 tracking-tight py-1">
                    {nowServing.total_today}
                  </div>
                  <span className="text-[11px] text-white/50 mt-1">Pesanan terdaftar hari ini</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-coffee-100 mb-10">
            <h2 className="text-lg font-bold text-coffee-900 mb-2 flex items-center gap-2">
              <Search size={20} className="text-coffee-600" />
              Lacak Pesanan Berdasarkan Nomor
            </h2>
            <p className="text-sm text-coffee-500 mb-6">
              Punya struk atau nomor pesanan? Masukkan kode pesanan (misal <span className="font-mono bg-coffee-100 px-1.5 py-0.5 rounded text-coffee-800">ORD-XXXXXXXX</span>) atau nomor HP untuk melihat status & nomor antrian Anda.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nomor pesanan (contoh: ORD-...) atau No. HP"
                  className="w-full pl-4 pr-4 py-3.5 rounded-2xl bg-coffee-50/70 border border-coffee-200 text-coffee-900 placeholder-coffee-400 focus:outline-none focus:ring-2 focus:ring-coffee-700 text-sm font-medium transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-7 py-3.5 bg-coffee-900 hover:bg-coffee-800 text-white rounded-2xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-coffee-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {searching ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Mencari...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Cek Antrian
                  </>
                )}
              </button>
            </form>

            {searchError && (
              <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Search Results Display */}
          {searchResult && (
            <div className="mb-10 animate-fade-in">
              <h3 className="text-base font-bold text-coffee-900 mb-4 flex items-center gap-2">
                <span>Hasil Pencarian</span>
                <span className="text-xs font-normal text-coffee-500">({searchResult.length} pesanan ditemukan)</span>
              </h3>

              <div className="space-y-4">
                {searchResult.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  const isCalled = order.is_ready;

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                        isCalled ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20' : 'border-coffee-100 hover:border-coffee-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-coffee-100">
                        <div className="flex items-center gap-4">
                          {/* Big Queue Badge */}
                          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-coffee-900 to-coffee-950 text-white w-20 h-20 rounded-2xl shadow-md border-2 border-gold/40 shrink-0">
                            <span className="text-[10px] uppercase font-bold text-gold tracking-widest">Antrian</span>
                            <span className="font-mono text-2xl font-black text-white">
                              #{String(order.queue_number || order.id).padStart(3, '0')}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-coffee-900 text-base">{order.order_number}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-xs text-coffee-500">
                              {order.customer_name} · {new Date(order.created_at).toLocaleString('id-ID')}
                            </p>
                            {order.table_location && (
                              <p className="text-xs text-coffee-700 flex items-center gap-1 mt-1 font-medium">
                                <MapPin size={12} className="text-coffee-500" /> {order.table_location}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Call status / Button */}
                        <div className="flex flex-col sm:items-end gap-2">
                          {isCalled ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 animate-pulse">
                              🔔 Nomor Anda Dipanggil!
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-coffee-600">
                              {order.orders_ahead === 0
                                ? 'Giliran Anda berikutnya!'
                                : `${order.orders_ahead} antrian lagi di depan`}
                            </span>
                          )}

                          <Link
                            to={`/antrian/${order.id}`}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                          >
                            <span>Pantau Real-Time</span>
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>

                      <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-coffee-600 gap-2">
                        <span><strong>Menu:</strong> {order.items_summary || '-'}</span>
                        <span className="font-bold text-coffee-900 text-sm">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer's Active Orders (If Logged In) */}
          {user ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                  <Clock size={20} className="text-coffee-600" />
                  Pesanan Aktif Anda
                </h2>
                <Link
                  to="/riwayat"
                  className="text-xs font-semibold text-coffee-700 hover:text-coffee-900 flex items-center gap-1"
                >
                  <span>Semua Riwayat</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {loadingActive ? (
                <div className="flex justify-center py-12 bg-white rounded-3xl border border-coffee-100">
                  <div className="w-8 h-8 border-3 border-coffee-200 border-t-coffee-900 rounded-full animate-spin" />
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-coffee-100 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-coffee-100 text-coffee-500 flex items-center justify-center mx-auto mb-3">
                    <Package size={28} />
                  </div>
                  <h3 className="font-semibold text-coffee-900 mb-1">Belum Ada Pesanan Aktif</h3>
                  <p className="text-sm text-coffee-500 mb-5 max-w-sm mx-auto">
                    Anda belum memiliki pesanan aktif hari ini. Pesan kopi favorit Anda sekarang!
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-coffee-900 text-white text-sm font-semibold hover:bg-coffee-800 transition-all shadow-sm"
                  >
                    Beli Kopi Sekarang
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                    const isCalled = order.is_ready;

                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                          isCalled
                            ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                            : 'border-coffee-100 hover:border-coffee-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-coffee-100">
                          <div className="flex items-center gap-4">
                            {/* Big Queue Badge */}
                            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-coffee-900 to-coffee-950 text-white w-20 h-20 rounded-2xl shadow-md border-2 border-gold/40 shrink-0">
                              <span className="text-[10px] uppercase font-bold text-gold tracking-widest">Antrian</span>
                              <span className="font-mono text-2xl font-black text-white">
                                #{String(order.queue_number || order.id).padStart(3, '0')}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-coffee-900 text-base">{order.order_number}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-xs text-coffee-500">
                                {new Date(order.created_at).toLocaleString('id-ID')}
                              </p>
                              {order.table_location && (
                                <p className="text-xs text-coffee-700 flex items-center gap-1 mt-1 font-medium">
                                  <MapPin size={12} className="text-coffee-500" /> {order.table_location}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex flex-col sm:items-end gap-2">
                            {isCalled ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 animate-pulse">
                                🔔 Nomor Anda Dipanggil!
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-coffee-600">
                                {order.orders_ahead === 0
                                  ? 'Giliran Anda berikutnya!'
                                  : `${order.orders_ahead} antrian lagi di depan`}
                              </span>
                            )}

                            <Link
                              to={`/antrian/${order.id}`}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                            >
                              <span>Pantau Real-Time</span>
                              <ChevronRight size={14} />
                            </Link>
                          </div>
                        </div>

                        {/* Progress Stepper */}
                        <div className="py-4 border-b border-coffee-100">
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 font-bold ${
                                statusInfo.step >= 1 ? 'bg-coffee-900 text-white' : 'bg-coffee-100 text-coffee-400'
                              }`}>1</div>
                              <span className="text-[11px] text-coffee-700">Dipesan</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 font-bold ${
                                statusInfo.step >= 2 ? 'bg-coffee-900 text-white' : 'bg-coffee-100 text-coffee-400'
                              }`}>2</div>
                              <span className="text-[11px] text-coffee-700">Diterima</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 font-bold ${
                                statusInfo.step >= 3 ? 'bg-coffee-900 text-white' : 'bg-coffee-100 text-coffee-400'
                              }`}>3</div>
                              <span className="text-[11px] text-coffee-700">Disiapkan</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 font-bold ${
                                statusInfo.step >= 4 ? 'bg-green-600 text-white' : 'bg-coffee-100 text-coffee-400'
                              }`}>4</div>
                              <span className="text-[11px] text-coffee-700">Selesai</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-coffee-600 gap-2">
                          <span><strong>Menu:</strong> {order.items_summary || '-'}</span>
                          <span className="font-bold text-coffee-900 text-sm">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-coffee-100 to-amber-100/50 rounded-3xl p-6 border border-coffee-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-coffee-900 shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-coffee-900 text-sm">Sudah punya akun pelanggan?</h4>
                  <p className="text-xs text-coffee-600">Masuk untuk melihat semua pesanan dan antrian aktif Anda secara otomatis.</p>
                </div>
              </div>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-coffee-900 text-white text-xs font-semibold hover:bg-coffee-800 transition-all shrink-0"
              >
                Masuk Sekarang
              </Link>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Package, Clock, CheckCircle, XCircle, CreditCard, Wallet,
  Calendar, Users, ShoppingBag, DoorOpen, MapPin,
} from 'lucide-react';
import { PAYMENT_LABELS } from '../lib/paymentMethods';
import api, { formatPrice } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DownloadReceiptButton from '../components/DownloadReceiptButton';
import { canDownloadReceipt } from '../lib/orderHelpers';

const orderStatus = {
  awaiting_payment: { label: 'Belum Bayar', color: 'bg-orange-100 text-orange-800', icon: CreditCard },
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  preparing: { label: 'Disiapkan', color: 'bg-blue-100 text-blue-800', icon: Package },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const reservationStatus = {
  pending: { text: 'Menunggu', class: 'bg-amber-100 text-amber-800' },
  confirmed: { text: 'Dikonfirmasi', class: 'bg-green-100 text-green-800' },
  cancelled: { text: 'Dibatalkan', class: 'bg-red-100 text-red-800' },
  completed: { text: 'Selesai', class: 'bg-coffee-100 text-coffee-700' },
};

const tabs = [
  { id: 'pesanan', label: 'Pesanan Menu', icon: ShoppingBag },
  { id: 'reservasi', label: 'Reservasi Ruangan', icon: DoorOpen },
];

function formatDate(value) {
  if (!value) return '-';
  const d = String(value).slice(0, 10);
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function UserHistory() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const pathTab = location.pathname.includes('reservasi') ? 'reservasi' : 'pesanan';
  const activeTab = searchParams.get('tab') === 'reservasi' || searchParams.get('tab') === 'pesanan'
    ? searchParams.get('tab')
    : pathTab;

  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);

  const fetchOrders = () => {
    setLoadingOrders(true);
    api.get('/orders')
      .then((r) => setOrders(r.data))
      .finally(() => setLoadingOrders(false));
  };

  const fetchReservations = () => {
    setLoadingReservations(true);
    api.get('/reservations')
      .then((r) => setReservations(r.data))
      .finally(() => setLoadingReservations(false));
  };

  useEffect(() => { fetchOrders(); fetchReservations(); }, []);

  const setTab = (tab) => setSearchParams({ tab });

  const handleCancelReservation = async (id) => {
    if (!confirm('Batalkan reservasi ini?')) return;
    await api.post(`/reservations/${id}/cancel`);
    fetchReservations();
  };

  const loading = activeTab === 'pesanan' ? loadingOrders : loadingReservations;

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-coffee-900 mb-2">Riwayat Saya</h1>
          <p className="text-coffee-500 mb-8">Lihat semua pesanan menu dan reservasi ruangan Anda</p>

          <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm mb-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-coffee-900 text-white shadow-sm'
                    : 'text-coffee-600 hover:bg-coffee-50'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{id === 'pesanan' ? 'Menu' : 'Ruangan'}</span>
                {id === 'pesanan' && orders.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-white/20' : 'bg-coffee-100'}`}>
                    {orders.length}
                  </span>
                )}
                {id === 'reservasi' && reservations.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-white/20' : 'bg-coffee-100'}`}>
                    {reservations.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'pesanan' ? (
            orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <ShoppingBag size={48} className="mx-auto text-coffee-300 mb-4" />
                <p className="text-coffee-500 mb-6">Belum ada pesanan menu</p>
                <Link to="/shop" className="btn-primary">Mulai Belanja</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.some((o) => ['pending', 'preparing'].includes(o.status)) && (
                  <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-coffee-900 to-coffee-950 text-white shadow-md border border-coffee-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold shrink-0">
                        <Clock size={22} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Pesanan Anda Sedang Diproses!</h4>
                        <p className="text-xs text-white/70">Pantau pergerakan antrian pesanan kopi Anda secara live.</p>
                      </div>
                    </div>
                    <Link
                      to="/pantau-pesanan"
                      className="w-full sm:w-auto px-5 py-2.5 bg-gold hover:bg-gold/90 text-coffee-950 rounded-xl text-xs font-bold text-center transition-all shadow shrink-0"
                    >
                      Buka Papan Pantau ➔
                    </Link>
                  </div>
                )}

                {orders.map((order) => {
                  const status = order.status === 'awaiting_payment' && order.payment_method === 'cash'
                    ? { label: 'Bayar di Kasir', color: 'bg-amber-100 text-amber-800', icon: Wallet }
                    : (orderStatus[order.status] || orderStatus.pending);
                  const StatusIcon = status.icon;
                  return (
                    <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-coffee-900">{order.order_number}</p>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              🎫 No. Antrian #{String(order.queue_number || order.id).padStart(3, '0')}
                            </span>
                          </div>
                          <p className="text-coffee-500 text-sm">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${status.color}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </div>
                      {order.table_location && (
                        <p className="flex items-center gap-2 text-sm text-coffee-700 mb-3 px-3 py-2 bg-coffee-50 rounded-lg">
                          <MapPin size={14} /> {order.table_location}
                        </p>
                      )}
                      <div className="space-y-2 mb-4">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-coffee-600">
                            <span>{item.product?.name} x{item.quantity}</span>
                            <span>{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 mb-2">
                          <span>Diskon ({order.voucher_code})</span>
                          <span>-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t border-coffee-100 pt-4 mb-4">
                        <span>Total</span>
                        <span className="text-coffee-900">{formatPrice(order.total)}</span>
                      </div>
                      {canDownloadReceipt(order) && (
                        <p className="text-coffee-500 text-sm mb-3">
                          {order.payment_method && (
                            <>Bayar via {PAYMENT_LABELS[order.payment_method] || order.payment_method}</>
                          )}
                          {order.paid_at && (
                            <span className={order.payment_method ? ' · ' : ''}>
                              {new Date(order.paid_at).toLocaleString('id-ID')}
                            </span>
                          )}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 items-center pt-1 border-t border-coffee-100">
                        {/* Pantau Antrian Button */}
                        <Link
                          to={`/antrian/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-coffee-900 text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-coffee-800 transition-all shadow-sm active:scale-95"
                        >
                          <Clock size={14} />
                          Pantau Antrian
                        </Link>

                        {order.status === 'awaiting_payment' && order.payment_method === 'cash' && (
                          <Link to={`/pembayaran/${order.id}`} className="px-4 py-2 border-2 border-amber-300 text-amber-800 text-xs sm:text-sm rounded-full hover:bg-amber-50">
                            Lihat Instruksi Bayar
                          </Link>
                        )}
                        {order.status === 'awaiting_payment' && order.payment_method !== 'cash' && (
                          <Link to={`/pembayaran/${order.id}`} className="btn-primary inline-block text-xs sm:text-sm">
                            Bayar Sekarang
                          </Link>
                        )}
                        {canDownloadReceipt(order) && (
                          <DownloadReceiptButton
                            orderId={order.id}
                            orderNumber={order.order_number}
                            className="!border-coffee-900 !text-coffee-900 hover:!bg-coffee-900 hover:!text-white"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : reservations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl">
              <DoorOpen size={48} className="mx-auto text-coffee-300 mb-4" />
              <p className="text-coffee-500 mb-6">Belum ada reservasi ruangan</p>
              <Link to="/reservasi" className="btn-primary">Reservasi Ruangan</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((r) => {
                const st = reservationStatus[r.status] || reservationStatus.pending;
                return (
                  <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs text-coffee-400 mb-1">{r.reservation_number}</p>
                        <h3 className="font-semibold text-coffee-900">{r.room?.name}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${st.class}`}>
                        {st.text}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-coffee-600 mb-4">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} /> {formatDate(r.reservation_date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={14} /> {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users size={14} /> {r.guests_count} tamu · {r.duration_hours} jam
                      </span>
                      <span className="font-medium text-coffee-900">{formatPrice(r.total_price)}</span>
                    </div>
                    {r.notes && <p className="text-sm text-coffee-500 mb-4">Catatan: {r.notes}</p>}
                    {['pending', 'confirmed'].includes(r.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancelReservation(r.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                      >
                        <XCircle size={14} /> Batalkan Reservasi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

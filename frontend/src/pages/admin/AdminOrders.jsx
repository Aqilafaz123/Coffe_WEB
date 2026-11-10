import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import { getOrderCustomerLabel, isWalkInOrder } from '../../lib/orderHelpers';
import DashboardLayout from '../../components/DashboardLayout';
import DownloadReceiptButton from '../../components/DownloadReceiptButton';

const statusLabels = { awaiting_payment: 'Belum Bayar', pending: 'Pending', preparing: 'Disiapkan', completed: 'Selesai', cancelled: 'Batal' };
const statusColors = {
  awaiting_payment: 'bg-orange-100 text-orange-800',
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    const { data } = await api.get('/orders');
    setOrders(data);
  };

  return (
    <DashboardLayout title="Semua Pesanan" role="superadmin">
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-coffee-900 break-words">{order.order_number}</p>
                          <p className="text-sm text-coffee-500 break-words">
                            {getOrderCustomerLabel(order)}
                            {isWalkInOrder(order) ? (
                              <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">Walk-in</span>
                            ) : (
                      <span className="text-coffee-400 break-all"> ({order.user?.email})</span>
                            )}
                            {order.guest_phone && <span className="text-coffee-400"> · {order.guest_phone}</span>}
                          </p>
                          <p className="text-xs text-coffee-400">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border-0 cursor-pointer shrink-0 ${statusColors[order.status]}`}
                        >
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      {order.table_location && (
                          <div className="flex items-center gap-2 mb-4 px-3.5 sm:px-4 py-2.5 bg-coffee-900 text-white rounded-xl">
                            <MapPin size={16} className="shrink-0" />
                            <span className="text-sm font-semibold break-words">Antar ke: {order.table_location}</span>
                          </div>
              )}
                            <div className="space-y-1.5 mb-4">
                              {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm text-coffee-600">
                    <span className="min-w-0 break-words">{item.product?.name} x{item.quantity}</span>
                    <span className="shrink-0">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-coffee-100 pt-4 mb-4">
                <div className="flex justify-between items-center gap-3 font-semibold">
                  <span>Total</span>
                  <span className="shrink-0">{formatPrice(order.total)}</span>
                </div>
                {order.payment_method === 'qris' && order.qris_amount && (
                  <p className="text-sm text-coffee-700 mt-1.5 break-words">
                    QRIS: <strong>{formatPrice(order.qris_amount)}</strong> · Kode {String(order.qris_code).padStart(2, '0')}
                    {order.has_payment_proof ? ' · Bukti terkirim' : ' · Belum ada bukti'}
                  </p>
                )}
              </div>
              {(order.status === 'awaiting_payment' || order.payment_status === 'paid') && (
                <div className="flex flex-wrap gap-2.5 items-center">
                  {order.status === 'awaiting_payment' && (
                    <Link to={`/pembayaran/${order.id}`} className="btn-primary text-sm text-center">Periksa Pembayaran &amp; Bukti</Link>
                  )}
                  {order.payment_status === 'paid' && (
                    <DownloadReceiptButton orderId={order.id} orderNumber={order.order_number} />
                  )}
                </div>
              )}
            </div>
                              ))}
                            </div>
      )}
                          </DashboardLayout>
                          );
}

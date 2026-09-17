import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import { PAYMENT_LABELS } from '../../lib/paymentMethods';
import { getOrderCustomerLabel, isWalkInOrder } from '../../lib/orderHelpers';
import DashboardLayout from '../../components/DashboardLayout';
import DownloadReceiptButton from '../../components/DownloadReceiptButton';

const statuses = ['awaiting_payment', 'pending', 'preparing', 'completed', 'cancelled'];
const statusLabels = { awaiting_payment: 'Belum Bayar', pending: 'Pending', preparing: 'Disiapkan', completed: 'Selesai', cancelled: 'Batal' };
const getStatusLabel = (order) => {
  if (order.status === 'awaiting_payment' && order.payment_method === 'cash') return 'Tunai - Menunggu';
  return statusLabels[order.status];
};
const statusColors = {
  awaiting_payment: 'bg-orange-100 text-orange-800',
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function CashierOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    api.get(`/orders?status=${filter}`)
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const updateStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    fetchOrders();
  };

  return (
    <DashboardLayout title="Kelola Pesanan" role="cashier">
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === s ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700 hover:bg-coffee-100'
            }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-coffee-500 py-20">Tidak ada pesanan.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold text-coffee-900">{order.order_number}</p>
                  <p className="text-sm text-coffee-500">
                    {getOrderCustomerLabel(order)}
                    {isWalkInOrder(order) && (
                      <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">Walk-in</span>
                    )}
                    {order.guest_phone && <span className="text-coffee-400"> · {order.guest_phone}</span>}
                    {' · '}{new Date(order.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.payment_method === 'cash' && order.status === 'awaiting_payment'
                    ? 'bg-amber-100 text-amber-800'
                    : statusColors[order.status]
                }`}>
                  {getStatusLabel(order)}
                </span>
              </div>
              {order.table_location && (
                <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-coffee-900 text-white rounded-xl">
                  <MapPin size={16} className="shrink-0" />
                  <span className="text-sm font-semibold">Antar ke: {order.table_location}</span>
                </div>
              )}
              <div className="space-y-1 mb-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-coffee-600">
                    <span>{item.product?.name} x{item.quantity}</span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-coffee-100 pt-4">
                <div>
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                  {order.payment_method && <p className="text-xs text-coffee-500 mt-1">{PAYMENT_LABELS[order.payment_method]}</p>}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {order.payment_status === 'paid' && (
                    <DownloadReceiptButton orderId={order.id} orderNumber={order.order_number} className="!py-1.5 !px-3 !text-xs" />
                  )}
                  {order.status === 'awaiting_payment' && (
                    <Link to={`/pembayaran/${order.id}`} className="px-4 py-2 bg-orange-600 text-white text-sm rounded-full hover:bg-orange-700">
                      Terima Bayar
                    </Link>
                  )}
                  {order.status === 'pending' && (
                    <button onClick={() => updateStatus(order.id, 'preparing')} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700">
                      Mulai Siapkan
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => updateStatus(order.id, 'completed')} className="px-4 py-2 bg-green-600 text-white text-sm rounded-full hover:bg-green-700">
                      Selesai
                    </button>
                  )}
                  {['pending', 'preparing'].includes(order.status) && (
                    <button onClick={() => updateStatus(order.id, 'cancelled')} className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-full hover:bg-red-200">
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

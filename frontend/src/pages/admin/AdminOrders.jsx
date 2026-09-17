import { useEffect, useState } from 'react';
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
            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold text-coffee-900">{order.order_number}</p>
                  <p className="text-sm text-coffee-500">
                    {getOrderCustomerLabel(order)}
                    {isWalkInOrder(order) ? (
                      <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">Walk-in</span>
                    ) : (
                      <span className="text-coffee-400"> ({order.user?.email})</span>
                    )}
                    {order.guest_phone && <span className="text-coffee-400"> · {order.guest_phone}</span>}
                  </p>
                  <p className="text-xs text-coffee-400">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[order.status]}`}
                >
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
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
              <div className="flex justify-between font-semibold border-t border-coffee-100 pt-4 mb-4">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {order.payment_status === 'paid' && (
                <DownloadReceiptButton orderId={order.id} orderNumber={order.order_number} />
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

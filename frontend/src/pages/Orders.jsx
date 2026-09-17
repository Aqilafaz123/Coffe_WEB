import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { PAYMENT_LABELS } from '../lib/paymentMethods';
import api, { formatPrice } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const statusConfig = {
  awaiting_payment: { label: 'Belum Bayar', color: 'bg-orange-100 text-orange-800', icon: CreditCard },
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  preparing: { label: 'Disiapkan', color: 'bg-blue-100 text-blue-800', icon: Package },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-coffee-900 mb-8">Pesanan Saya</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-coffee-300 mb-4" />
              <p className="text-coffee-500 mb-6">Belum ada pesanan</p>
              <Link to="/shop" className="btn-primary">Mulai Belanja</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status];
                const StatusIcon = status.icon;
                return (
                  <div key={order.id} className="bg-white rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-coffee-900">{order.order_number}</p>
                        <p className="text-coffee-500 text-sm">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-coffee-600">
                          <span>{item.product?.name} x{item.quantity}</span>
                          <span>{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-semibold border-t border-coffee-100 pt-4 mb-4">
                      <span>Total</span>
                      <span className="text-coffee-900">{formatPrice(order.total)}</span>
                    </div>
                    {order.payment_method && (
                      <p className="text-coffee-500 text-sm mb-3">Bayar via {PAYMENT_LABELS[order.payment_method] || order.payment_method}</p>
                    )}
                    {order.status === 'awaiting_payment' && (
                      <Link to={`/pembayaran/${order.id}`} className="btn-primary inline-block text-sm">Bayar Sekarang</Link>
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

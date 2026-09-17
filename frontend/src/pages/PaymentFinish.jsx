import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DownloadReceiptButton from '../components/DownloadReceiptButton';

export default function PaymentFinish() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);

  const donePath = user?.role === 'cashier' ? '/kasir/orders' : user?.role === 'superadmin' ? '/admin/orders' : '/riwayat';

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await api.post(`/orders/${orderId}/verify-payment`);
        setOrder(data);
        setStatus(data.payment_status === 'paid' ? 'success' : 'pending');
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-lg mx-auto px-4 text-center">
          {status === 'loading' && (
            <div className="py-16 bg-white rounded-2xl">
              <Loader2 size={48} className="mx-auto text-coffee-500 animate-spin mb-4" />
              <p className="text-coffee-600">Memverifikasi pembayaran...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="py-16 bg-white rounded-2xl">
              <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
              <h1 className="font-display text-2xl font-bold text-coffee-900 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-coffee-500 mb-2">No. Pesanan: {order?.order_number}</p>
              <p className="text-coffee-500 mb-6">Pesanan Anda sedang diproses.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                {order && (
                  <DownloadReceiptButton orderId={order.id} orderNumber={order.order_number} />
                )}
                <button onClick={() => navigate(donePath)} className="btn-primary">Lihat Pesanan</button>
              </div>
            </div>
          )}
          {status === 'pending' && (
            <div className="py-16 bg-white rounded-2xl">
              <Loader2 size={48} className="mx-auto text-amber-500 mb-4" />
              <h1 className="font-display text-2xl font-bold text-coffee-900 mb-2">Menunggu Pembayaran</h1>
              <p className="text-coffee-500 mb-6">Pembayaran Anda sedang diproses. Silakan cek kembali nanti.</p>
              <button onClick={() => navigate(donePath)} className="btn-primary">Lihat Pesanan</button>
            </div>
          )}
          {status === 'error' && (
            <div className="py-16 bg-white rounded-2xl">
              <XCircle size={56} className="mx-auto text-red-500 mb-4" />
              <h1 className="font-display text-2xl font-bold text-coffee-900 mb-2">Verifikasi Gagal</h1>
              <p className="text-coffee-500 mb-6">Tidak dapat memverifikasi pembayaran. Hubungi kasir jika sudah membayar.</p>
              <button onClick={() => navigate(`/pembayaran/${orderId}`)} className="btn-primary">Kembali ke Pembayaran</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

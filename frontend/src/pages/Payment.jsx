import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreditCard, CheckCircle, Loader2, Tag, Wallet, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { formatPrice } from '../lib/api';
import { loadMidtransSnap } from '../lib/midtrans';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DownloadReceiptButton from '../components/DownloadReceiptButton';

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cashPending, setCashPending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [snapReady, setSnapReady] = useState(false);

  const isStaff = user?.role === 'cashier' || user?.role === 'superadmin';
  const donePath = user?.role === 'cashier' ? '/kasir/orders' : user?.role === 'superadmin' ? '/admin/orders' : '/riwayat';

  useEffect(() => {
    api.get(`/orders/${orderId}`)
      .then((r) => {
        setOrder(r.data);
        const staff = user?.role === 'cashier' || user?.role === 'superadmin';
        if (r.data.status !== 'awaiting_payment') {
          setPaid(true);
        } else if (!staff && r.data.payment_method === 'cash' && r.data.payment_status === 'unpaid') {
          setCashPending(true);
        }
      })
      .catch(() => setError('Pesanan tidak ditemukan.'))
      .finally(() => setLoading(false));
  }, [orderId, user?.role]);

  useEffect(() => {
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
    loadMidtransSnap(isProduction)
      .then(() => setSnapReady(true))
      .catch(() => setError('Gagal memuat gateway pembayaran.'));
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherMsg('');
    setError('');
    try {
      const { data } = await api.post(`/orders/${orderId}/voucher`, { code: voucherCode.trim() });
      setOrder(data);
      setVoucherMsg('Voucher berhasil dipakai!');
      setVoucherCode('');
    } catch (err) {
      setVoucherMsg(err.response?.data?.message || 'Voucher tidak valid.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = async () => {
    setVoucherLoading(true);
    setVoucherMsg('');
    try {
      const { data } = await api.delete(`/orders/${orderId}/voucher`);
      setOrder(data);
      setVoucherMsg('Voucher dihapus.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus voucher.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const verifyAndComplete = async () => {
    const { data } = await api.post(`/orders/${orderId}/verify-payment`);
    if (data.payment_status === 'paid') {
      setPaid(true);
      setOrder(data);
      return true;
    }
    return false;
  };

  const handleMidtransPay = async () => {
    if (!snapReady) return;
    setProcessing(true);
    setError('');
    try {
      const { data } = await api.post(`/orders/${orderId}/snap-token`);
      window.snap.pay(data.snap_token, {
        onSuccess: async () => {
          try {
            const success = await verifyAndComplete();
            if (!success) {
              navigate(`/pembayaran/${orderId}/selesai`);
            }
          } catch {
            navigate(`/pembayaran/${orderId}/selesai`);
          } finally {
            setProcessing(false);
          }
        },
        onPending: () => {
          setProcessing(false);
          navigate(`/pembayaran/${orderId}/selesai`);
        },
        onError: () => {
          setError('Pembayaran gagal. Silakan coba lagi.');
          setProcessing(false);
        },
        onClose: () => {
          setProcessing(false);
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memulai pembayaran.');
      setProcessing(false);
    }
  };

  const handleCashPay = async () => {
    const msg = isStaff
      ? 'Konfirmasi pelanggan sudah membayar tunai?'
      : 'Pilih bayar tunai di kasir? Setelah ini, datang ke kasir untuk menyelesaikan pembayaran.';
    if (!confirm(msg)) return;
    setProcessing(true);
    setError('');
    try {
      const { data } = await api.post(`/orders/${orderId}/pay`, { payment_method: 'cash' });
      if (isStaff) {
        setOrder(data);
        setPaid(true);
      } else {
        setOrder(data.order || data);
        setCashPending(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Pembayaran gagal.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Batalkan pesanan ini?')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      navigate(donePath);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membatalkan.');
    }
  };

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-coffee-900 mb-2">Pembayaran</h1>
          <p className="text-coffee-500 mb-8">Selesaikan pembayaran pesanan Anda</p>

          {error && !order && <p className="text-red-600 mb-4">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : cashPending && order ? (
            <div className="text-center py-16 bg-white rounded-2xl max-w-lg mx-auto">
              <Wallet size={56} className="mx-auto text-amber-600 mb-4" />
              <h2 className="font-display text-2xl font-bold text-coffee-900 mb-2">Bayar di Kasir</h2>
              <p className="text-coffee-600 mb-2">Tunjukkan nomor pesanan ini ke kasir:</p>
              <p className="font-display text-3xl font-bold text-coffee-900 mb-4">{order.order_number}</p>
              <p className="text-coffee-500 text-sm mb-2">Total: <strong>{formatPrice(order.total)}</strong></p>
              {order.table_location && (
                <p className="text-coffee-500 text-sm mb-6">Lokasi: {order.table_location}</p>
              )}
              <p className="text-coffee-500 text-sm mb-6">Pesanan akan diproses setelah kasir menerima pembayaran tunai Anda.</p>
              <button onClick={() => navigate(donePath)} className="btn-primary">Lihat Riwayat</button>
            </div>
          ) : paid ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
              <h2 className="font-display text-2xl font-bold text-coffee-900 mb-2">Pembayaran Berhasil!</h2>
              <p className="text-coffee-500 mb-6">Pesanan Anda sedang diproses.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                {order && (
                  <DownloadReceiptButton orderId={order.id} orderNumber={order.order_number} />
                )}
                <button onClick={() => navigate(donePath)} className="btn-primary">Lihat Pesanan</button>
              </div>
            </div>
          ) : order && (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 h-fit">
                <p className="text-sm text-coffee-500 mb-1">No. Pesanan</p>
                <p className="font-semibold text-coffee-900 mb-2">{order.order_number}</p>
                {order.table_location && (
                  <p className="flex items-center gap-2 text-sm text-coffee-700 mb-4 px-3 py-2 bg-coffee-50 rounded-lg">
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
                <div className="flex justify-between text-sm text-coffee-600 mb-2">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-2">
                    <span>Diskon ({order.voucher_code})</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-coffee-100 pt-4">
                  <span>Total</span>
                  <span className="text-coffee-900">{formatPrice(order.total)}</span>
                </div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-semibold text-coffee-900 mb-4 flex items-center gap-2">
                    <Tag size={18} /> Voucher Diskon
                  </h3>
                  {order.voucher_code ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl mb-2">
                      <div>
                        <p className="font-medium text-green-800 text-sm">{order.voucher_code}</p>
                        <p className="text-green-600 text-xs">Hemat {formatPrice(order.discount)}</p>
                      </div>
                      <button type="button" onClick={handleRemoveVoucher} disabled={voucherLoading} className="text-green-700 text-sm hover:underline disabled:opacity-50">
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Masukkan kode voucher"
                        className="input-field text-sm flex-1 uppercase"
                      />
                      <button type="button" onClick={handleApplyVoucher} disabled={voucherLoading || !voucherCode.trim()} className="px-4 py-2 bg-coffee-900 text-white text-sm rounded-xl hover:bg-coffee-800 disabled:opacity-50 whitespace-nowrap">
                        {voucherLoading ? '...' : 'Pakai'}
                      </button>
                    </div>
                  )}
                  {voucherMsg && <p className={`text-sm mt-2 ${voucherMsg.includes('berhasil') || voucherMsg.includes('dihapus') ? 'text-green-600' : 'text-red-600'}`}>{voucherMsg}</p>}
                  <p className="text-xs text-coffee-400 mt-2">Coba: COFFEE15, HEMAT10K, WELCOME20</p>
                </div>
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-semibold text-coffee-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} /> Pembayaran Online
                  </h3>
                  <p className="text-sm text-coffee-500 mb-4">
                    Bayar via Midtrans — mendukung QRIS, GoPay, ShopeePay, transfer bank, kartu kredit, dan lainnya.
                  </p>
                  {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                  <button
                    onClick={handleMidtransPay}
                    disabled={processing || !snapReady}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <><Loader2 size={18} className="animate-spin" /> Membuka pembayaran...</>
                    ) : (
                      <>Bayar {formatPrice(order.total)}</>
                    )}
                  </button>
                  <button
                    onClick={handleCashPay}
                    disabled={processing}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 border-2 border-coffee-200 rounded-xl text-coffee-700 hover:border-coffee-400 hover:bg-coffee-50 disabled:opacity-50"
                  >
                    <Wallet size={18} />
                    {isStaff ? 'Terima Bayar Tunai' : 'Bayar Tunai di Kasir'}
                  </button>
                  {!isStaff && (
                    <p className="text-xs text-coffee-400 mt-2 text-center">
                      Pilih ini jika ingin membayar langsung ke kasir dengan uang tunai.
                    </p>
                  )}
                  <button onClick={handleCancel} className="w-full mt-3 text-coffee-500 text-sm hover:text-red-600">
                    Batalkan Pesanan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

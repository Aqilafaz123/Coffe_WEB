import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Minus, QrCode, Wallet, ArrowLeft, CheckCircle, ShoppingBag } from 'lucide-react';
import QRCode from 'qrcode';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import DownloadReceiptButton from '../../components/DownloadReceiptButton';
import DownloadCashierTicketButton from '../../components/DownloadCashierTicketButton';

export default function CashierPOS() {
  const [params, setParams] = useSearchParams();
  const orderId = params.get('order');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [name, setName] = useState('');
  const [table, setTable] = useState('');
  const [notes, setNotes] = useState('');
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState('');
  const [cash, setCash] = useState('');
  const [qr, setQr] = useState('');
  const [displayQr, setDisplayQr] = useState(false);

  const loadProducts = () => api.get('/products').then(({ data }) => setProducts(data));
  useEffect(() => {
    let active = true;
    api.get('/products').then(({ data }) => { if (active) setProducts(data); })
      .catch(() => { if (active) setError('Produk gagal dimuat. Muat ulang halaman.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    let active = true;
    setOrderLoading(true);
    api.get(`/orders/${orderId}`).then(({ data }) => {
      if (data.order_source !== 'pos') throw new Error('Pesanan ini bukan transaksi POS.');
      if (active) { setOrder(data); setCash(data.cash_received || ''); }
    }).catch((err) => { if (active) setError(err.response?.data?.message || err.message || 'Pesanan gagal dimuat.'); })
      .finally(() => { if (active) setOrderLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  useEffect(() => {
    if (!displayQr) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event) => { if (event.key === 'Escape') setDisplayQr(false); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', close); };
  }, [displayQr]);

  const changeQuantity = (product, delta) => {
    setCart((items) => {
      const quantity = (items.find((item) => item.product.id === product.id)?.quantity || 0) + delta;
      if (quantity > product.stock) return items;
      if (quantity <= 0) return items.filter((item) => item.product.id !== product.id);
      if (items.some((item) => item.product.id === product.id)) return items.map((item) => item.product.id === product.id ? { ...item, quantity } : item);
      return [...items, { product, quantity }];
    });
  };
  const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const categories = [...new Map(products.filter((p) => p.category).map((p) => [p.category.id, p.category])).values()];
  const visibleProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) && (category === 'all' || String(p.category_id) === category));

  const createOrder = async () => {
    if (!cart.length || busy) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/orders', {
        order_source: 'pos', guest_name: name.trim() || 'Pelanggan Walk-in',
        table_location: table.trim() || null, notes: notes.trim() || null,
        items: cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
      });
      setOrder(data); setCart([]); setParams({ order: String(data.id) }, { replace: true });
    } catch (err) { setError(err.response?.data?.message || 'Pesanan gagal dibuat.'); }
    finally { setBusy(false); }
  };

  const showQris = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post(`/orders/${order.id}/qris`);
      const image = await QRCode.toDataURL(data.payload, { width: 720, margin: 4, errorCorrectionLevel: 'M' });
      setOrder((previous) => ({ ...previous, ...data.order })); setQr(image); setDisplayQr(true);
    } catch (err) { setError(err.response?.data?.message || 'QRIS gagal dibuat.'); }
    finally { setBusy(false); }
  };

  const pay = async (method) => {
    if (busy) return;
    if (!confirm(method === 'qris' ? `Pastikan dana QRIS ${formatPrice(order.qris_amount)} sudah masuk ke akun merchant. Konfirmasi lunas?` : `Terima tunai ${formatPrice(cash)} dan kembalikan ${formatPrice(Number(cash) - Number(order.total))}?`)) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.post(`/orders/${order.id}/pay`, { payment_method: method, ...(method === 'cash' ? { cash_received: Number(cash) } : {}) });
      setOrder(data); setDisplayQr(false); setQr('');
    } catch (err) { setError(err.response?.data?.message || 'Pembayaran gagal.'); }
    finally { setBusy(false); }
  };

  const newTransaction = () => {
    setOrder(null); setParams({}, { replace: true }); setCart([]); setName(''); setTable(''); setNotes(''); setCash(''); setQr(''); setError('');
    loadProducts().catch(() => setError('Produk gagal diperbarui. Muat ulang halaman.'));
  };
  const cancelOrder = async () => {
    if (!confirm('Batalkan transaksi dan kembalikan stok produk?')) return;
    setBusy(true); setError('');
    try { await api.post(`/orders/${order.id}/cancel`); newTransaction(); }
    catch (err) { setError(err.response?.data?.message || 'Transaksi gagal dibatalkan.'); }
    finally { setBusy(false); }
  };

  return (
    <DashboardLayout title="Transaksi Offline / POS" role="cashier">
      {error && <p role="alert" className="mb-4 p-4 rounded-xl bg-red-50 text-red-700">{error}</p>}
      {loading || orderLoading ? <p className="py-16 text-center text-coffee-500">Memuat transaksi...</p> : order ? (
        order.payment_status === 'paid' ? (
          <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 text-center">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-coffee-900 mb-2">Pembayaran Berhasil</h2>
            <p className="text-coffee-600">{order.order_number} · {order.payment_method === 'qris' ? 'QRIS' : 'Tunai'}</p>
            <p className="text-3xl font-bold text-coffee-900 my-4">{formatPrice(order.payment_method === 'qris' ? order.qris_amount : order.total)}</p>
            {order.payment_method === 'cash' && <p className="mb-5 text-coffee-600">Uang diterima: {formatPrice(order.cash_received)} · Kembalian: <strong>{formatPrice(Number(order.cash_received) - Number(order.total))}</strong></p>}
            <div className="flex flex-wrap justify-center gap-3 mb-6"><DownloadReceiptButton orderId={order.id} orderNumber={order.order_number} /><DownloadCashierTicketButton orderId={order.id} orderNumber={order.order_number} /></div>
            <button onClick={newTransaction} className="btn-primary w-full">Transaksi Baru</button>
          </div>
        ) : order.status !== 'awaiting_payment' ? (
          <div className="bg-white p-8 rounded-2xl"><p className="mb-4">Transaksi ini sudah ditutup.</p><button onClick={newTransaction} className="btn-primary">Transaksi Baru</button></div>
        ) : (
          <div className="grid xl:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl p-6">
              <p className="text-sm text-coffee-500">{order.order_number} · {order.customer_name || name || 'Walk-in'}</p>
              <h2 className="text-xl font-bold text-coffee-900 my-4">Ringkasan Pesanan</h2>
              {order.items?.map((item) => <div key={item.id} className="flex justify-between gap-3 py-3 border-b border-coffee-100"><span>{item.product?.name} × {item.quantity}</span><strong>{formatPrice(item.subtotal)}</strong></div>)}
              <div className="flex justify-between text-xl font-bold text-coffee-900 mt-5"><span>Total Belanja</span><span>{formatPrice(order.total)}</span></div>
              {order.qris_amount && <p className="mt-3 text-blue-800">Total QRIS: <strong>{formatPrice(order.qris_amount)}</strong> (kode unik {String(order.qris_code).padStart(2, '0')})</p>}
              <button onClick={cancelOrder} disabled={busy} className="text-red-600 mt-6 text-sm disabled:opacity-50">Batalkan Transaksi</button>
            </section>
            <section className="bg-white rounded-2xl p-6 space-y-5">
              <h2 className="text-xl font-bold text-coffee-900">Pembayaran</h2>
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <h3 className="flex gap-2 items-center font-bold text-amber-900 mb-3"><Wallet size={20} /> Tunai</h3>
                <label htmlFor="pos-cash" className="block text-sm text-coffee-700 mb-2">Uang diterima</label>
                <input id="pos-cash" type="number" min="0" step="1" inputMode="numeric" value={cash} onChange={(e) => setCash(e.target.value)} className="input-field bg-white" placeholder="Masukkan uang pelanggan" />
                <div className="flex flex-wrap gap-2 mt-3">{[Number(order.total), ...[20000, 50000, 100000].filter((v) => v > Number(order.total))].map((amount) => <button key={amount} onClick={() => setCash(String(amount))} className="px-3 py-2 bg-white rounded-lg text-sm border border-amber-200">{formatPrice(amount)}</button>)}</div>
                <p className="my-4 text-coffee-800">Kembalian: <strong>{formatPrice(Math.max(0, Number(cash) - Number(order.total)))}</strong></p>
                <button onClick={() => pay('cash')} disabled={busy || cash === '' || Number(cash) < Number(order.total)} className="btn-primary w-full disabled:opacity-50">Terima Pembayaran Tunai</button>
              </div>
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                <h3 className="flex gap-2 items-center font-bold text-blue-900 mb-2"><QrCode size={20} /> QRIS</h3>
                <p className="text-sm text-blue-800 mb-4">Tampilkan QRIS di tablet kasir untuk dipindai pelanggan. Kembali ke layar ini untuk memeriksa dana masuk.</p>
                <button onClick={showQris} disabled={busy} className="w-full py-4 rounded-xl bg-blue-700 text-white font-semibold disabled:opacity-50">{busy ? 'Memproses...' : 'Tampilkan QRIS ke Pelanggan'}</button>
                {order.qris_amount && <button onClick={() => pay('qris')} disabled={busy} className="w-full mt-3 py-3 rounded-xl border border-blue-300 text-blue-900 font-semibold disabled:opacity-50">Konfirmasi Dana {formatPrice(order.qris_amount)} Diterima</button>}
              </div>
              <Link to="/kasir/orders" className="block text-sm text-coffee-500 hover:underline">Simpan pesanan menunggu dan kembali ke daftar</Link>
            </section>
          </div>
        )
      ) : orderId ? <Link to="/kasir/pos" className="btn-primary">Kembali ke POS</Link> : (
        <div className="grid xl:grid-cols-5 gap-6">
          <section className="xl:col-span-3">
            <div className="relative mb-4"><Search size={20} className="absolute left-3 top-3.5 text-coffee-400" /><input aria-label="Cari produk" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11 bg-white" placeholder="Cari produk..." /></div>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3"><button onClick={() => setCategory('all')} className={`px-4 py-2 rounded-full whitespace-nowrap ${category === 'all' ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700'}`}>Semua</button>{categories.map((c) => <button key={c.id} onClick={() => setCategory(String(c.id))} className={`px-4 py-2 rounded-full whitespace-nowrap ${category === String(c.id) ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700'}`}>{c.name}</button>)}</div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{visibleProducts.map((product) => <button key={product.id} onClick={() => changeQuantity(product, 1)} disabled={product.stock <= 0} className="text-left bg-white rounded-2xl overflow-hidden border border-coffee-100 hover:border-coffee-400 disabled:opacity-40 transition-colors">{product.image && <img src={product.image} alt="" className="h-28 w-full object-cover" />}<div className="p-4"><p className="font-semibold text-coffee-900">{product.name}</p><p className="text-coffee-600 text-sm mt-1">{formatPrice(product.price)}</p><p className="text-xs text-coffee-400 mt-2">Stok {product.stock}</p></div></button>)}</div>
            {!visibleProducts.length && <p className="text-center py-12 text-coffee-500">Produk tidak ditemukan.</p>}
          </section>
          <section className="xl:col-span-2 bg-white rounded-2xl p-5 h-fit xl:sticky xl:top-28">
            <h2 className="flex gap-2 items-center font-bold text-lg text-coffee-900 mb-4"><ShoppingBag size={20} /> Keranjang POS</h2>
            <input aria-label="Nama pelanggan" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} className="input-field mb-3" placeholder="Nama pelanggan (opsional)" />
            <input aria-label="Nomor meja" value={table} onChange={(e) => setTable(e.target.value)} maxLength={100} className="input-field mb-4" placeholder="Meja / lokasi (opsional)" />
            {!cart.length && <p className="py-8 text-center text-coffee-400">Ketuk produk untuk menambahkan.</p>}
            {cart.map(({ product, quantity }) => <div key={product.id} className="py-3 border-b border-coffee-100"><p className="font-medium text-coffee-900 mb-2">{product.name}</p><div className="flex items-center justify-between gap-2"><span className="text-sm text-coffee-600">{formatPrice(Number(product.price) * quantity)}</span><div className="flex items-center gap-3"><button aria-label={`Kurangi ${product.name}`} onClick={() => changeQuantity(product, -1)} className="p-3 bg-coffee-50 rounded-lg"><Minus size={16} /></button><span>{quantity}</span><button aria-label={`Tambah ${product.name}`} disabled={quantity >= product.stock} onClick={() => changeQuantity(product, 1)} className="p-3 bg-coffee-50 rounded-lg disabled:opacity-30"><Plus size={16} /></button></div></div></div>)}
            <textarea aria-label="Catatan pesanan" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field mt-4" placeholder="Catatan pesanan (opsional)" rows={2} />
            <div className="flex justify-between text-lg font-bold text-coffee-900 my-5"><span>Total</span><span>{formatPrice(total)}</span></div>
            <button onClick={createOrder} disabled={busy || !cart.length} className="btn-primary w-full py-4 disabled:opacity-50">{busy ? 'Membuat Pesanan...' : 'Lanjut Pembayaran'}</button>
          </section>
        </div>
      )}
      {displayQr && qr && order && (
        <div role="dialog" aria-modal="true" aria-label="QRIS untuk pelanggan" className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-8">
          <button autoFocus onClick={() => setDisplayQr(false)} className="absolute top-4 left-4 flex items-center gap-2 text-sm text-coffee-500 p-3 rounded-xl hover:bg-coffee-50"><ArrowLeft size={18} /> Kembali ke Kasir</button>
          <p className="text-coffee-900 font-bold text-xl mt-14">Rahardja Tea, Coffee and</p>
          <p className="text-coffee-500 text-sm mt-1">{order.order_number}</p>
          <img src={qr} alt={`QRIS ${formatPrice(order.qris_amount)}`} className="w-full max-w-lg object-contain" style={{ maxHeight: '60dvh' }} />
          <p className="text-4xl sm:text-5xl font-bold text-coffee-900">{formatPrice(order.qris_amount)}</p>
          <p className="text-coffee-500 text-sm mt-4 text-center">Scan QRIS dengan e-wallet atau mobile banking<br />Bayar persis sesuai nominal di atas</p>
        </div>
      )}
    </DashboardLayout>
  );
}

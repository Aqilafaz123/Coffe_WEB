import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function PaymentProof({ order, onUploaded, readOnly = false }) {
  const [file, setFile] = useState(null);
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    let url;
    if (order.has_payment_proof) {
      api.get(`/orders/${order.id}/payment-proof`, { responseType: 'blob' })
        .then(({ data }) => {
          if (!active) return;
          url = URL.createObjectURL(data);
          setImage(url);
        })
        .catch(() => { if (active) setError('Bukti belum dapat dimuat. Silakan buka ulang halaman.'); });
    }
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [order.id, order.has_payment_proof, version]);

  const upload = async (event) => {
    event.preventDefault();
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Gunakan JPG, PNG, atau WebP maksimal 2 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('proof', file);
      const { data } = await api.post(`/orders/${order.id}/payment-proof`, form, { headers: { 'Content-Type': undefined } });
      onUploaded(data);
      setVersion((v) => v + 1);
      setFile(null);
      event.target.reset();
    } catch (err) {
      setError(err.response?.data?.errors?.proof?.[0] || err.response?.data?.message || 'Bukti gagal diunggah.');
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-4 border border-coffee-200 rounded-xl p-4 text-left">
      <h4 className="font-semibold text-coffee-900 mb-2">Bukti Pembayaran QRIS</h4>
      {order.has_payment_proof && <p className="text-sm text-green-700 mb-2">{order.payment_status === 'paid' ? 'Pembayaran sudah dikonfirmasi.' : 'Bukti terkirim — menunggu verifikasi kasir.'}</p>}
      {readOnly && !order.has_payment_proof && <p className="text-sm text-coffee-500">Pelanggan belum mengunggah bukti bayar.</p>}
      {order.has_payment_proof && !image && !error && <p className="text-sm text-coffee-500" role="status">Memuat bukti bayar...</p>}
      {image && <a href={image} target="_blank" rel="noreferrer"><img src={image} alt="Bukti pembayaran QRIS" className="max-h-80 max-w-full rounded-lg mx-auto mb-3" /></a>}
      {!readOnly && <form onSubmit={upload}>
        <label className="block text-sm text-coffee-600 mb-2" htmlFor="payment-proof">Upload foto atau screenshot bukti bayar (JPG, PNG, WebP; maks. 2 MB)</label>
        <input id="payment-proof" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm mb-3" />
        <button disabled={busy || !file} className="btn-primary w-full disabled:opacity-50">{busy ? 'Mengunggah...' : order.has_payment_proof ? 'Ganti Bukti Bayar' : 'Kirim Bukti Bayar'}</button>
      </form>}
      {error && <p className="text-red-600 text-sm mt-2" role="alert">{error}</p>}
    </div>
  );
}

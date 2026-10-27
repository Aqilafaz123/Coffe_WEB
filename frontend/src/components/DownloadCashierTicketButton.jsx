import { useState } from 'react';
import { ScrollText, Loader2 } from 'lucide-react';
import { downloadCashierReceipt } from '../lib/api';

export default function DownloadCashierTicketButton({ orderId, orderNumber, className = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      await downloadCashierReceipt(orderId, orderNumber);
    } catch (err) {
      let msg = err.message;
      if (!msg && err.response?.data instanceof Blob) {
        try {
          const json = JSON.parse(await err.response.data.text());
          msg = json.message;
        } catch { /* ignore */ }
      }
      setError(msg || err.response?.data?.message || 'Gagal mengunduh tiket kasir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        title="Cetak Tiket Dapur &amp; Slip Inventory Bahan Baku"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold rounded-full hover:bg-amber-100 disabled:opacity-50 transition-colors shadow-sm ${className}`}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <ScrollText size={13} className="text-amber-700" />}
        {loading ? 'Mengunduh...' : 'Tiket Dapur & Inventory'}
      </button>
      {error && <p className="text-red-600 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

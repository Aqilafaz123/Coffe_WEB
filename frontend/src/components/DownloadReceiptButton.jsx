import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadOrderReceipt } from '../lib/api';

export default function DownloadReceiptButton({ orderId, orderNumber, className = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      await downloadOrderReceipt(orderId, orderNumber);
    } catch (err) {
      let msg = err.message;
      if (!msg && err.response?.data instanceof Blob) {
        try {
          const json = JSON.parse(await err.response.data.text());
          msg = json.message;
        } catch { /* ignore */ }
      }
      setError(msg || err.response?.data?.message || 'Gagal mengunduh struk.');
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
        className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-coffee-200 text-coffee-800 text-sm rounded-full hover:border-coffee-400 hover:bg-coffee-50 disabled:opacity-50 transition-colors ${className}`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {loading ? 'Mengunduh...' : 'Download Struk'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

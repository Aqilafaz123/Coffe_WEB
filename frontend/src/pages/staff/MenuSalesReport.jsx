import { useEffect, useState } from 'react';
import { Printer, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function Tally({ count }) {
  // Keep large date ranges readable without rendering thousands of marks.
  const shown = Math.min(count, 50);
  return <span className="inline-flex flex-wrap items-center gap-2" aria-label={`${count} terjual`}>
    {Array.from({ length: Math.floor(shown / 5) }, (_, index) => <span key={index} className="relative font-mono tracking-widest text-coffee-700"><span aria-hidden="true">||||</span><span aria-hidden="true" className="absolute left-0 right-0 top-1/2 border-t border-current -rotate-45" /></span>)}
    {shown % 5 > 0 && <span aria-hidden="true" className="font-mono tracking-widest">{'|'.repeat(shown % 5)}</span>}
    {count === 0 && <span aria-hidden="true" className="text-coffee-400">—</span>}
    {count > shown && <span className="text-xs">+{count - shown} lainnya</span>}
  </span>;
}

export default function MenuSalesReport() {
  const { user } = useAuth();
  const [dates, setDates] = useState(() => ({ start_date: today(), end_date: today() }));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReport(params, signal) {
    if (!signal) {
      setLoading(true);
      setError('');
      setReport(null);
    }
    try {
      const { data } = await api.get('/reports/menu-sales', { params, signal });
      if (!signal?.aborted) setReport(data);
    } catch (err) {
      if (signal?.aborted) return;
      setError(Object.values(err.response?.data?.errors || {}).flat().join(' ') || 'Gagal memuat laporan. Silakan coba lagi.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const date = today();
    api.get('/reports/menu-sales', { params: { start_date: date, end_date: date }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setReport(data); })
      .catch(() => { if (!controller.signal.aborted) setError('Gagal memuat laporan. Silakan coba lagi.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return <DashboardLayout title="Laporan Penjualan Menu" role={user?.role === 'superadmin' ? 'superadmin' : 'cashier'}>
    <div className="space-y-5">
      <form onSubmit={(event) => { event.preventDefault(); loadReport(dates); }} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-wrap items-end gap-4 print:hidden">
        <label className="flex-1 min-w-40 text-sm text-coffee-700">Tanggal mulai
          <input type="date" required className="input-field mt-2" value={dates.start_date} onChange={(event) => setDates({ ...dates, start_date: event.target.value })} />
        </label>
        <label className="flex-1 min-w-40 text-sm text-coffee-700">Tanggal akhir
          <input type="date" required min={dates.start_date} className="input-field mt-2" value={dates.end_date} onChange={(event) => setDates({ ...dates, end_date: event.target.value })} />
        </label>
        <button disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50"><RefreshCw size={16} />{loading ? 'Memuat...' : 'Tampilkan'}</button>
        <button type="button" disabled={loading || !report} onClick={() => window.print()} className="btn-secondary flex items-center gap-2 disabled:opacity-50"><Printer size={16} />Cetak / PDF</button>
      </form>
      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-xl p-4">{error}</p>}
      {loading && <p role="status" className="text-coffee-500">Memuat laporan...</p>}
      {report && <section className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm print:shadow-none print:p-0">
        <h2 className="font-display text-xl font-bold text-coffee-900">Laporan Penjualan Menu</h2>
        <p className="mt-1 text-sm text-coffee-600">Periode: {report.start_date.split('-').reverse().join('/')} – {report.end_date.split('-').reverse().join('/')}</p>
        <p className="mt-2 mb-5 text-xs text-coffee-500">Pesanan dibayar atau selesai dari semua kanal. Pesanan dibatalkan tidak dihitung. Tanggal mengikuti pembayaran, lalu penyelesaian, lalu pembuatan pesanan.</p>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-sm text-coffee-900">
            <thead className="bg-coffee-100"><tr>{['No', 'Menu', 'Ceklis Terjual', 'Total Terjual'].map((heading) => <th key={heading} scope="col" className="border border-coffee-300 p-3 text-left">{heading}</th>)}</tr></thead>
            <tbody>{report.rows.map((row, index) => <tr key={row.id} className="break-inside-avoid">
              <td className="border border-coffee-300 p-3 w-12">{index + 1}</td>
              <td className="border border-coffee-300 p-3 font-medium">{row.name}</td>
              <td className="border border-coffee-300 p-3"><Tally count={row.total_sold} /></td>
              <td className="border border-coffee-300 p-3 text-right font-semibold tabular-nums">{row.total_sold.toLocaleString('id-ID')}</td>
            </tr>)}</tbody>
            <tfoot><tr className="bg-coffee-50 font-bold"><td colSpan={3} className="border border-coffee-300 p-3">Total</td><td className="border border-coffee-300 p-3 text-right">{report.total_sold.toLocaleString('id-ID')}</td></tr></tfoot>
          </table>
        </div>
        {report.rows.length === 0 && <p className="mt-4 text-sm text-coffee-500">Belum ada menu yang terdaftar.</p>}
        <p className="mt-3 text-xs text-coffee-500">Satu garis = satu item; satu kelompok garis = lima item. Maksimal 50 garis per menu ditampilkan.</p>
      </section>}
    </div>
  </DashboardLayout>;
}

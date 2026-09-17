import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, XCircle } from 'lucide-react';
import api, { formatPrice } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const statusLabel = {
  pending: { text: 'Menunggu', class: 'bg-amber-100 text-amber-800' },
  confirmed: { text: 'Dikonfirmasi', class: 'bg-green-100 text-green-800' },
  cancelled: { text: 'Dibatalkan', class: 'bg-red-100 text-red-800' },
  completed: { text: 'Selesai', class: 'bg-coffee-100 text-coffee-700' },
};

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get('/reservations')
      .then((r) => setReservations(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Batalkan reservasi ini?')) return;
    await api.post(`/reservations/${id}/cancel`);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-bold text-coffee-900">Reservasi Saya</h1>
            <Link to="/reservasi" className="text-sm text-coffee-700 hover:text-coffee-900 font-medium">
              + Reservasi Baru
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <p className="text-coffee-500 mb-4">Belum ada reservasi.</p>
              <Link to="/reservasi" className="btn-primary inline-block">Reservasi Ruangan</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((r) => {
                const st = statusLabel[r.status] || statusLabel.pending;
                return (
                  <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs text-coffee-400 mb-1">{r.reservation_number}</p>
                        <h3 className="font-semibold text-coffee-900">{r.room?.name}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.class}`}>{st.text}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-coffee-600 mb-4">
                      <span className="flex items-center gap-2"><Calendar size={14} /> {r.reservation_date}</span>
                      <span className="flex items-center gap-2"><Clock size={14} /> {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}</span>
                      <span className="flex items-center gap-2"><Users size={14} /> {r.guests_count} tamu</span>
                      <span className="font-medium text-coffee-900">{formatPrice(r.total_price)}</span>
                    </div>
                    {r.notes && <p className="text-sm text-coffee-500 mb-4">Catatan: {r.notes}</p>}
                    {['pending', 'confirmed'].includes(r.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(r.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                      >
                        <XCircle size={14} /> Batalkan
                      </button>
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

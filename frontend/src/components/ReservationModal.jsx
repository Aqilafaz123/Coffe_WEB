import { useEffect, useState } from 'react';
import { X, Users, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { formatPrice } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TIME_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const hour = 8 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

export default function ReservationModal({ room, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    reservation_date: today,
    start_time: '10:00',
    end_time: '12:00',
    guests_count: 2,
    notes: '',
  });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!room || !form.reservation_date) return;
    api.get(`/rooms/${room.id}/availability`, { params: { date: form.reservation_date } })
      .then((r) => setBookedSlots(r.data.booked_slots || []))
      .catch(() => setBookedSlots([]));
  }, [room, form.reservation_date]);

  const duration = (() => {
    const [sh, sm] = form.start_time.split(':').map(Number);
    const [eh, em] = form.end_time.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return mins > 0 ? Math.round((mins / 60) * 10) / 10 : 0;
  })();

  const totalPrice = duration * Number(room?.price_per_hour || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/reservations', { room_id: room.id, ...form });
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Gagal membuat reservasi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-coffee-100">
          <div>
            <h2 className="font-display text-xl font-bold text-coffee-900">{room.name}</h2>
            <p className="text-sm text-coffee-500">{formatPrice(room.price_per_hour)}/jam · max {room.capacity} orang</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-coffee-400 hover:text-coffee-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-coffee-700 mb-1">
              <Calendar size={16} /> Tanggal
            </label>
            <input
              type="date"
              value={form.reservation_date}
              min={today}
              onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-coffee-700 mb-1">
                <Clock size={16} /> Mulai
              </label>
              <select
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="input-field"
                required
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-coffee-700 mb-1">
                <Clock size={16} /> Selesai
              </label>
              <select
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="input-field"
                required
              >
                {TIME_OPTIONS.filter((t) => t > form.start_time).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-coffee-700 mb-1">
              <Users size={16} /> Jumlah Tamu
            </label>
            <input
              type="number"
              min={1}
              max={room.capacity}
              value={form.guests_count}
              onChange={(e) => setForm({ ...form, guests_count: Number(e.target.value) })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-coffee-700 mb-1 block">Catatan (opsional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="input-field resize-none"
              placeholder="Keperluan khusus, dll."
            />
          </div>

          {bookedSlots.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-medium mb-1">Sudah dipesan:</p>
              {bookedSlots.map((s, i) => (
                <p key={i}>{s.start_time} – {s.end_time}</p>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center p-4 bg-coffee-50 rounded-xl">
            <span className="text-coffee-600 text-sm">{duration} jam</span>
            <span className="font-semibold text-coffee-900">{formatPrice(totalPrice)}</span>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading || duration < 1} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Memproses...' : user ? 'Buat Reservasi' : 'Login untuk Reservasi'}
          </button>
        </form>
      </div>
    </div>
  );
}

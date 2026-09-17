import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

const statuses = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export default function StaffReservations({ role }) {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const params = filter ? { status: filter } : {};
    api.get('/reservations', { params })
      .then((r) => setReservations(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.patch(`/reservations/${id}/status`, { status });
    fetchData();
  };

  return (
    <DashboardLayout title="Kelola Reservasi" role={role}>
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-full text-sm ${!filter ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700'}`}
        >
          Semua
        </button>
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-4 py-2 rounded-full text-sm ${filter === s.value ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      ) : reservations.length === 0 ? (
        <p className="text-center text-coffee-500 py-20">Tidak ada reservasi.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-coffee-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">No.</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Pelanggan</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Ruangan</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Jadwal</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Total</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 text-sm text-coffee-500">{r.reservation_number}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-coffee-900">{r.user?.name}</p>
                    <p className="text-xs text-coffee-500">{r.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-coffee-900">{r.room?.name}</td>
                  <td className="px-6 py-4 text-sm text-coffee-600">
                    {r.reservation_date}<br />
                    {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}<br />
                    {r.guests_count} tamu
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-coffee-900">{formatPrice(r.total_price)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="text-sm border border-coffee-200 rounded-lg px-2 py-1"
                    >
                      {statuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

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
          className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${!filter ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700'}`}
        >
          Semua
        </button>
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${filter === s.value ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700'}`}
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
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="md:hidden divide-y divide-coffee-100">
                      {reservations.map((r) => (
                        <div key={r.id} className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-mono text-coffee-500">{r.reservation_number}</p>
                              <p className="font-semibold text-coffee-900 truncate">{r.room?.name}</p>
                            </div>
                            <select
                              value={r.status}
                              onChange={(e) => updateStatus(r.id, e.target.value)}
                              className="text-xs border border-coffee-200 rounded-lg px-2 py-1.5 bg-white shrink-0"
                            >
                              {statuses.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="text-xs text-coffee-600 space-y-0.5">
                            <p className="font-medium text-coffee-900 break-words">{r.user?.name} <span className="font-normal text-coffee-500 break-all">({r.user?.email})</span></p>
                            <p>{r.reservation_date} · {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)} · {r.guests_count} tamu</p>
                          </div>
                          <p className="text-sm font-semibold text-coffee-900">{formatPrice(r.total_price)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
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
                          <td className="px-6 py-4 text-sm text-coffee-500 whitespace-nowrap">{r.reservation_number}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-coffee-900">{r.user?.name}</p>
                            <p className="text-xs text-coffee-500">{r.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-coffee-900">{r.room?.name}</td>
                          <td className="px-6 py-4 text-sm text-coffee-600 whitespace-nowrap">
                            {r.reservation_date}<br />
                            {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}<br />
                            {r.guests_count} tamu
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-coffee-900 whitespace-nowrap">{formatPrice(r.total_price)}</td>
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
        </div>
      )}
          </DashboardLayout>
          );
}

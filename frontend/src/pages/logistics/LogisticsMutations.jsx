import { useEffect, useState } from 'react';
import { History, ArrowDownLeft, ArrowUpRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function LogisticsMutations() {
  const { user } = useAuth();
  const [mutations, setMutations] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [ingredientFilter, setIngredientFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (ingredientFilter) params.ingredient_id = ingredientFilter;

    Promise.all([
      api.get('/ingredients/mutations', { params }),
      api.get('/ingredients'),
    ])
      .then(([resMut, resIng]) => {
        setMutations(resMut.data.data || resMut.data);
        setIngredients(resIng.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, ingredientFilter]);

  const role = user?.role || 'logistics';

  return (
    <DashboardLayout title="Riwayat Mutasi Stok Bahan Baku" role={role}>
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-coffee-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-coffee-600">
              <SlidersHorizontal size={14} /> Filter:
            </div>

            {/* Type buttons */}
            <div className="flex gap-1.5">
              {[
                { id: '', label: 'Semua Mutasi' },
                { id: 'in', label: 'Masuk (+)' },
                { id: 'out', label: 'Keluar / Pesanan (-)' },
                { id: 'adjustment', label: 'Penyesuaian' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === t.id
                      ? 'bg-coffee-900 text-white'
                      : 'bg-coffee-50 text-coffee-700 hover:bg-coffee-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Ingredient dropdown */}
            <select
              value={ingredientFilter}
              onChange={(e) => setIngredientFilter(e.target.value)}
              className="input-field text-xs py-1.5 px-3 w-48 bg-white"
            >
              <option value="">Semua Bahan Baku</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            className="p-2 text-coffee-500 hover:text-coffee-900 hover:bg-coffee-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : mutations.length === 0 ? (
            <div className="text-center py-16 text-coffee-400">
              <History size={40} className="mx-auto text-coffee-300 mb-2" />
              <p className="font-semibold text-coffee-700">Tidak ada riwayat mutasi.</p>
              <p className="text-xs mt-1">Belum ada aktivitas stok untuk filter yang dipilih.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-coffee-50/60 border-b border-coffee-100 text-xs font-semibold text-coffee-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Waktu &amp; Tanggal</th>
                    <th className="py-3.5 px-6">Bahan Baku</th>
                    <th className="py-3.5 px-6">Tipe Mutasi</th>
                    <th className="py-3.5 px-6">Perubahan Stok</th>
                    <th className="py-3.5 px-6">Sebelum &rarr; Sesudah</th>
                    <th className="py-3.5 px-6">Keterangan Aktivitas</th>
                    <th className="py-3.5 px-6">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-50 text-sm">
                  {mutations.map((m) => {
                    const isOut = m.type === 'out';
                    const isIn = m.type === 'in';
                    const unit = m.ingredient?.unit || '';

                    return (
                      <tr key={m.id} className="hover:bg-coffee-50/40 transition-colors">
                        <td className="py-4 px-6 text-xs text-coffee-500 whitespace-nowrap">
                          {new Date(m.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-6 font-medium text-coffee-900">
                          {m.ingredient?.name || '-'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isIn
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOut
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isIn ? <ArrowDownLeft size={13} /> : isOut ? <ArrowUpRight size={13} /> : null}
                            {isIn ? 'Masuk' : isOut ? 'Keluar' : 'Penyesuaian'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-bold text-sm ${
                            isIn ? 'text-emerald-700' : isOut ? 'text-amber-700' : 'text-blue-700'
                          }`}>
                            {isIn ? '+' : isOut ? '-' : ''}
                            {Number(m.quantity).toLocaleString('id-ID')} {unit}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-coffee-500 font-mono">
                          {Number(m.previous_stock).toLocaleString('id-ID')} &rarr;{' '}
                          <strong className="text-coffee-800">{Number(m.current_stock).toLocaleString('id-ID')}</strong> {unit}
                        </td>
                        <td className="py-4 px-6 text-xs text-coffee-700 max-w-xs">
                          {m.notes || '-'}
                        </td>
                        <td className="py-4 px-6 text-xs text-coffee-500">
                          {m.user?.name || 'Sistem'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

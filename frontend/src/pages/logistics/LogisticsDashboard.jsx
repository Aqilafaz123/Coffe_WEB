import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, AlertTriangle, ArrowDownUp, ScrollText, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function LogisticsDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.get('/ingredients/stats')
      .then((r) => setStats(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const role = user?.role || 'logistics';
  const basePath = role === 'superadmin' ? '/admin' : '/logistik';

  return (
    <DashboardLayout title="Dashboard Logistik & Inventory" role={role}>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100/60">
                        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
                            <Boxes size={22} />
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
                            Master
                          </span>
                        </div>
                        <p className="text-coffee-500 text-sm">Total Bahan Baku</p>
                        <p className="text-xl sm:text-2xl font-bold text-coffee-900 mt-1">{stats?.total_ingredients || 0} Item</p>
                      </div>

                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-coffee-100/60'
                          }`}>
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  (stats?.low_stock_count || 0) > 0 ? 'bg-red-500' : 'bg-emerald-500'
                }`}>
                  <AlertTriangle size={22} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  (stats?.low_stock_count || 0) > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {(stats?.low_stock_count || 0) > 0 ? 'Perlu Restock' : 'Aman'}
                </span>
              </div>
              <p className="text-coffee-500 text-sm">Stok Kritis / Menipis</p>
              <p className="text-xl sm:text-2xl font-bold text-coffee-900 mt-1">{stats?.low_stock_count || 0} Item</p>
            </div>

                                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100/60">
                                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                      <ArrowDownUp size={22} />
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                                      Hari Ini
                                    </span>
                                  </div>
                                  <p className="text-coffee-500 text-sm">Mutasi Stok Hari Ini</p>
                                  <p className="text-xl sm:text-2xl font-bold text-coffee-900 mt-1">{stats?.mutations_today || 0} Aktivitas</p>
                                </div>

                                      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100/60">
                                        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                                          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-coffee-800 rounded-xl flex items-center justify-center text-white shrink-0">
                                            <ScrollText size={22} />
                                          </div>
                                          <span className="text-xs font-semibold px-2.5 py-1 bg-coffee-50 text-coffee-700 rounded-full">
                                            BOM
                                          </span>
                                        </div>
                                        <p className="text-coffee-500 text-sm">Resep Otomatis</p>
                                        <p className="text-sm font-semibold text-emerald-700 mt-2 flex items-center gap-1.5">
                                          <CheckCircle2 size={16} /> Aktif Terhubung
                                        </p>
                                      </div>
                                    </div>

                                    {/* Quick Actions */}
                                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100/60 flex flex-wrap items-center justify-between gap-4">
                                          <div className="min-w-0">
                                            <h2 className="font-semibold text-coffee-900 text-lg">Aksi Cepat Logistik</h2>
                                            <p className="text-coffee-500 text-sm">Kelola pasokan bahan baku atau hubungkan komposisi resep dengan menu kafe.</p>
                                          </div>
                                              <div className="flex flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
                                                <Link to={`${basePath}/bahan`} className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                                                  <Plus size={16} /> Kelola &amp; Restock Bahan
                                                </Link>
                                                  <Link to={`${basePath}/resep`} className="flex-1 sm:flex-initial px-4 py-2.5 bg-coffee-100 text-coffee-900 hover:bg-coffee-200 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                                                    <ScrollText size={16} /> Resep Produk (BOM)
                                                  </Link>
                                                    <button onClick={fetchStats} className="p-2.5 bg-coffee-50 text-coffee-600 hover:bg-coffee-100 rounded-xl transition-colors shrink-0" title="Refresh">
                                                      <RefreshCw size={16} />
                                                    </button>
                                                  </div>
                                              </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                                                  {/* Low Stock Warning Box */}
                                                      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100/60">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                                          <h3 className="font-semibold text-coffee-900 flex items-center gap-2">
                                                            <AlertTriangle size={18} className="text-amber-500 shrink-0" /> Peringatan Bahan Baku Menipis
                                                          </h3>
                                                            <Link to={`${basePath}/bahan`} className="text-xs text-coffee-600 hover:underline shrink-0">
                                                              Lihat Semua
                                                            </Link>
                                                        </div>

                                                        {!stats?.low_stock_items?.length ? (
                                                          <div className="py-12 text-center">
                                                            <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2" />
                                                            <p className="text-coffee-700 font-medium text-sm">Semua stok bahan dalam kondisi aman!</p>
                                                            <p className="text-coffee-400 text-xs">Tidak ada bahan baku yang berada di bawah batas minimum.</p>
                                                          </div>
                                                        ) : (
                                                          <div className="divide-y divide-coffee-50">
                                                            {stats.low_stock_items.map((item) => (
                                                                  <div key={item.id} className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                                                                    <div className="min-w-0 flex-1">
                                                                      <p className="font-medium text-coffee-900 text-sm truncate">{item.name}</p>
                                                                      <p className="text-xs text-coffee-400">Kode: {item.code || '-'}</p>
                                                                    </div>
                                                                        <div className="text-right shrink-0 ml-auto">
                                                                          <span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full whitespace-nowrap">
                                                                            Sisa: {Number(item.stock).toLocaleString('id-ID')} {item.unit}
                                                                          </span>
                                                                          <p className="text-[11px] text-coffee-400 mt-0.5">Min: {Number(item.min_stock).toLocaleString('id-ID')} {item.unit}</p>
                                                                        </div>
                                                                    </div>
                  ))}
                                                                  </div>
              )}
                                                                </div>

                                                                {/* Recent Mutations */}
                                                                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100/60">
                                                                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                                                        <h3 className="font-semibold text-coffee-900 flex items-center gap-2">
                                                                          <ArrowDownUp size={18} className="text-blue-500 shrink-0" /> Mutasi Stok Terakhir
                                                                        </h3>
                                                                          <Link to={`${basePath}/mutasi`} className="text-xs text-coffee-600 hover:underline shrink-0">
                                                                            Lihat Riwayat Lengkap
                                                                          </Link>
                                                                      </div>

                                                                      {!stats?.recent_mutations?.length ? (
                                                                        <p className="text-center py-12 text-coffee-400 text-sm">Belum ada mutasi stok tercatat.</p>
                                                                      ) : (
                                                                        <div className="divide-y divide-coffee-50">
                                                                          {stats.recent_mutations.map((m) => (
                                                                                <div key={m.id} className="py-3 flex items-center justify-between gap-2 text-sm">
                                                                                  <div className="min-w-0 flex-1 pr-2">
                                                                                    <p className="font-medium text-coffee-900 truncate">{m.ingredient?.name || 'Bahan'}</p>
                                                                                    <p className="text-xs text-coffee-400 truncate">{m.notes || '-'}</p>
                                                                                  </div>
                                                                                  <div className="text-right shrink-0">
                        <span className={`font-semibold text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          m.type === 'in' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : m.type === 'out' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '~'}
                          {Number(m.quantity).toLocaleString('id-ID')} {m.ingredient?.unit}
                        </span>
                        <p className="text-[10px] text-coffee-400 mt-1">
                          {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                                                                                </div>
                  ))}
                                                                              </div>
              )}
                                                                            </div>
          </div>
        </div>
      )}
                                                                  </DashboardLayout>
                                                                  );
}

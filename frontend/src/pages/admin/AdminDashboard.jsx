import { useEffect, useState } from 'react';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data));
  }, []);

  if (!stats) {
    return (
      <DashboardLayout title="Dashboard Admin" role="superadmin">
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const cards = [
    { label: 'Total Pengguna', value: stats.total_users, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Produk', value: stats.total_products, icon: Package, color: 'bg-coffee-600' },
    { label: 'Total Pesanan', value: stats.total_orders, icon: ShoppingCart, color: 'bg-purple-500' },
    { label: 'Pendapatan Bulan Ini', value: formatPrice(stats.monthly_revenue), icon: DollarSign, color: 'bg-green-500' },
  ];

  return (
    <DashboardLayout title="Dashboard Admin" role="superadmin">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon size={22} className="text-white" />
            </div>
            <p className="text-coffee-500 text-sm">{card.label}</p>
            <p className="text-2xl font-bold text-coffee-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-coffee-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Penjualan 7 Hari Terakhir
          </h3>
          {stats.sales_by_day.length === 0 ? (
            <p className="text-coffee-500 text-sm">Belum ada data penjualan.</p>
          ) : (
            <div className="space-y-3">
              {stats.sales_by_day.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-coffee-600">{day.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-coffee-400">{day.orders} pesanan</span>
                    <span className="text-sm font-medium text-coffee-900">{formatPrice(day.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-coffee-900 mb-4">Produk Terlaris</h3>
          {stats.top_products.length === 0 ? (
            <p className="text-coffee-500 text-sm">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {stats.top_products.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-coffee-700">{p.name}</span>
                  <span className="text-sm font-medium text-coffee-900">{p.total_sold} terjual</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-coffee-900 text-white rounded-2xl p-6">
        <p className="text-coffee-300 text-sm">Total Pendapatan Keseluruhan</p>
        <p className="text-3xl font-bold mt-1">{formatPrice(stats.total_revenue)}</p>
        <p className="text-coffee-400 text-sm mt-2">{stats.pending_orders} pesanan masih pending</p>
      </div>
    </DashboardLayout>
  );
}

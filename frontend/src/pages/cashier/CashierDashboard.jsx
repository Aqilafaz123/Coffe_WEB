import { useEffect, useState } from 'react';
import { Clock, Package, CheckCircle, DollarSign } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function CashierDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data));
  }, []);

  const cards = stats ? [
    { label: 'Pesanan Pending', value: stats.pending_orders, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Sedang Disiapkan', value: stats.preparing_orders, icon: Package, color: 'bg-blue-500' },
    { label: 'Selesai Hari Ini', value: stats.completed_today, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Pendapatan Hari Ini', value: formatPrice(stats.revenue_today), icon: DollarSign, color: 'bg-coffee-600' },
  ] : [];

  return (
    <DashboardLayout title="Dashboard Kasir" role="cashier">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={22} className="text-white" />
              </div>
            </div>
            <p className="text-coffee-500 text-sm">{card.label}</p>
            <p className="text-2xl font-bold text-coffee-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>
      {!stats && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      )}
    </DashboardLayout>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowRight,
  Sparkles,
  PieChart,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import api, { formatPrice, downloadPnLExcel } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await downloadPnLExcel({ period: 'this_month' });
    } catch (err) {
      alert(err.message || 'Gagal mengekspor laporan keuangan ke Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

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
    { label: 'Pendapatan Bulan Ini', value: formatPrice(stats.monthly_revenue), icon: DollarSign, color: 'bg-emerald-600' },
  ];

  const isNetProfitPositive = (stats.monthly_net_profit ?? 0) >= 0;

  return (
    <DashboardLayout title="Dashboard Admin" role="superadmin">
      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 ${card.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
              <card.icon size={22} className="text-white" />
            </div>
            <p className="text-coffee-500 text-sm">{card.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-coffee-900 mt-1 break-words">{card.value}</p>
          </div>
        ))}
      </div>

      {/* High-Impact Profit & Loss Highlight Section */}
      <div className="mb-6 sm:mb-8 bg-gradient-to-br from-coffee-900 via-coffee-800 to-coffee-950 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 border-b border-white/10 pb-5 sm:pb-6 mb-5 sm:mb-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-gold text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={13} /> Fitur Finansial
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
              Ringkasan Profit &amp; Loss (P&amp;L) Bulan Ini
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Hasil kalkulasi pendapatan bersih, HPP resep bahan baku, beban operasional, dan laba bersih riil kafe.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto self-start md:self-auto shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Unduh laporan keuangan bulan ini dalam format Excel (.xlsx)"
            >
              {exportingExcel ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              {exportingExcel ? 'Mengunduh...' : 'Export Excel (.xlsx)'}
            </button>

            <Link
              to="/admin/pnl"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-light text-coffee-950 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
            >
              Buka Laporan PnL Lengkap
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Revenue */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10">
            <span className="text-xs uppercase tracking-wider text-white/60 font-semibold block mb-1">
              Pendapatan Selesai
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white block break-words">
              {formatPrice(stats.monthly_revenue ?? 0)}
            </span>
            <span className="text-[11px] text-emerald-400 mt-2 block font-medium">
              Pesanan selesai bulan ini
            </span>
          </div>

          {/* HPP (COGS) */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10">
            <span className="text-xs uppercase tracking-wider text-white/60 font-semibold block mb-1">
              HPP Bahan Baku (COGS)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-amber-300 block break-words">
              {formatPrice(stats.monthly_cogs ?? 0)}
            </span>
            <span className="text-[11px] text-amber-200 mt-2 block font-medium">
              Kalkulasi resep produk terjual
            </span>
          </div>

          {/* Expenses */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10">
            <span className="text-xs uppercase tracking-wider text-white/60 font-semibold block mb-1">
              Beban Operasional
            </span>
            <span className="text-xl sm:text-2xl font-bold text-rose-300 block break-words">
              {formatPrice(stats.monthly_expenses ?? 0)}
            </span>
            <span className="text-[11px] text-rose-200 mt-2 block font-medium">
              Listrik, gaji, sewa, perlengkapan
            </span>
          </div>

          {/* Net Profit */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border-2 ${
              isNetProfitPositive
                ? 'bg-emerald-900/60 border-emerald-400/60'
                : 'bg-rose-900/60 border-rose-400/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-white/80 font-semibold">
                Laba Bersih
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  isNetProfitPositive ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'
                }`}
              >
                {isNetProfitPositive ? 'Untung' : 'Rugi'}
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-white block break-words">
              {formatPrice(stats.monthly_net_profit ?? 0)}
            </span>
            <span className="text-[11px] text-white/80 mt-2 block font-medium">
              Net Margin: {stats.monthly_net_margin ?? 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Sales Trend & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100">
          <h3 className="font-semibold text-coffee-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="shrink-0" /> Penjualan 7 Hari Terakhir
          </h3>
          {stats.sales_by_day.length === 0 ? (
            <p className="text-coffee-500 text-sm">Belum ada data penjualan.</p>
          ) : (
            <div className="space-y-3">
              {stats.sales_by_day.map((day) => (
                <div key={day.date} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl hover:bg-coffee-50 transition-colors">
                  <span className="text-sm font-medium text-coffee-700 shrink-0">{day.date}</span>
                  <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                    <span className="text-xs text-coffee-400 whitespace-nowrap">{day.orders} pesanan</span>
                    <span className="text-sm font-bold text-coffee-950 whitespace-nowrap">{formatPrice(day.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-coffee-100">
          <h3 className="font-semibold text-coffee-900 mb-4 flex items-center gap-2">
            <Package size={18} className="shrink-0" /> Produk Terlaris
          </h3>
          {stats.top_products.length === 0 ? (
            <p className="text-coffee-500 text-sm">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {stats.top_products.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-coffee-50 transition-colors">
                  <span className="text-sm font-medium text-coffee-800 truncate min-w-0">{p.name}</span>
                  <span className="text-xs font-bold bg-coffee-100 text-coffee-900 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                    {p.total_sold} terjual
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-coffee-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-coffee-300 text-sm">Total Pendapatan Keseluruhan Toko</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight break-words">{formatPrice(stats.total_revenue)}</p>
          <p className="text-coffee-400 text-xs mt-1.5">{stats.pending_orders} pesanan masih pending</p>
        </div>
        <Link
          to="/admin/pnl"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all self-start sm:self-auto shrink-0"
        >
          Lihat Analisis Margin &amp; Laba Rugi <ArrowRight size={14} />
        </Link>
      </div>
    </DashboardLayout>
  );
}

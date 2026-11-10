import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Receipt,
  Plus,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart2,
  FileSpreadsheet,
  Coins,
  Building,
  Users,
  Lightbulb,
  Download,
  CalendarDays,
  X
} from 'lucide-react';
import api, { formatPrice, downloadPnLExcel } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const EXPENSE_CATEGORIES = {
  gaji: { label: 'Gaji Karyawan', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  utilitas: { label: 'Listrik, Air & Internet', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  sewa: { label: 'Sewa Tempat / Gedung', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  perlengkapan: { label: 'Packaging & Perlengkapan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  operasional: { label: 'Operasional Harian', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  pemasaran: { label: 'Pemasaran & Promosi', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  pemeliharaan: { label: 'Pemeliharaan & Servis', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  lainnya: { label: 'Lain-lain', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const PERIODS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'yesterday', label: 'Kemarin' },
  { id: 'this_week', label: 'Minggu Ini' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'last_month', label: 'Bulan Lalu' },
  { id: 'this_year', label: 'Tahun Ini' },
  { id: 'all_time', label: 'Semua Waktu' },
  { id: 'custom', label: 'Kustom' },
];

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const cleanStr = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
    const [y, m, d] = cleanStr.split('-');
    if (d && m && y) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthName = months[parseInt(m, 10) - 1] || m;
      return `${parseInt(d, 10)} ${monthName} ${y}`;
    }
    return cleanStr;
  } catch {
    return dateStr;
  }
};


export default function AdminPnL() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'products' | 'expenses' | 'orders'

  // Expenses management state
  const [expensesList, setExpensesList] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category: 'operasional',
    title: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Product margin search
  const [productSearch, setProductSearch] = useState('');

  // Excel export state
  const [exportingExcel, setExportingExcel] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportMonth, setSelectedExportMonth] = useState(new Date().getMonth() + 1);
  const [selectedExportYear, setSelectedExportYear] = useState(new Date().getFullYear());
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleExportCurrent = async () => {
    setShowExportDropdown(false);
    setExportingExcel(true);
    try {
      let params = { period };
      if (period === 'custom' && startDate && endDate) {
        params = { period: 'custom', start_date: startDate, end_date: endDate };
      }
      await downloadPnLExcel(params);
    } catch (err) {
      alert(err.message || 'Gagal mengunduh file Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportSpecificMonth = async (e) => {
    e.preventDefault();
    setExportingExcel(true);
    try {
      await downloadPnLExcel({
        month: selectedExportMonth,
        year: selectedExportYear,
      });
      setIsExportModalOpen(false);
    } catch (err) {
      alert(err.message || 'Gagal mengunduh file Excel bulanan.');
    } finally {
      setExportingExcel(false);
    }
  };

  const fetchPnLReport = async (selectedPeriod = period, sDate = startDate, eDate = endDate) => {
    setLoading(true);
    try {
      let url = `/pnl?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && sDate && eDate) {
        url += `&start_date=${sDate}&end_date=${eDate}`;
      }
      const response = await api.get(url);
      setData(response.data);
    } catch (err) {
      console.error('Failed to load PnL data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const response = await api.get('/expenses');
      setExpensesList(response.data.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchPnLReport(period, startDate, endDate);
  }, [period]);

  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    }
  }, [activeTab]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      fetchPnLReport(newPeriod);
    }
  };

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchPnLReport('custom', startDate, endDate);
    }
  };

  // Open modal for creating new expense
  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: 'operasional',
      title: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setExpenseError('');
    setIsExpenseModalOpen(true);
  };

  // Open modal for editing expense
  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      title: expense.title,
      amount: expense.amount,
      expense_date: expense.expense_date ? String(expense.expense_date).split('T')[0] : '',
      notes: expense.notes || '',
    });
    setExpenseError('');
    setIsExpenseModalOpen(true);
  };

  // Submit expense (Create or Update)
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    setSubmittingExpense(true);
    setExpenseError('');
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, expenseForm);
      } else {
        await api.post('/expenses', expenseForm);
      }
      setIsExpenseModalOpen(false);
      fetchPnLReport(period, startDate, endDate);
      if (activeTab === 'expenses') {
        fetchExpenses();
      }
    } catch (err) {
      setExpenseError(err.response?.data?.message || 'Gagal menyimpan pengeluaran.');
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      setDeleteConfirmId(null);
      fetchPnLReport(period, startDate, endDate);
      if (activeTab === 'expenses') {
        fetchExpenses();
      }
    } catch {
      alert('Gagal menghapus data pengeluaran.');
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!data?.product_margins) return [];
    if (!productSearch.trim()) return data.product_margins;
    const q = productSearch.toLowerCase();
    return data.product_margins.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [data?.product_margins, productSearch]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expensesList.filter((exp) => {
      const matchCat = expenseCategoryFilter ? exp.category === expenseCategoryFilter : true;
      const matchSearch = expenseSearch
        ? exp.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
          exp.expense_number.toLowerCase().includes(expenseSearch.toLowerCase()) ||
          (exp.notes && exp.notes.toLowerCase().includes(expenseSearch.toLowerCase()))
        : true;
      return matchCat && matchSearch;
    });
  }, [expensesList, expenseCategoryFilter, expenseSearch]);

  const summary = data?.summary || {
    gross_sales: 0,
    reservations_revenue: 0,
    total_discounts: 0,
    net_revenue: 0,
    total_cogs: 0,
    gross_profit: 0,
    gross_profit_margin: 0,
    total_expenses: 0,
    net_profit: 0,
    net_profit_margin: 0,
    orders_count: 0,
    items_sold_count: 0,
    avg_order_value: 0,
    status: 'break_even',
  };

  const isProfitable = summary.net_profit >= 0;

  return (
    <DashboardLayout title="Laporan Laba Rugi (Profit & Loss)" role="superadmin">
      <div className="space-y-8 print:space-y-4 w-full max-w-full">
        {/* PRINT-ONLY OFFICIAL LETTERHEAD / KOP LAPORAN */}
        <div className="hidden print:block border-b-2 border-coffee-900 pb-3 mb-4 print-avoid-break">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-coffee-900 text-gold flex items-center justify-center font-display font-bold text-xl border border-coffee-800 shrink-0">
                R
              </div>
              <div>
                <h1 className="text-xl font-bold font-display tracking-wider text-coffee-950 uppercase leading-none">
                  RAHARDJA &bull; ES KRIM, TEH &amp; KOPI
                </h1>
                <p className="text-xs font-semibold text-coffee-700 tracking-wide mt-1">
                  LAPORAN LABA RUGI &bull; PROFIT AND LOSS STATEMENT
                </p>
                <p className="text-[10px] text-coffee-500 mt-0.5">
                  Jl. Boulevard Gading Serpong, Tangerang &bull; Sistem Akuntansi Kafe Terintegrasi
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block text-xs font-bold px-2.5 py-0.5 bg-coffee-100 text-coffee-900 rounded border border-coffee-200">
                {data?.period_label || 'Periode Saat Ini'}
              </span>
              <p className="text-[10px] text-coffee-500 mt-1">
                Waktu Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </p>
              <p className="text-[10px] text-coffee-500">
                Dicetak Oleh: {user?.name || 'Super Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Banner & Print Button (Screen Only) */}
        <div className="no-print print:hidden relative bg-gradient-to-r from-coffee-900 via-coffee-800 to-coffee-950 p-5 sm:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl">
          {/* Subtle background glow contained in its own overflow container */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 sm:gap-6">
            <div className="max-w-xl min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-gold text-xs font-semibold tracking-wider uppercase mb-3 backdrop-blur-sm">
                <Coins size={14} /> Keuangan &amp; Akuntansi Kafe
              </div>
              <h2 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
                Analisis Profit &amp; Loss (P&amp;L)
              </h2>
              <p className="text-coffee-200 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Pantau arus pendapatan bersih, Harga Pokok Penjualan (HPP bahan baku), beban operasional kafe, dan laba bersih secara akurat dan real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
              <button
                type="button"
                onClick={handleOpenCreateExpense}
                className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 bg-gold hover:bg-gold-light text-coffee-950 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} />
                <span>Catat Beban Operasional</span>
              </button>

              {/* Export Excel Button with Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportDropdown((prev) => !prev)}
                  disabled={exportingExcel}
                  className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  title="Ekspor laporan keuangan ke format Excel (.xlsx)"
                >
                  {exportingExcel ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={18} />
                  )}
                  <span>Export Excel (.xlsx)</span>
                  <ChevronDown size={15} className={`transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showExportDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowExportDropdown(false)}
                    />
                    <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[min(20rem,calc(100vw-2.5rem))] bg-white rounded-2xl shadow-2xl border border-coffee-100 p-2.5 z-50 text-coffee-900 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-coffee-100 mb-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-coffee-400 uppercase tracking-wider block">
                          Pilihan Unduh Excel (.xlsx)
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          4 Sheet Lengkap
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportCurrent}
                        className="w-full text-left p-3 hover:bg-coffee-50 rounded-xl transition-colors flex items-start gap-3 group"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors shrink-0 mt-0.5">
                          <FileSpreadsheet size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-coffee-950 block">
                              Export Periode Aktif
                            </span>
                            <span className="text-[10px] bg-coffee-100 text-coffee-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                              {period.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-coffee-500 block truncate mt-0.5">
                            {data?.period_label || 'Periode Saat Ini'}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowExportDropdown(false);
                          setIsExportModalOpen(true);
                        }}
                        className="w-full text-left p-3 hover:bg-coffee-50 rounded-xl transition-colors flex items-start gap-3 group"
                      >
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-100 transition-colors shrink-0 mt-0.5">
                          <CalendarDays size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-xs text-coffee-950 block">
                            Pilih Bulan &amp; Tahun Tertentu...
                          </span>
                          <span className="text-[11px] text-coffee-500 block mt-0.5">
                            Generate arsip laporan bulanan spesifik
                          </span>
                        </div>
                      </button>

                      <div className="mt-1 pt-2 border-t border-coffee-100 px-2 pb-1">
                        <p className="text-[10px] text-coffee-400 leading-tight">
                          💡 Format 6-Sheet lengkap: Laba Rugi, Rekap Penjualan Harian, Detail Menu &amp; Metode Bayar, Profitabilitas Menu, Beban Operasional, dan Rincian Pesanan.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-medium text-xs sm:text-sm transition-all backdrop-blur-sm active:scale-95 whitespace-nowrap"
              >
                <Printer size={18} />
                <span>Cetak Laporan</span>
              </button>
              <button
                type="button"
                onClick={() => fetchPnLReport(period, startDate, endDate)}
                disabled={loading}
                title="Perbarui Data"
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Period Toolbar (Screen Only) */}
        <div className="no-print print:hidden bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-coffee-100 space-y-3.5">
          {/* Row 1: Presets & Active Period Status Badge */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-1 min-w-0">
              <span className="text-xs font-semibold text-coffee-400 uppercase tracking-wider flex items-center gap-1.5 mr-1 shrink-0">
                <Calendar size={14} /> Periode:
              </span>
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    period === p.id
                      ? 'bg-coffee-900 text-white shadow-sm'
                      : 'bg-coffee-50 text-coffee-700 hover:bg-coffee-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {data && (
              <div className="text-xs text-coffee-600 font-semibold bg-coffee-50/80 border border-coffee-200/60 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 self-start md:self-auto flex items-center gap-2 max-w-full overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">{data.period_label}</span>
              </div>
            )}
          </div>

          {/* Row 2: Custom Date Selector Panel (Smoothly revealed when 'custom' is active) */}
          {period === 'custom' && (
            <div className="pt-3 border-t border-coffee-100 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <form onSubmit={handleApplyCustomDate} className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <span className="text-xs font-bold text-coffee-700 flex items-center gap-1.5 mr-1">
                  <Filter size={13} className="text-coffee-500 shrink-0" />
                  Pilih Rentang Tanggal:
                </span>
                <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-coffee-50 px-3 py-2 sm:py-1.5 rounded-xl border border-coffee-200 focus-within:ring-2 focus-within:ring-coffee-400 focus-within:border-coffee-400 transition-all">
                  <span className="text-[11px] font-semibold text-coffee-500 shrink-0">Mulai:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs text-coffee-900 focus:outline-none min-w-0"
                    required
                  />
                </div>
                <span className="hidden sm:inline text-coffee-400 text-xs font-bold">&ndash;</span>
                <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-coffee-50 px-3 py-2 sm:py-1.5 rounded-xl border border-coffee-200 focus-within:ring-2 focus-within:ring-coffee-400 focus-within:border-coffee-400 transition-all">
                  <span className="text-[11px] font-semibold text-coffee-500 shrink-0">Sampai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs text-coffee-900 focus:outline-none min-w-0"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-coffee-900 hover:bg-coffee-950 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Filter size={13} />
                  <span>Terapkan Rentang</span>
                </button>
              </form>

              <div className="text-[11px] text-coffee-500 italic">
                💡 Pilih rentang tanggal awal dan akhir untuk mengkalkulasi laba rugi spesifik.
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm px-4 text-center">
            <div className="w-12 h-12 border-4 border-coffee-200 border-t-coffee-900 rounded-full animate-spin mb-4" />
            <p className="text-coffee-600 font-medium text-sm">Menghitung data laba rugi &amp; HPP...</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 print:grid-cols-5 gap-4 sm:gap-5 print:gap-2 print-avoid-break">
              {/* 1. Pendapatan Bersih (Net Revenue) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 print:p-2.5 print:rounded-xl shadow-sm print:shadow-none border border-coffee-100 print:border-coffee-300 flex flex-col justify-between hover:shadow-md transition-shadow print-avoid-break">
                <div className="flex items-center justify-between gap-2 mb-3 print:mb-1">
                  <span className="text-xs print:text-[10px] font-semibold text-coffee-500 uppercase tracking-wider">Pendapatan Bersih</span>
                  <div className="w-10 h-10 print:hidden rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <DollarSign size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl print:text-base font-bold text-coffee-950 tracking-tight break-words">
                    {formatPrice(summary.net_revenue)}
                  </h3>
                  <div className="mt-2 print:mt-0.5 text-xs print:text-[9px] text-coffee-500 flex flex-col gap-0.5">
                    <span>Penjualan: {formatPrice(summary.gross_sales)}</span>
                    {summary.total_discounts > 0 && (
                      <span className="text-rose-600">Diskon: -{formatPrice(summary.total_discounts)}</span>
                    )}
                    {summary.reservations_revenue > 0 && (
                      <span className="text-blue-600">Reservasi: +{formatPrice(summary.reservations_revenue)}</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 print:mt-1 pt-3 print:pt-1 border-t border-coffee-50 print:border-coffee-200 flex flex-wrap items-center justify-between gap-1 text-xs print:text-[9px] text-coffee-400">
                  <span>{summary.orders_count} Transaksi</span>
                  <span>Avg: {formatPrice(summary.avg_order_value)}</span>
                </div>
              </div>

              {/* 2. Total HPP / COGS */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 print:p-2.5 print:rounded-xl shadow-sm print:shadow-none border border-coffee-100 print:border-coffee-300 flex flex-col justify-between hover:shadow-md transition-shadow print-avoid-break">
                <div className="flex items-center justify-between gap-2 mb-3 print:mb-1">
                  <span className="text-xs print:text-[10px] font-semibold text-coffee-500 uppercase tracking-wider">HPP (Bahan Baku)</span>
                  <div className="w-10 h-10 print:hidden rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl print:text-base font-bold text-amber-950 tracking-tight break-words">
                    {formatPrice(summary.total_cogs)}
                  </h3>
                  <p className="mt-1 print:mt-0.5 text-xs print:text-[9px] text-coffee-500">
                    Beban bahan pokok ({summary.items_sold_count} item).
                  </p>
                </div>
                <div className="mt-3 print:mt-1 pt-3 print:pt-1 border-t border-coffee-50 print:border-coffee-200 flex items-center justify-between gap-2 text-xs print:text-[9px]">
                  <span className="text-coffee-400">Rasio HPP</span>
                  <span className="font-semibold text-amber-700">
                    {summary.net_revenue > 0 ? ((summary.total_cogs / summary.net_revenue) * 100).toFixed(1) : 0}% omset
                  </span>
                </div>
              </div>

              {/* 3. Laba Kotor (Gross Profit) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 print:p-2.5 print:rounded-xl shadow-sm print:shadow-none border border-coffee-100 print:border-coffee-300 flex flex-col justify-between hover:shadow-md transition-shadow print-avoid-break">
                <div className="flex items-center justify-between gap-2 mb-3 print:mb-1">
                  <span className="text-xs print:text-[10px] font-semibold text-coffee-500 uppercase tracking-wider">Laba Kotor</span>
                  <div className="w-10 h-10 print:hidden rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl print:text-base font-bold text-cyan-950 tracking-tight break-words">
                    {formatPrice(summary.gross_profit)}
                  </h3>
                  <p className="mt-1 print:mt-0.5 text-xs print:text-[9px] text-coffee-500">
                    Pendapatan dikurangi HPP Bahan.
                  </p>
                </div>
                <div className="mt-3 print:mt-1 pt-3 print:pt-1 border-t border-coffee-50 print:border-coffee-200 flex items-center justify-between gap-2 text-xs print:text-[9px]">
                  <span className="text-coffee-400">Gross Margin</span>
                  <span className="font-semibold text-cyan-700">
                    {summary.gross_profit_margin}%
                  </span>
                </div>
              </div>

              {/* 4. Beban Operasional (OpEx) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 print:p-2.5 print:rounded-xl shadow-sm print:shadow-none border border-coffee-100 print:border-coffee-300 flex flex-col justify-between hover:shadow-md transition-shadow print-avoid-break">
                <div className="flex items-center justify-between gap-2 mb-3 print:mb-1">
                  <span className="text-xs print:text-[10px] font-semibold text-coffee-500 uppercase tracking-wider">Beban OPEX</span>
                  <div className="w-10 h-10 print:hidden rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                    <Receipt size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl print:text-base font-bold text-rose-950 tracking-tight break-words">
                    {formatPrice(summary.total_expenses)}
                  </h3>
                  <p className="mt-1 print:mt-0.5 text-xs print:text-[9px] text-coffee-500">
                    Gaji, utilitas &amp; operasional rutin.
                  </p>
                </div>
                <div className="mt-3 print:mt-1 pt-3 print:pt-1 border-t border-coffee-50 print:border-coffee-200 flex flex-wrap items-center justify-between gap-1 text-xs print:text-[9px]">
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-rose-700 hover:text-rose-900 font-medium inline-flex items-center gap-1 print:hidden"
                  >
                    Rincian Beban <ChevronRight size={12} />
                  </button>
                  <span className="hidden print:inline text-coffee-500">Kategori</span>
                  <span className="font-semibold text-rose-700">
                    {data?.expenses_by_category?.length || 0} Pos Akun
                  </span>
                </div>
              </div>

              {/* 5. Laba / Rugi Bersih (Net Profit / Loss) Hero */}
              <div
                className={`rounded-2xl p-4 sm:p-5 print:p-2.5 print:rounded-xl shadow-md print:shadow-none flex flex-col justify-between border-2 transition-all print-avoid-break ${
                  isProfitable
                    ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-500/50 print:bg-emerald-50 print:text-emerald-950 print:border-emerald-600'
                    : 'bg-gradient-to-br from-rose-900 to-rose-950 text-white border-rose-500/50 print:bg-rose-50 print:text-rose-950 print:border-rose-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3 print:mb-1">
                  <span className="text-xs print:text-[10px] font-semibold tracking-wider uppercase text-white/70 print:text-coffee-700">
                    Laba Bersih (Net)
                  </span>
                  <span
                    className={`px-2.5 py-0.5 print:px-1.5 print:py-0 rounded-full text-[10px] print:text-[9px] font-bold tracking-wider uppercase shrink-0 ${
                      isProfitable ? 'bg-emerald-400 text-emerald-950 print:bg-emerald-600 print:text-white' : 'bg-rose-400 text-rose-950 print:bg-rose-600 print:text-white'
                    }`}
                  >
                    {isProfitable ? 'Untung' : 'Rugi'}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl print:text-base font-extrabold tracking-tight break-words">
                    {formatPrice(summary.net_profit)}
                  </h3>
                  <p className="mt-1 print:mt-0.5 text-xs print:text-[9px] text-white/70 print:text-coffee-600">
                    Laba Kotor dikurangi Total Beban.
                  </p>
                </div>
                <div className="mt-3 print:mt-1 pt-3 print:pt-1 border-t border-white/10 print:border-coffee-200 flex items-center justify-between gap-2 text-xs print:text-[9px] text-white/80 print:text-coffee-700">
                  <span>Net Margin</span>
                  <span className="font-bold text-white print:text-coffee-950 text-sm print:text-xs">
                    {summary.net_profit_margin}%
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Screen Only) */}
            <div className="border-b border-coffee-200 no-print print:hidden">
              <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'summary'
                      ? 'border-coffee-900 text-coffee-900'
                      : 'border-transparent text-coffee-400 hover:text-coffee-700'
                  }`}
                >
                  <FileSpreadsheet size={16} /> Laporan &amp; Grafik Laba Rugi
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'products'
                      ? 'border-coffee-900 text-coffee-900'
                      : 'border-transparent text-coffee-400 hover:text-coffee-700'
                  }`}
                >
                  <BarChart2 size={16} /> Profitabilitas Menu Produk
                  {data?.product_margins?.length > 0 && (
                    <span className="px-2 py-0.5 bg-coffee-100 text-coffee-800 rounded-full text-xs font-medium">
                      {data.product_margins.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'expenses'
                      ? 'border-coffee-900 text-coffee-900'
                      : 'border-transparent text-coffee-400 hover:text-coffee-700'
                  }`}
                >
                  <Receipt size={16} /> Kelola Beban Operasional
                  {expensesList.length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-xs font-medium">
                      {expensesList.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'orders'
                      ? 'border-coffee-900 text-coffee-900'
                      : 'border-transparent text-coffee-400 hover:text-coffee-700'
                  }`}
                >
                  <Coins size={16} /> Margin Transaksi Terakhir
                </button>
              </div>
            </div>

            {/* TAB 1: SUMMARY & FINANCIAL REPORT */}
            {activeTab === 'summary' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Formal Accounting Statement Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl print:rounded-xl p-4 sm:p-8 print:p-4 shadow-sm print:shadow-none border border-coffee-100 print:border-coffee-300 print-avoid-break">
                  <div className="border-b border-coffee-100 pb-4 mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold font-display text-coffee-900">
                        Format Standar Laporan Laba Rugi
                      </h3>
                      <p className="text-xs text-coffee-500 mt-0.5">
                        Laporan keuangan resmi periode: <span className="font-semibold text-coffee-800">{data?.period_label}</span>
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-coffee-50 px-3 py-1 rounded-lg text-coffee-600 border border-coffee-100 self-start sm:self-auto shrink-0">
                      Metode: Akrual / Realistis Bahan Baku
                    </span>
                  </div>

                  <div className="space-y-5 sm:space-y-6 print:space-y-3.5 text-xs sm:text-sm">
                    {/* SECTION I: PENDAPATAN */}
                    <div className="print-avoid-break">
                      <div className="font-bold text-coffee-950 uppercase tracking-wider text-xs bg-coffee-50/80 px-3 py-2 print:py-1 rounded-lg mb-2 print:mb-1 border border-coffee-100/60">
                        I. Pendapatan Usaha (Revenue)
                      </div>
                      <div className="space-y-2 print:space-y-1 px-1 sm:px-3">
                        <div className="flex justify-between items-center gap-3 text-coffee-700">
                          <span className="min-w-0">Penjualan Kotor Produk (Food &amp; Beverage)</span>
                          <span className="font-medium shrink-0">{formatPrice(summary.gross_sales)}</span>
                        </div>
                        {summary.reservations_revenue > 0 && (
                          <div className="flex justify-between items-center gap-3 text-coffee-700">
                            <span className="min-w-0">Pendapatan Sewa Ruangan (Room Reservations)</span>
                            <span className="font-medium shrink-0">{formatPrice(summary.reservations_revenue)}</span>
                          </div>
                        )}
                        {summary.total_discounts > 0 && (
                          <div className="flex justify-between items-center gap-3 text-rose-600">
                            <span className="min-w-0">Potongan Penjualan / Voucher Diskon</span>
                            <span className="font-medium shrink-0">-{formatPrice(summary.total_discounts)}</span>
                          </div>
                        )}
                        <div className="pt-2 print:pt-1 border-t border-coffee-100 flex justify-between items-center gap-3 font-bold text-coffee-900">
                          <span className="min-w-0">Total Pendapatan Bersih (Net Revenue)</span>
                          <span className="text-sm sm:text-base print:text-sm text-emerald-700 shrink-0">{formatPrice(summary.net_revenue)}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION II: HPP */}
                    <div className="print-avoid-break">
                      <div className="font-bold text-coffee-950 uppercase tracking-wider text-xs bg-coffee-50/80 px-3 py-2 print:py-1 rounded-lg mb-2 print:mb-1 border border-coffee-100/60">
                        II. Harga Pokok Penjualan (Cost of Goods Sold - COGS)
                      </div>
                      <div className="space-y-2 print:space-y-1 px-1 sm:px-3">
                        <div className="flex justify-between items-center gap-3 text-coffee-700">
                          <span className="min-w-0">Pemakaian Bahan Baku Kopi, Susu, Sirup &amp; Kemasan Cup</span>
                          <span className="font-medium shrink-0">{formatPrice(summary.total_cogs)}</span>
                        </div>
                        <div className="pt-2 print:pt-1 border-t border-coffee-100 flex justify-between items-center gap-3 font-bold text-coffee-900">
                          <span className="min-w-0">Total Harga Pokok Penjualan (HPP)</span>
                          <span className="text-sm sm:text-base print:text-sm text-amber-800 shrink-0">({formatPrice(summary.total_cogs)})</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION III: LABA KOTOR */}
                    <div className="bg-cyan-50/50 print:bg-cyan-50/30 p-3.5 sm:p-4 print:p-2.5 rounded-2xl print:rounded-xl border border-cyan-100 print:border-cyan-300 print-avoid-break">
                      <div className="flex flex-wrap justify-between items-center gap-2 font-bold text-cyan-950 text-sm sm:text-base print:text-sm">
                        <span>III. Laba Kotor (Gross Profit)</span>
                        <div className="text-left sm:text-right sm:ml-auto">
                          <span className="text-base sm:text-lg print:text-sm text-cyan-900">{formatPrice(summary.gross_profit)}</span>
                          <span className="block text-xs print:text-[10px] font-normal text-cyan-700">
                            Margin Kotor: {summary.gross_profit_margin}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION IV: BEBAN OPERASIONAL */}
                    <div className="print-avoid-break">
                      <div className="font-bold text-coffee-950 uppercase tracking-wider text-xs bg-coffee-50/80 px-3 py-2 print:py-1 rounded-lg mb-2 print:mb-1 border border-coffee-100/60">
                        IV. Beban Operasional (Operating Expenses)
                      </div>
                      <div className="space-y-2 print:space-y-1 px-1 sm:px-3">
                        {data?.expenses_by_category && data.expenses_by_category.length > 0 ? (
                          data.expenses_by_category.map((cat) => (
                            <div key={cat.key} className="flex justify-between items-center gap-3 text-coffee-700">
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                <span>{cat.label} ({cat.percentage}%)</span>
                              </span>
                              <span className="font-medium shrink-0">{formatPrice(cat.amount)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-coffee-400 italic">Belum ada beban operasional tercatat pada periode ini.</p>
                        )}
                        <div className="pt-2 print:pt-1 border-t border-coffee-100 flex justify-between items-center gap-3 font-bold text-coffee-900">
                          <span className="min-w-0">Total Beban Operasional</span>
                          <span className="text-sm sm:text-base print:text-sm text-rose-700 shrink-0">({formatPrice(summary.total_expenses)})</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION V: LABA / RUGI BERSIH */}
                    <div
                      className={`p-4 sm:p-5 print:p-3 rounded-2xl print:rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-avoid-break ${
                        isProfitable
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-base sm:text-lg print:text-base uppercase tracking-tight">
                            V. Laba / (Rugi) Bersih (Net Income)
                          </span>
                          <span
                            className={`px-2.5 py-0.5 print:px-1.5 print:py-0 rounded-full text-xs print:text-[10px] font-bold shrink-0 ${
                              isProfitable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {isProfitable ? 'SURPLUS / UNTUNG' : 'DEFISIT / RUGI'}
                          </span>
                        </div>
                        <p className="text-xs print:text-[10px] mt-1 text-coffee-600">
                          Hasil akhir operasional setelah memperhitungkan seluruh pendapatan, HPP bahan baku, dan beban operasional.
                        </p>
                      </div>

                      <div className="text-left sm:text-right sm:min-w-[200px] shrink-0">
                        <span className="text-2xl sm:text-3xl print:text-lg font-extrabold tracking-tight block break-words">
                          {formatPrice(summary.net_profit)}
                        </span>
                        <span className="text-xs print:text-[10px] font-semibold">
                          Net Profit Margin: {summary.net_profit_margin}%
                        </span>
                      </div>
                    </div>

                    {/* PRINT-ONLY OFFICIAL SIGN-OFF / PENGESAHAN */}
                    <div className="hidden print:block pt-6 mt-6 border-t border-coffee-300 print-avoid-break">
                      <div className="grid grid-cols-2 gap-8 text-xs text-coffee-900">
                        <div>
                          <p className="font-semibold text-coffee-600">Disiapkan Oleh,</p>
                          <div className="h-14" />
                          <p className="font-bold border-b border-coffee-400 inline-block min-w-[180px]">
                            {user?.name || 'Super Admin'}
                          </p>
                          <p className="text-[10px] text-coffee-500 mt-0.5">Finance &amp; Operasional Kafe</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-coffee-600">Diketahui &amp; Disetujui Oleh,</p>
                          <div className="h-14" />
                          <p className="font-bold border-b border-coffee-400 inline-block min-w-[180px]">
                            ( .................................................... )
                          </p>
                          <p className="text-[10px] text-coffee-500 mt-0.5">Pemilik / General Manager</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center text-[9px] text-coffee-400">
                        Dokumen resmi RAHARDJA Coffee Web &bull; Dicetak secara sistematis tanpa coretan
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trend Chart and Category Breakdown Grid (Screen Only) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print print:hidden">
                  {/* Left: Trend Comparison Chart */}
                  <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-coffee-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
                      <div className="min-w-0">
                        <h4 className="font-bold text-coffee-950 text-base flex items-center gap-2">
                          <BarChart2 size={18} className="text-coffee-700 shrink-0" />
                          <span>Grafik Performa Finansial ({data?.chart_data?.length || 0} Titik Waktu)</span>
                        </h4>
                        <p className="text-xs text-coffee-500 mt-0.5">
                          Perbandingan Omzet, HPP, Beban Operasional, dan Laba Bersih
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-coffee-600 shrink-0">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Omzet
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> HPP
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Beban
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Laba Bersih
                        </span>
                      </div>
                    </div>

                    {data?.chart_data?.length === 0 ? (
                      <div className="py-16 text-center text-coffee-400 text-sm">
                        Belum ada data transaksi untuk grafik pada periode ini.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Interactive Bar Chart Rows */}
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 sm:pr-2">
                          {data.chart_data.map((point) => {
                            const maxVal = Math.max(
                              point.revenue,
                              point.cogs,
                              point.expenses,
                              Math.abs(point.net_profit),
                              100000
                            );
                            const revWidth = Math.min(100, Math.max(2, (point.revenue / maxVal) * 100));
                            const cogsWidth = Math.min(100, Math.max(2, (point.cogs / maxVal) * 100));
                            const expWidth = Math.min(100, Math.max(2, (point.expenses / maxVal) * 100));

                            return (
                              <div key={point.date} className="p-3 bg-coffee-50/40 rounded-xl hover:bg-coffee-50 transition-colors">
                                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-semibold text-coffee-800 mb-2">
                                  <span>{point.label}</span>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                    <span className="text-emerald-700 whitespace-nowrap">Omzet: {formatPrice(point.revenue)}</span>
                                    <span className={`whitespace-nowrap ${point.net_profit >= 0 ? 'text-blue-700 font-bold' : 'text-rose-700 font-bold'}`}>
                                      Net: {formatPrice(point.net_profit)}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  {/* Revenue bar */}
                                  <div className="w-full bg-coffee-100 rounded-full h-2 overflow-hidden flex">
                                    <div
                                      style={{ width: `${revWidth}%` }}
                                      className="bg-emerald-500 h-full rounded-full transition-all"
                                      title={`Omzet: ${formatPrice(point.revenue)}`}
                                    />
                                  </div>
                                  {/* HPP & Expense mini bars */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                                    <div className="flex items-center gap-1.5 text-[10px] text-coffee-500">
                                      <span className="shrink-0">HPP:</span>
                                      <div className="flex-1 bg-coffee-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          style={{ width: `${cogsWidth}%` }}
                                          className="bg-amber-500 h-full rounded-full"
                                        />
                                      </div>
                                      <span className="font-medium text-amber-800 shrink-0 whitespace-nowrap">{formatPrice(point.cogs)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-coffee-500">
                                      <span className="shrink-0">Beban:</span>
                                      <div className="flex-1 bg-coffee-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          style={{ width: `${expWidth}%` }}
                                          className="bg-rose-500 h-full rounded-full"
                                        />
                                      </div>
                                      <span className="font-medium text-rose-800 shrink-0 whitespace-nowrap">{formatPrice(point.expenses)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Expense Distribution Card */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-coffee-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h4 className="font-bold text-coffee-950 text-base flex items-center gap-2 min-w-0">
                          <PieChartIcon size={18} className="text-rose-600 shrink-0" />
                          <span>Distribusi Beban Operasional</span>
                        </h4>
                        <button
                          onClick={handleOpenCreateExpense}
                          className="text-xs text-rose-700 font-semibold hover:underline shrink-0 whitespace-nowrap"
                        >
                          + Tambah
                        </button>
                      </div>
                      <p className="text-xs text-coffee-500 mb-5">
                        Komposisi pengeluaran kafe pada periode ini (Total: {formatPrice(summary.total_expenses)}).
                      </p>

                      {data?.expenses_by_category && data.expenses_by_category.length > 0 ? (
                        <div className="space-y-4">
                          {data.expenses_by_category.map((cat) => (
                            <div key={cat.key} className="space-y-1.5">
                              <div className="flex justify-between items-center gap-2 text-xs">
                                <span className="font-semibold text-coffee-800 min-w-0">{cat.label}</span>
                                <span className="font-bold text-coffee-950 shrink-0 whitespace-nowrap">
                                  {formatPrice(cat.amount)} ({cat.percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-coffee-100 rounded-full h-2 overflow-hidden">
                                <div
                                  style={{ width: `${cat.percentage}%` }}
                                  className="bg-rose-500 h-full rounded-full transition-all"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-coffee-400 text-xs">
                          Belum ada pengeluaran operasional pada periode ini.
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-coffee-100 text-xs text-coffee-500 flex flex-wrap items-center justify-between gap-2">
                      <span>Kelola Beban Harian</span>
                      <button
                        onClick={() => setActiveTab('expenses')}
                        className="font-semibold text-coffee-900 hover:underline flex items-center gap-1"
                      >
                        Buka Manajemen Beban <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCT PROFITABILITY (MENU MARGIN ANALYSIS) */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-coffee-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-coffee-950">
                      Analisis Margin &amp; Profitabilitas Menu
                    </h3>
                    <p className="text-xs text-coffee-500 mt-0.5">
                      Lihat omzet, estimasi HPP bahan baku per porsi, laba kotor, dan margin keuntungan dari setiap menu.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72 no-print print:hidden">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                    <input
                      type="text"
                      placeholder="Cari produk atau kategori..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-coffee-50 border border-coffee-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-coffee-500"
                    />
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-coffee-400 text-sm">
                    Tidak ada data penjualan produk untuk kriteria ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-coffee-50/80 text-coffee-600 font-semibold uppercase tracking-wider border-b border-coffee-100 text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl min-w-[180px]">Nama Produk</th>
                          <th className="py-3 px-4 whitespace-nowrap">Kategori</th>
                          <th className="py-3 px-4 text-center whitespace-nowrap">Terjual</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Harga Jual</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">HPP Satuan</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Total Omzet</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Total HPP</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Laba Kotor</th>
                          <th className="py-3 px-4 text-center rounded-r-xl whitespace-nowrap">Gross Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coffee-50">
                        {filteredProducts.map((p) => {
                          const isHighMargin = p.margin_pct >= 70;
                          const isMediumMargin = p.margin_pct >= 50 && p.margin_pct < 70;

                          return (
                            <tr key={p.id} className="hover:bg-coffee-50/50 transition-colors">
                              <td className="py-3 px-4 font-bold text-coffee-950 min-w-[180px]">
                                {p.name}
                              </td>
                              <td className="py-3 px-4 text-coffee-500 font-medium whitespace-nowrap">
                                {p.category}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-coffee-800 whitespace-nowrap">
                                {p.quantity_sold}x
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-coffee-700 whitespace-nowrap font-mono">
                                {formatPrice(p.unit_price)}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-amber-800 whitespace-nowrap font-mono">
                                {formatPrice(p.unit_cost)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-coffee-950 whitespace-nowrap font-mono">
                                {formatPrice(p.total_revenue)}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-amber-900 whitespace-nowrap font-mono">
                                {formatPrice(p.total_cogs)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap font-mono">
                                {formatPrice(p.gross_profit)}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    isHighMargin
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isMediumMargin
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {p.margin_pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EXPENSES MANAGEMENT */}
            {activeTab === 'expenses' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-coffee-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-coffee-950">
                      Manajemen Beban Operasional Kafe
                    </h3>
                    <p className="text-xs text-coffee-500 mt-0.5">
                      Catat seluruh beban operasional seperti listrik, internet, gaji barista, sewa ruko, packaging, dll.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenCreateExpense}
                    className="no-print print:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-coffee-900 hover:bg-coffee-950 text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 w-full sm:w-auto self-start sm:self-auto"
                  >
                    <Plus size={16} /> Catat Pengeluaran Baru
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 no-print print:hidden">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                    <input
                      type="text"
                      placeholder="Cari nomor, judul, atau catatan..."
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-coffee-50 border border-coffee-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-coffee-500"
                    />
                  </div>

                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-coffee-50 border border-coffee-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-coffee-500 text-coffee-700"
                  >
                    <option value="">Semua Kategori Beban</option>
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingExpenses ? (
                  <div className="py-16 text-center text-coffee-500 text-sm">
                    Memuat daftar beban operasional...
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="py-16 text-center text-coffee-400 text-sm">
                    Belum ada data pengeluaran operasional yang sesuai.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-coffee-50/80 text-coffee-600 font-semibold uppercase tracking-wider border-b border-coffee-100 text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">No. Pengeluaran</th>
                          <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                          <th className="py-3 px-4 whitespace-nowrap min-w-[170px]">Kategori</th>
                          <th className="py-3 px-4 min-w-[220px]">Keterangan &amp; Judul</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Nominal</th>
                          <th className="py-3 px-4 whitespace-nowrap">Dicatat Oleh</th>
                          <th className="py-3 px-4 text-center rounded-r-xl whitespace-nowrap no-print print:hidden">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coffee-50">
                        {filteredExpenses.map((exp) => {
                          const catMeta = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.lainnya;

                          return (
                            <tr key={exp.id} className="hover:bg-coffee-50/50 transition-colors print-avoid-break">
                              <td className="py-3 px-4 font-mono font-bold text-coffee-950 whitespace-nowrap">
                                {exp.expense_number}
                              </td>
                              <td className="py-3 px-4 text-coffee-600 font-medium whitespace-nowrap">
                                {formatDisplayDate(exp.expense_date)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border shadow-2xs ${catMeta.color}`}>
                                  {catMeta.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 min-w-[220px] max-w-sm">
                                <span className="font-bold text-coffee-950 block">{exp.title}</span>
                                {exp.notes && (
                                  <span className="text-coffee-500 text-[11px] block mt-0.5 truncate max-w-xs" title={exp.notes}>
                                    {exp.notes}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-rose-700 text-sm whitespace-nowrap font-mono">
                                {formatPrice(exp.amount)}
                              </td>
                              <td className="py-3 px-4 text-coffee-600 whitespace-nowrap font-medium">
                                {exp.creator?.name || 'Admin'}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap no-print print:hidden">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditExpense(exp)}
                                    title="Edit Beban"
                                    className="p-1.5 text-coffee-500 hover:text-coffee-900 hover:bg-coffee-100 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(exp.id)}
                                    title="Hapus Beban"
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: RECENT ORDERS WITH MARGIN BREAKDOWN */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-coffee-100">
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-bold font-display text-coffee-950">
                    Margin Pesanan Selesai Terbaru
                  </h3>
                  <p className="text-xs text-coffee-500 mt-0.5">
                    Rincian margin kotor per transaksi yang diselesaikan pada periode ini.
                  </p>
                </div>

                {!data?.recent_orders || data.recent_orders.length === 0 ? (
                  <div className="py-16 text-center text-coffee-400 text-sm">
                    Belum ada transaksi selesai pada periode ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-coffee-50/80 text-coffee-600 font-semibold uppercase tracking-wider border-b border-coffee-100 text-[11px]">
                          <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">No. Pesanan</th>
                          <th className="py-3 px-4 whitespace-nowrap">Waktu</th>
                          <th className="py-3 px-4 min-w-[140px]">Pelanggan</th>
                          <th className="py-3 px-4 whitespace-nowrap">Metode Bayar</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Total Bayar</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">HPP Bahan</th>
                          <th className="py-3 px-4 text-right whitespace-nowrap">Laba Kotor</th>
                          <th className="py-3 px-4 text-center rounded-r-xl whitespace-nowrap">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coffee-50">
                        {data.recent_orders.map((o) => (
                          <tr key={o.id} className="hover:bg-coffee-50/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-coffee-950 whitespace-nowrap">
                              {o.order_number}
                            </td>
                            <td className="py-3 px-4 text-coffee-600 whitespace-nowrap">
                              {o.date}
                            </td>
                            <td className="py-3 px-4 text-coffee-800 font-medium min-w-[140px]">
                              {o.customer_name}
                            </td>
                            <td className="py-3 px-4 capitalize text-coffee-600 font-medium whitespace-nowrap">
                              {o.payment_method}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-coffee-950 whitespace-nowrap font-mono">
                              {formatPrice(o.total)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-amber-800 whitespace-nowrap font-mono">
                              {formatPrice(o.cogs)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap font-mono">
                              {formatPrice(o.gross_profit)}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                {o.margin_pct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: CATAT / EDIT BEBAN OPERASIONAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-coffee-100 mb-5 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold font-display text-coffee-950">
                  {editingExpense ? 'Edit Beban Operasional' : 'Catat Beban Operasional Baru'}
                </h3>
                <p className="text-xs text-coffee-500 mt-0.5">
                  Masukkan biaya pengeluaran operasional kafe
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-coffee-400 hover:text-coffee-900 rounded-lg shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {expenseError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{expenseError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">
                  Kategori Beban
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  required
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">
                  Judul Pengeluaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tagihan Listrik PLN Oktober"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-coffee-700 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 1500000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 font-bold text-coffee-950"
                    required
                  />
                  {expenseForm.amount > 0 && (
                    <span className="block mt-1 text-[11px] font-semibold text-emerald-700">
                      {formatPrice(expenseForm.amount)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-coffee-700 mb-1">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Catatan detail faktur, vendor, atau keperluan pengeluaran..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 resize-none"
                />
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-coffee-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-coffee-600 hover:bg-coffee-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-5 py-2.5 bg-coffee-900 hover:bg-coffee-950 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md"
                >
                  {submittingExpense ? 'Menyimpan...' : editingExpense ? 'Perbarui Beban' : 'Simpan Beban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h4 className="text-lg font-bold text-coffee-950 mb-2">Hapus Pengeluaran Ini?</h4>
            <p className="text-xs text-coffee-500 mb-6">
              Data beban operasional yang dihapus akan langsung memperbarui laporan laba rugi.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-coffee-600 hover:bg-coffee-50 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteExpense(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: EXPORT LAPORAN KEUANGAN BULANAN EXCEL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-coffee-100 mb-5 sm:mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold font-display text-coffee-950">
                    Export Excel Bulanan (.xlsx)
                  </h3>
                  <p className="text-xs text-coffee-500">
                    Generate file Excel laporan keuangan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-coffee-400 hover:text-coffee-900 rounded-lg shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExportSpecificMonth} className="space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 size={15} /> Format File XLSX Multi-Sheet:
                </p>
                <ul className="list-disc list-inside text-emerald-700 text-[11px] space-y-0.5 pt-1">
                  <li>Sheet 1: Laporan Laba Rugi &amp; Ringkasan KPI</li>
                  <li>Sheet 2: Analisis Margin per Menu Produk</li>
                  <li>Sheet 3: Rincian Beban Operasional</li>
                  <li>Sheet 4: Transaksi Penjualan Lengkap</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">
                  Pilih Bulan
                </label>
                <select
                  value={selectedExportMonth}
                  onChange={(e) => setSelectedExportMonth(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 font-medium"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">
                  Pilih Tahun
                </label>
                <select
                  value={selectedExportYear}
                  onChange={(e) => setSelectedExportYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 font-medium"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-coffee-100">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-coffee-600 hover:bg-coffee-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={exportingExcel}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {exportingExcel ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {exportingExcel ? 'Mengunduh...' : 'Download File (.xlsx)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

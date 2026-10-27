import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, ArrowUpRight, AlertTriangle, X, Check, RefreshCw } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  name: '',
  code: '',
  unit: 'gram',
  stock: 0,
  min_stock: 100,
  cost_per_unit: 0,
};

const commonUnits = ['gram', 'ml', 'pcs', 'kg', 'liter', 'botol', 'sachet'];

export default function LogisticsIngredients() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Form Modal (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Restock Modal
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restocking, setRestocking] = useState(false);

  const fetchIngredients = () => {
    setLoading(true);
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (lowStockOnly) params.low_stock_only = true;

    api.get('/ingredients', { params })
      .then((r) => setIngredients(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIngredients();
  }, [lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIngredients();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      code: item.code || '',
      unit: item.unit,
      stock: item.stock,
      min_stock: item.min_stock,
      cost_per_unit: item.cost_per_unit || 0,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (editingId) {
        await api.put(`/ingredients/${editingId}`, {
          name: form.name,
          code: form.code || null,
          unit: form.unit,
          min_stock: Number(form.min_stock),
          cost_per_unit: Number(form.cost_per_unit),
        });
      } else {
        await api.post('/ingredients', {
          name: form.name,
          code: form.code || null,
          unit: form.unit,
          stock: Number(form.stock),
          min_stock: Number(form.min_stock),
          cost_per_unit: Number(form.cost_per_unit),
        });
      }
      setShowModal(false);
      fetchIngredients();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan bahan baku.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus bahan baku "${name}"?`)) return;
    try {
      await api.delete(`/ingredients/${id}`);
      fetchIngredients();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus bahan.');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockModal || !restockQty) return;
    setRestocking(true);

    try {
      await api.post(`/ingredients/${restockModal.id}/restock`, {
        quantity: Number(restockQty),
        type: 'in',
        notes: restockNotes.trim() || 'Restock bahan baku masuk',
      });
      setRestockModal(null);
      setRestockQty('');
      setRestockNotes('');
      fetchIngredients();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal restock bahan.');
    } finally {
      setRestocking(false);
    }
  };

  const role = user?.role || 'logistics';

  return (
    <DashboardLayout title="Kelola Bahan Baku (Inventory)" role={role}>
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-coffee-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-coffee-400 focus-within:border-transparent transition-all">
              <Search size={18} className="shrink-0 text-coffee-400" />
              <input
                type="text"
                placeholder="Cari bahan baku atau kode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-coffee-900 placeholder:text-coffee-400 focus:outline-none text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); }}
                  className="text-coffee-400 hover:text-coffee-600 transition-colors shrink-0"
                  title="Hapus pencarian"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2 bg-coffee-900 text-white rounded-xl text-sm font-medium hover:bg-coffee-800 transition-colors shadow-sm shrink-0">
              Cari
            </button>
          </form>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                lowStockOnly
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-coffee-700 hover:bg-coffee-50 border border-coffee-200'
              }`}
            >
              <AlertTriangle size={15} />
              {lowStockOnly ? 'Semua Bahan' : 'Hanya Stok Menipis'}
            </button>

            <button
              onClick={openCreate}
              className="btn-primary flex items-center gap-2 text-sm shadow-sm"
            >
              <Plus size={16} /> Tambah Bahan Baru
            </button>

            <button
              onClick={fetchIngredients}
              className="p-2.5 bg-white border border-coffee-200 text-coffee-600 hover:bg-coffee-50 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Ingredients Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : ingredients.length === 0 ? (
            <div className="text-center py-16 text-coffee-400">
              <p className="font-medium text-coffee-700">Tidak ada data bahan baku.</p>
              <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau tambah bahan baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-coffee-50/60 border-b border-coffee-100 text-xs font-semibold text-coffee-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Bahan Baku</th>
                    <th className="py-3.5 px-6">Kode</th>
                    <th className="py-3.5 px-6">Satuan</th>
                    <th className="py-3.5 px-6">Stok Saat Ini</th>
                    <th className="py-3.5 px-6">Batas Minimum</th>
                    <th className="py-3.5 px-6">Estimasi Harga</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-50 text-sm">
                  {ingredients.map((item) => {
                    const isLow = Number(item.stock) <= Number(item.min_stock);
                    return (
                      <tr key={item.id} className="hover:bg-coffee-50/40 transition-colors">
                        <td className="py-4 px-6 font-medium text-coffee-900">
                          {item.name}
                        </td>
                        <td className="py-4 px-6 text-coffee-500 font-mono text-xs">
                          {item.code || '-'}
                        </td>
                        <td className="py-4 px-6 text-coffee-600">
                          <span className="px-2.5 py-1 bg-coffee-100 text-coffee-800 rounded-md text-xs font-semibold">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isLow ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isLow && <AlertTriangle size={13} />}
                            {Number(item.stock).toLocaleString('id-ID')} {item.unit}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-coffee-500">
                          {Number(item.min_stock).toLocaleString('id-ID')} {item.unit}
                        </td>
                        <td className="py-4 px-6 text-coffee-600 text-xs">
                          {item.cost_per_unit > 0 ? formatPrice(item.cost_per_unit) + '/' + item.unit : '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setRestockModal(item);
                                setRestockQty('');
                                setRestockNotes('');
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                              title="Tambah stok barang masuk"
                            >
                              <ArrowUpRight size={14} /> Restock
                            </button>
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 text-coffee-500 hover:text-coffee-900 hover:bg-coffee-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
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
      </div>

      {/* Modal Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-coffee-100 mb-5">
              <h3 className="font-semibold text-lg text-coffee-900">
                {editingId ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-coffee-400 hover:text-coffee-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <p className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {formError}
              </p>
            )}

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  placeholder="Contoh: Biji Kopi Espresso, Susu UHT, Cup 16oz"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-coffee-700 mb-1">Kode Bahan (SKU)</label>
                  <input
                    type="text"
                    placeholder="Contoh: BB-KPI-01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input-field text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-coffee-700 mb-1">Satuan Ukuran *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="input-field text-sm capitalize"
                    required
                  >
                    {commonUnits.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!editingId && (
                  <div>
                    <label className="block text-xs font-semibold text-coffee-700 mb-1">Stok Awal ({form.unit}) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="input-field text-sm"
                      required
                    />
                  </div>
                )}
                <div className={editingId ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-coffee-700 mb-1">Batas Minimum Stok ({form.unit}) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Peringatan jika sisa kurang dari ini"
                    value={form.min_stock}
                    onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                    className="input-field text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">Estimasi Harga Beli per {form.unit} (Rp)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Contoh: 250 untuk Rp 250/gram"
                  value={form.cost_per_unit}
                  onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
                  className="input-field text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-coffee-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-coffee-200 text-coffee-700 rounded-xl text-sm font-medium hover:bg-coffee-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Quick Modal */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-coffee-100 mb-4">
              <div>
                <h3 className="font-semibold text-coffee-900">Restock Bahan Masuk</h3>
                <p className="text-xs text-coffee-500">{restockModal.name} (Stok Saat Ini: {Number(restockModal.stock).toLocaleString('id-ID')} {restockModal.unit})</p>
              </div>
              <button onClick={() => setRestockModal(null)} className="text-coffee-400 hover:text-coffee-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">
                  Jumlah Tambahan Masuk ({restockModal.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder={`Masukkan jumlah ${restockModal.unit} yang masuk`}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="input-field text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1">
                  Keterangan / Sumber Barang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kiriman dari Suplier Kopi Jaya, PO #123"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-coffee-100">
                <button
                  type="button"
                  onClick={() => setRestockModal(null)}
                  className="px-4 py-2 border border-coffee-200 text-coffee-700 rounded-xl text-sm font-medium hover:bg-coffee-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={restocking || !restockQty}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {restocking ? 'Menyimpan...' : 'Konfirmasi Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

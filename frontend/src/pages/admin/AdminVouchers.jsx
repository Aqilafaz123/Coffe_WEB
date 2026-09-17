import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

const emptyForm = {
  code: '', description: '', type: 'percent', value: '', min_order: 0,
  max_uses: '', expires_at: '', is_active: true,
};

function formatDiscount(v) {
  return v.type === 'percent' ? `${v.value}%` : formatPrice(v.value);
}

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = () => {
    api.get('/vouchers').then((r) => setVouchers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVouchers(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };

  const openEdit = (v) => {
    setForm({
      code: v.code,
      description: v.description || '',
      type: v.type,
      value: v.value,
      min_order: v.min_order || 0,
      max_uses: v.max_uses || '',
      expires_at: v.expires_at ? v.expires_at.slice(0, 10) : '',
      is_active: v.is_active,
    });
    setEditing(v.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      code: form.code.toUpperCase(),
      value: Number(form.value),
      min_order: Number(form.min_order) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    };
    if (editing) {
      await api.put(`/vouchers/${editing}`, data);
    } else {
      await api.post('/vouchers', data);
    }
    setShowModal(false);
    fetchVouchers();
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus voucher ini?')) return;
    await api.delete(`/vouchers/${id}`);
    fetchVouchers();
  };

  return (
    <DashboardLayout title="Kelola Voucher" role="superadmin">
      <div className="flex justify-end mb-6">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Tambah Voucher
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-coffee-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Kode</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Diskon</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Min. Belanja</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Terpakai</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-coffee-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-coffee-50/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-coffee-900">{v.code}</p>
                    <p className="text-xs text-coffee-500">{v.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{formatDiscount(v)}</td>
                  <td className="px-6 py-4 text-sm">{formatPrice(v.min_order)}</td>
                  <td className="px-6 py-4 text-sm">{v.used_count}{v.max_uses ? ` / ${v.max_uses}` : ''}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${v.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {v.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(v)} className="p-2 text-coffee-500 hover:text-coffee-900"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Voucher' : 'Tambah Voucher'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="Kode voucher *"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="input-field uppercase"
                required
              />
              <input
                placeholder="Deskripsi"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
              />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="percent">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
              <input
                type="number"
                placeholder={form.type === 'percent' ? 'Persentase diskon (1-100) *' : 'Nominal diskon (Rp) *'}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="input-field"
                min={1}
                max={form.type === 'percent' ? 100 : undefined}
                step="1"
                required
              />
              <input
                type="number"
                placeholder="Minimal belanja (Rp)"
                value={form.min_order}
                onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                className="input-field"
                min="0"
              />
              <input
                type="number"
                placeholder="Maks. pemakaian (kosongkan = unlimited)"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                className="input-field"
                min="1"
              />
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="input-field"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Aktif
              </label>
              <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Simpan'}</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

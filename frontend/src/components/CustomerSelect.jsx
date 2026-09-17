import { useEffect, useState } from 'react';
import { Search, User, UserPlus } from 'lucide-react';
import api from '../lib/api';

const emptyCreateForm = { name: '', email: '', phone: '', password: 'password' };

const MODES = [
  { id: 'registered', label: 'Terdaftar' },
  { id: 'guest', label: 'Walk-in' },
  { id: 'create', label: 'Buat Akun' },
];

export default function CustomerSelect({ value, onChange }) {
  const [mode, setMode] = useState(value?.type === 'guest' ? 'guest' : 'registered');
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [guestName, setGuestName] = useState(value?.type === 'guest' ? value.name : '');
  const [guestPhone, setGuestPhone] = useState(value?.type === 'guest' ? value.phone || '' : '');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (mode !== 'registered') return;

    const timer = setTimeout(() => {
      setLoading(true);
      api.get('/customers', { params: search ? { search } : {} })
        .then((r) => setCustomers(r.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, mode]);

  const selectedRegistered = value?.type === 'user' ? value : null;

  const handleGuestConfirm = () => {
    const name = guestName.trim();
    if (!name) return;
    onChange({ type: 'guest', name, phone: guestPhone.trim() || null });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    onChange(null);
    setSearch('');
    setGuestName('');
    setGuestPhone('');
    setCreateForm(emptyCreateForm);
    setCreateError('');
    setOpen(false);
  };

  const handleCreateAccount = async () => {
    setCreateError('');
    setCreating(true);
    try {
      const { data } = await api.post('/customers', createForm);
      onChange({ type: 'user', id: data.id, name: data.name, email: data.email, phone: data.phone });
      setMode('registered');
      setCreateForm(emptyCreateForm);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setCreateError(errors ? Object.values(errors).flat().join(', ') : err.response?.data?.message || 'Gagal membuat akun.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pb-5 border-b border-coffee-100">
      <p className="text-sm font-medium text-coffee-800 mb-3">
        Pelanggan <span className="text-red-500">*</span>
      </p>

      <div className="flex p-1 bg-coffee-100 rounded-xl mb-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => switchMode(m.id)}
            className={`flex-1 py-2.5 px-1 text-center text-xs sm:text-sm font-medium rounded-lg transition-all ${
              mode === m.id
                ? 'bg-white text-coffee-900 shadow-sm'
                : 'text-coffee-600 hover:text-coffee-800'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'create' ? (
        <div className="space-y-3">
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Nama lengkap *"
            className="input-field text-sm"
          />
          <input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="Email *"
            className="input-field text-sm"
          />
          <input
            type="text"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            placeholder="No. telepon (opsional)"
            className="input-field text-sm"
          />
          <input
            type="text"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Password awal *"
            className="input-field text-sm"
          />
          <p className="text-xs text-coffee-500">Beritahu pelanggan email & password untuk login.</p>
          {createError && <p className="text-red-600 text-sm">{createError}</p>}
          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={creating || !createForm.name.trim() || !createForm.email.trim() || !createForm.password}
            className="w-full py-2.5 rounded-xl bg-coffee-900 text-white text-sm font-medium hover:bg-coffee-800 disabled:opacity-50"
          >
            {creating ? 'Membuat akun...' : 'Buat Akun & Pilih'}
          </button>
        </div>
      ) : mode === 'guest' ? (
        value?.type === 'guest' ? (
          <SelectedCard
            icon={<UserPlus size={16} className="text-amber-700" />}
            iconBg="bg-amber-100"
            title={value.name}
            subtitle={`Walk-in${value.phone ? ` · ${value.phone}` : ''}`}
            onClear={() => onChange(null)}
          />
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={guestName}
              onChange={(e) => {
                const name = e.target.value;
                setGuestName(name);
                if (name.trim()) {
                  onChange({ type: 'guest', name: name.trim(), phone: guestPhone.trim() || null });
                } else {
                  onChange(null);
                }
              }}
              placeholder="Nama pelanggan *"
              className="input-field text-sm"
            />
            <input
              type="text"
              value={guestPhone}
              onChange={(e) => {
                const phone = e.target.value;
                setGuestPhone(phone);
                if (guestName.trim()) {
                  onChange({ type: 'guest', name: guestName.trim(), phone: phone.trim() || null });
                }
              }}
              placeholder="No. telepon (opsional)"
              className="input-field text-sm"
            />
            <button
              type="button"
              onClick={handleGuestConfirm}
              disabled={!guestName.trim()}
              className="w-full py-2.5 rounded-xl bg-coffee-900 text-white text-sm font-medium hover:bg-coffee-800 disabled:opacity-50"
            >
              Gunakan Nama Ini
            </button>
          </div>
        )
      ) : selectedRegistered ? (
        <SelectedCard
          icon={<User size={16} className="text-coffee-700" />}
          iconBg="bg-coffee-200"
          title={selectedRegistered.name}
          subtitle={selectedRegistered.email}
          onClear={() => { onChange(null); setOpen(true); }}
        />
      ) : (
        <div className="relative">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-coffee-200 bg-coffee-50 focus-within:ring-2 focus-within:ring-coffee-400 focus-within:border-transparent transition-all">
            <Search size={18} className="shrink-0 text-coffee-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Cari pelanggan..."
              className="flex-1 min-w-0 bg-transparent text-sm text-coffee-900 placeholder:text-coffee-400 focus:outline-none"
            />
          </div>

          {open && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-coffee-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-coffee-500 text-center">Mencari...</p>
              ) : customers.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-sm text-coffee-500">Tidak ditemukan</p>
                  <button type="button" onClick={() => switchMode('create')} className="text-coffee-900 text-sm font-medium hover:underline">
                    Buat akun baru
                  </button>
                  <button type="button" onClick={() => switchMode('guest')} className="block w-full text-coffee-600 text-sm hover:underline">
                    Input walk-in
                  </button>
                </div>
              ) : (
                customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      onChange({ type: 'user', id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
                      setOpen(false);
                      setSearch('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-coffee-50 text-left border-b border-coffee-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center shrink-0">
                      <User size={14} className="text-coffee-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-coffee-900 truncate">{customer.name}</p>
                      <p className="text-xs text-coffee-500 truncate">{customer.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectedCard({ icon, iconBg, title, subtitle, onClear }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-coffee-50 rounded-xl border border-coffee-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-coffee-900 text-sm truncate">{title}</p>
          <p className="text-coffee-500 text-xs truncate">{subtitle}</p>
        </div>
      </div>
      <button type="button" onClick={onClear} className="text-coffee-600 text-sm hover:text-coffee-900 shrink-0">
        Ganti
      </button>
    </div>
  );
}

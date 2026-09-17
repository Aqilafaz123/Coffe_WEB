import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/api';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomerSelect from '../components/CustomerSelect';

export default function Cart() {
  const { items, updateQuantity, updateItemNotes, removeItem, clearCart, total, getCartKey, orderForUser, setOrderForUser } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableLocation, setTableLocation] = useState('');
  const navigate = useNavigate();

  const isStaff = user?.role === 'cashier' || user?.role === 'superadmin';

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (isStaff && !orderForUser) {
      setError('Pilih atau isi nama pelanggan terlebih dahulu.');
      return;
    }

    if (!tableLocation.trim()) {
      setError('Isi nomor meja atau nama ruangan terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const itemNotes = items
        .filter((i) => i.notes)
        .map((i) => `${i.product.name} (x${i.quantity}): ${i.notes}`)
        .join('\n');

      const payload = {
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        notes: itemNotes || null,
        table_location: tableLocation.trim(),
      };

      if (isStaff) {
        if (orderForUser.type === 'user') {
          payload.user_id = orderForUser.id;
        } else {
          payload.guest_name = orderForUser.name;
          if (orderForUser.phone) payload.guest_phone = orderForUser.phone;
        }
      }

      const { data: order } = await api.post('/orders', payload);
      clearCart();
      navigate(`/pembayaran/${order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-coffee-900 mb-2">
            {isStaff ? 'Pesan untuk Pelanggan' : 'Keranjang Belanja'}
          </h1>
          {isStaff && (
            <p className="text-coffee-500 text-sm mb-8">Buat pesanan atas nama pelanggan</p>
          )}
          {!isStaff && <div className="mb-8" />}

          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={48} className="mx-auto text-coffee-300 mb-4" />
              <p className="text-coffee-500 mb-6">Keranjang kosong</p>
              <Link to="/shop" className="btn-primary">Mulai Belanja</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                {items.map((item) => {
                  const { product, quantity, notes: itemNotes } = item;
                  const cartKey = getCartKey(item);
                  return (
                    <div key={cartKey} className="bg-white rounded-2xl p-4">
                      <div className="flex gap-4 items-center">
                        <img src={product.image} alt={product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-coffee-900">{product.name}</h3>
                          <p className="text-coffee-500 text-sm">{formatPrice(product.price)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => updateQuantity(cartKey, quantity - 1)} className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center hover:bg-coffee-200">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <button onClick={() => updateQuantity(cartKey, quantity + 1)} className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center hover:bg-coffee-200">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(cartKey)} className="text-red-400 hover:text-red-600 p-2 shrink-0">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={itemNotes || ''}
                        onChange={(e) => updateItemNotes(cartKey, e.target.value)}
                        placeholder="Catatan item (opsional) — kurang manis, extra panas..."
                        className="input-field text-sm mt-3"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden md:sticky md:top-24 h-fit">
                {isStaff && (
                  <div className="p-5">
                    <CustomerSelect value={orderForUser} onChange={setOrderForUser} />
                  </div>
                )}

                <div className={`p-5 space-y-5 ${isStaff ? 'border-t border-coffee-100' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-coffee-800 mb-2">Lokasi Pengantaran</p>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-coffee-200 bg-coffee-50 focus-within:ring-2 focus-within:ring-coffee-400 focus-within:border-transparent transition-all">
                      <MapPin size={18} className="shrink-0 text-coffee-400" />
                      <input
                        type="text"
                        value={tableLocation}
                        onChange={(e) => setTableLocation(e.target.value)}
                        placeholder="Meja 5, Ruang VIP A"
                        className="flex-1 min-w-0 bg-transparent text-sm text-coffee-900 placeholder:text-coffee-400 focus:outline-none"
                        required
                      />
                    </div>
                    <p className="text-xs text-coffee-400 mt-2">Pelayan mengantar ke meja/ruangan ini</p>
                  </div>

                  <div className="pt-4 border-t border-coffee-100">
                    <p className="text-sm font-medium text-coffee-800 mb-3">Ringkasan Pesanan</p>
                    <div className="flex justify-between text-sm text-coffee-600 mb-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-3 border-t border-coffee-100">
                      <span className="text-coffee-900">Total</span>
                      <span className="text-coffee-900">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button onClick={handleCheckout} disabled={loading} className="btn-primary w-full disabled:opacity-50">
                    {loading ? 'Memproses...' : 'Lanjut ke Pembayaran'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

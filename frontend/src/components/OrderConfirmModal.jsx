import { useState } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../lib/api';

export default function OrderConfirmModal({ product, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const subtotal = product.price * quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ quantity, notes: notes.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-up overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-600 hover:bg-coffee-200 transition-colors z-10"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4 p-6 pb-0">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop'}
            alt={product.name}
            className="w-24 h-24 rounded-xl object-cover shrink-0"
          />
          <div className="pt-1">
            <h3 className="font-display text-xl font-semibold text-coffee-900">{product.name}</h3>
            <p className="text-coffee-500 text-sm mt-1 line-clamp-2">{product.description}</p>
            <p className="text-coffee-900 font-semibold mt-2">{formatPrice(product.price)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-3">Jumlah Pesanan</label>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full bg-coffee-100 flex items-center justify-center hover:bg-coffee-200 transition-colors"
              >
                <Minus size={18} />
              </button>
              <span className="text-2xl font-semibold text-coffee-900 w-12 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
                disabled={quantity >= (product.stock ?? 99)}
                className="w-10 h-10 rounded-full bg-coffee-100 flex items-center justify-center hover:bg-coffee-200 transition-colors disabled:opacity-40"
              >
                <Plus size={18} />
              </button>
            </div>
            {product.stock != null && (
              <p className="text-center text-coffee-400 text-xs mt-2">Stok tersedia: {product.stock}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: kurang manis, extra panas, tanpa whipped cream..."
              className="input-field text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-coffee-50 rounded-xl">
            <span className="text-coffee-600 text-sm">Subtotal</span>
            <span className="font-semibold text-coffee-900 text-lg">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-full border-2 border-coffee-200 text-coffee-700 font-medium hover:bg-coffee-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Tambah ke Keranjang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

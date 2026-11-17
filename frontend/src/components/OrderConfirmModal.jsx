import { useState, useMemo } from 'react';
import { X, Minus, Plus, ShoppingBag, Coffee, Sparkles } from 'lucide-react';
import { resolveMediaUrl } from '../lib/media';
import { formatPrice } from '../lib/api';
import {
  isProductCustomizable,
  SUGAR_LEVELS,
  ICE_LEVELS,
  MILK_OPTIONS,
  AVAILABLE_ADDONS,
  calculateCustomizationExtra,
  serializeOptionsForApi,
  getDefaultOptions,
} from '../lib/customization';

export default function OrderConfirmModal({ product, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const customizable = useMemo(() => isProductCustomizable(product), [product]);
  const [options, setOptions] = useState(() => getDefaultOptions(product));

  const extraPerItem = useMemo(
    () => (customizable ? calculateCustomizationExtra(options) : 0),
    [customizable, options]
  );

  const unitPrice = Number(product.price) + extraPerItem;
  const subtotal = unitPrice * quantity;

  const handleSugarChange = (sugarId) => {
    setOptions((prev) => ({ ...prev, sugar: sugarId }));
  };

  const handleIceChange = (iceId) => {
    setOptions((prev) => ({ ...prev, ice: iceId }));
  };

  const handleMilkChange = (milkId) => {
    setOptions((prev) => ({ ...prev, milk: milkId }));
  };

  const handleAddonDelta = (addonId, delta) => {
    setOptions((prev) => {
      const current = prev.addons?.[addonId] || 0;
      const next = Math.max(0, Math.min(5, current + delta));
      return {
        ...prev,
        addons: {
          ...prev.addons,
          [addonId]: next,
        },
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const serializedOptions = customizable ? serializeOptionsForApi(options) : null;
    onConfirm({
      quantity,
      notes: notes.trim(),
      options: serializedOptions,
      unitPrice,
    });
    onClose();
  };

  const isHotDrink =
    (product?.category?.slug || '').includes('hot') ||
    (product?.name || '').toLowerCase().includes('hot') ||
    (product?.name || '').toLowerCase().includes('cappuccino') ||
    (product?.name || '').toLowerCase().includes('lungo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-600 hover:bg-coffee-200 transition-colors z-10"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Header / Product summary */}
        <div className="flex gap-4 p-5 sm:p-6 pb-4 pr-14 border-b border-coffee-100">
          <img
            src={resolveMediaUrl(product.image) || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop'}
            alt={product.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 bg-coffee-50"
          />
          <div className="pt-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg sm:text-xl font-bold text-coffee-900 break-words">{product.name}</h3>
              {customizable && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Coffee size={12} /> Custom
                </span>
              )}
            </div>
            <p className="text-coffee-500 text-xs sm:text-sm mt-1 line-clamp-2">{product.description}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-coffee-900 font-bold text-base sm:text-lg">{formatPrice(unitPrice)}</span>
              {extraPerItem > 0 && (
                <span className="text-xs text-coffee-400 line-through">{formatPrice(product.price)}</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {/* CUSTOMIZABLE DRINKS OPTIONS */}
          {customizable && (
            <div className="space-y-5 bg-coffee-50/70 p-4 sm:p-5 rounded-2xl border border-coffee-100">
              <div className="flex items-center gap-2 text-coffee-900 font-semibold text-sm">
                <Sparkles size={16} className="text-amber-600" />
                <span>Sesuaikan Minuman Anda</span>
              </div>

              {/* 1. Sugar Level */}
              <div>
                <label className="block text-xs font-semibold text-coffee-700 uppercase tracking-wider mb-2">
                  Tingkat Gula (Sugar)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUGAR_LEVELS.map((s) => {
                    const active = options.sugar === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSugarChange(s.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                          active
                            ? 'bg-coffee-900 text-white border-coffee-900 shadow-sm'
                            : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ice Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-coffee-700 uppercase tracking-wider">
                    Tingkat Es (Ice Level)
                  </label>
                  {isHotDrink && (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Standar: Panas / Tanpa Es
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ICE_LEVELS.map((i) => {
                    const active = options.ice === i.id;
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => handleIceChange(i.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                          active
                            ? 'bg-coffee-900 text-white border-coffee-900 shadow-sm'
                            : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                        }`}
                      >
                        {i.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Milk Option */}
              <div>
                <label className="block text-xs font-semibold text-coffee-700 uppercase tracking-wider mb-2">
                  Pilihan Susu (Milk)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MILK_OPTIONS.map((m) => {
                    const active = options.milk === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMilkChange(m.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                          active
                            ? 'bg-coffee-900 text-white border-coffee-900 shadow-sm'
                            : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                        }`}
                      >
                        <div>{m.label}</div>
                        {m.price > 0 && (
                          <div className={`text-[10px] mt-0.5 ${active ? 'text-amber-200' : 'text-amber-700 font-semibold'}`}>
                            +{formatPrice(m.price)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Add-ons with +/- counter */}
              <div>
                <label className="block text-xs font-semibold text-coffee-700 uppercase tracking-wider mb-2">
                  Tambahan / Add-ons (Bisa Tambah / Kurang)
                </label>
                <div className="space-y-2 bg-white p-3 rounded-xl border border-coffee-200">
                  {AVAILABLE_ADDONS.map((addon) => {
                    const count = options.addons?.[addon.id] || 0;
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-coffee-100 last:border-0 text-sm"
                      >
                        <div>
                          <p className="font-medium text-coffee-900 text-xs sm:text-sm">{addon.name}</p>
                          <p className="text-[11px] text-amber-700 font-semibold">+{formatPrice(addon.price)} / porsi</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddonDelta(addon.id, -1)}
                            disabled={count <= 0}
                            className="w-7 h-7 rounded-lg bg-coffee-100 text-coffee-700 flex items-center justify-center hover:bg-coffee-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-6 text-center font-bold text-coffee-900 text-sm">{count}</span>
                          <button
                            type="button"
                            onClick={() => handleAddonDelta(addon.id, 1)}
                            disabled={count >= 5}
                            className="w-7 h-7 rounded-lg bg-coffee-100 text-coffee-700 flex items-center justify-center hover:bg-coffee-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* QUANTITY SECTION */}
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
              <span className="text-2xl font-bold text-coffee-900 w-12 text-center">{quantity}</span>
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

          {/* NOTES FIELD */}
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">Catatan Khusus (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pisahkan es, sedotan kertas..."
              className="input-field text-sm resize-none"
              rows={2}
            />
          </div>

          {/* SUBTOTAL SUMMARY */}
          <div className="flex items-center justify-between py-3 px-4 bg-coffee-50 rounded-2xl border border-coffee-100">
            <div>
              <span className="text-coffee-600 text-sm">Subtotal</span>
              {extraPerItem > 0 && (
                <p className="text-[11px] text-amber-700">Termasuk tambahan {formatPrice(extraPerItem)}/cup</p>
              )}
            </div>
            <span className="font-bold text-coffee-900 text-lg sm:text-xl">{formatPrice(subtotal)}</span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto sm:flex-1 px-4 py-3 rounded-full border-2 border-coffee-200 text-coffee-700 font-medium hover:bg-coffee-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto sm:flex-1 btn-primary flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
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

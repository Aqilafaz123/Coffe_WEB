import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import OrderConfirmModal from './OrderConfirmModal';

export default function ProductCard({ product }) {
  const [liked, setLiked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOrder = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowModal(true);
  };

  const handleConfirm = ({ quantity, notes }) => {
    addItem(product, quantity, notes);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden card-hover group relative">
        {addedToast && (
          <div className="absolute top-3 left-3 right-3 z-10 bg-coffee-900 text-white text-xs font-medium px-3 py-2 rounded-full text-center animate-fade-in">
            Ditambahkan ke keranjang!
          </div>
        )}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <button
            onClick={() => setLiked(!liked)}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              liked ? 'bg-red-500 text-white' : 'bg-white/90 text-coffee-600 hover:bg-white'
            }`}
            aria-label="Favorite"
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold text-coffee-900 mb-1">{product.name}</h3>
          <p className="text-coffee-500 text-sm mb-4 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-coffee-900 font-semibold text-lg">{formatPrice(product.price)}</span>
            <button
              onClick={handleOrder}
              className="flex items-center gap-2 bg-coffee-900 text-white text-sm px-4 py-2 rounded-full hover:bg-coffee-800 transition-colors active:scale-95"
            >
              <ShoppingBag size={14} />
              Order
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <OrderConfirmModal
          product={product}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

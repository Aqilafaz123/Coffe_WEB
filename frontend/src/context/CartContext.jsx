import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    if (!saved) return [];
    return JSON.parse(saved).map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
    }));
  });

  const [orderForUser, setOrderForUser] = useState(() => {
    const saved = localStorage.getItem('orderForUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (orderForUser) {
      localStorage.setItem('orderForUser', JSON.stringify(orderForUser));
    } else {
      localStorage.removeItem('orderForUser');
    }
  }, [orderForUser]);

  const getCartKey = (item) => item.id;

  const addItem = (product, quantity = 1, notes = '') => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && (i.notes || '') === (notes || '')
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && (i.notes || '') === (notes || '')
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { id: crypto.randomUUID(), product, quantity, notes: notes || '' }];
    });
  };

  const removeItem = (cartKey) => {
    setItems((prev) => prev.filter((i) => getCartKey(i) !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity <= 0) {
      removeItem(cartKey);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (getCartKey(i) === cartKey ? { ...i, quantity } : i))
    );
  };

  const updateItemNotes = (cartKey, newNotes) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cartKey ? { ...i, notes: newNotes } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setOrderForUser(null);
  };

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, updateItemNotes, clearCart, total, itemCount, getCartKey,
      orderForUser, setOrderForUser,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

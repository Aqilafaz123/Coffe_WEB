export const PAYMENT_METHODS = [
  { id: 'qris', name: 'QRIS', color: 'bg-red-500', desc: 'Scan QR dengan e-wallet atau m-banking' },
  { id: 'gopay', name: 'GoPay', color: 'bg-green-500', desc: 'Bayar via aplikasi GoPay' },
  { id: 'ovo', name: 'OVO', color: 'bg-purple-500', desc: 'Bayar via aplikasi OVO' },
  { id: 'dana', name: 'DANA', color: 'bg-blue-500', desc: 'Bayar via aplikasi DANA' },
  { id: 'bank_transfer', name: 'Transfer Bank', color: 'bg-coffee-700', desc: 'BCA, Mandiri, BNI, BRI' },
  { id: 'card', name: 'Kartu Debit/Kredit', color: 'bg-indigo-600', desc: 'Visa, Mastercard, JCB' },
  { id: 'cash', name: 'Tunai', color: 'bg-amber-600', desc: 'Bayar langsung di kasir' },
];

export const PAYMENT_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.name]));

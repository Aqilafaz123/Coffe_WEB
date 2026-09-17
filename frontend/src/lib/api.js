import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

async function parseBlobError(blob) {
  try {
    const text = await blob.text();
    const json = JSON.parse(text);
    return json.message || 'Gagal mengunduh struk.';
  } catch {
    return 'Gagal mengunduh struk.';
  }
}

export async function downloadOrderReceipt(orderId, orderNumber) {
  const response = await api.get(`/orders/${orderId}/receipt`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  });

  const blob = response.data;

  if (blob.type?.includes('json')) {
    throw new Error(await parseBlobError(blob));
  }

  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `struk-${orderNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const SNAP_SCRIPT = {
  sandbox: 'https://app.sandbox.midtrans.com/snap/snap.js',
  production: 'https://app.midtrans.com/snap/snap.js',
};

let scriptPromise = null;

export function loadMidtransSnap(isProduction = false) {
  if (window.snap) {
    return Promise.resolve(window.snap);
  }

  if (!scriptPromise) {
    const src = isProduction ? SNAP_SCRIPT.production : SNAP_SCRIPT.sandbox;
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
      script.onload = () => resolve(window.snap);
      script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap.'));
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
}

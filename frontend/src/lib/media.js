export function resolveMediaUrl(value, apiBase = import.meta.env.VITE_API_URL || '/api') {
  if (!value || !value.startsWith('/api/media/')) return value;
  return `${apiBase.replace(/\/$/, '')}/media/${value.slice('/api/media/'.length)}`;
}

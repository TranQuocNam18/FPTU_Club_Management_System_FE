export function getApiErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;

  if (!data) {
    if (err?.code === 'ECONNABORTED') return 'Ket noi API qua lau. Hay kiem tra gateway local port 5000.';
    if (err?.message === 'Network Error') return 'Khong ket noi duoc API gateway local http://localhost:5000.';
    return fallback;
  }

  if (typeof data === 'string' && data) return data;
  if (typeof data.message === 'string' && data.message) return data.message;
  if (typeof data.title === 'string' && data.title) return data.title;
  if (typeof data.detail === 'string' && data.detail) return data.detail;
  if (Array.isArray(data.errors)) return data.errors.join('\n');
  if (data.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join('\n');
  }

  return fallback;
}

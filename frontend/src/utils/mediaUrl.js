const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5004' : '');

/** Turn relative /uploads/... paths into absolute backend URLs. Cloudinary/https URLs pass through. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads') && API_BASE) return `${API_BASE}${url}`;
  return url;
}

export function resolveMediaInObject(obj) {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    obj.forEach(resolveMediaInObject);
    return obj;
  }
  if (typeof obj !== 'object') return obj;

  const keys = [
    'images', 'model3D', 'plan2D', 'image', 'attachmentUrl', 'attachment',
    'fileUrl', 'nationalIdUrl', 'certificateUrl', 'selfieUrl', 'url'
  ];

  for (const key of keys) {
    if (!(key in obj)) continue;
    const val = obj[key];
    if (typeof val === 'string') obj[key] = resolveMediaUrl(val);
    else if (Array.isArray(val)) {
      obj[key] = val.map((item) => (typeof item === 'string' ? resolveMediaUrl(item) : (resolveMediaInObject(item), item)));
    }
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') resolveMediaInObject(val);
  }
  return obj;
}

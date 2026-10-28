import api, { cleanParams } from './api';

export const productService = {
  /** params: q, category, page (0-based), size, sortBy (price|name|createdAt), direction (asc|desc) */
  list: (params) => api.get('/products', { params: cleanParams(params) }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  categories: () => api.get('/products/categories').then((r) => r.data),
  create: (body) => api.post('/products', body).then((r) => r.data),
  update: (id, body) => api.put(`/products/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`),
};

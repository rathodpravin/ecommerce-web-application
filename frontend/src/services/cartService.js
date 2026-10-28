import api from './api';

// Every call returns the full, backend-calculated cart.
export const cartService = {
  get: () => api.get('/cart').then((r) => r.data),
  add: (productId, quantity) => api.post('/cart/items', { productId, quantity }).then((r) => r.data),
  update: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
};

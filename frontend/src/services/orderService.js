import api from './api';

export const orderService = {
  checkout: (shippingAddress) => api.post('/orders/checkout', { shippingAddress }).then((r) => r.data),
  myOrders: (page = 0, size = 10) => api.get('/orders/my-orders', { params: { page, size } }).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  cancel: (id) => api.post(`/orders/${id}/cancel`).then((r) => r.data),
};

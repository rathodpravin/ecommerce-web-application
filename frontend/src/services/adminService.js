import api, { cleanParams } from './api';

export const adminService = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  orders: ({ status, page = 0, size = 10 } = {}) =>
    api.get('/admin/orders', { params: cleanParams({ status, page, size }) }).then((r) => r.data),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
  customers: (page = 0, size = 10) => api.get('/admin/users', { params: { page, size } }).then((r) => r.data),
};

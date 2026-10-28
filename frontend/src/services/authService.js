import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  // Role is never sent: the backend always creates CUSTOMER accounts.
  register: (fullName, email, password) => api.post('/auth/register', { fullName, email, password }).then((r) => r.data),
  me: () => api.get('/users/me').then((r) => r.data),
};

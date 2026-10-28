import api from '../services/api';

/**
 * In-memory stand-in for the Spring Boot API. It mirrors the backend's real
 * endpoints, status codes and JSON shapes (DTO records) so the frontend can be tested without MySQL.
 * It is NOT proof that the real backend behaves identically.
 */
export function installFakeBackend({ products, offline = false } = {}) {
  const now = '2026-10-27T10:00:00';
  const db = {
    nextId: 100,
    users: [{ id: 1, fullName: 'Store Admin', email: 'admin@x.com', password: 'AdminPass1234', role: 'ADMIN', createdAt: now }],
    products: products ?? [
      { id: 1, name: 'Wireless Mouse', description: 'A mouse', price: 799, stockQuantity: 5, category: 'Electronics', imageUrl: null, createdAt: now },
      { id: 2, name: 'Desk Lamp', description: 'A lamp', price: 1200, stockQuantity: 0, category: 'Home', imageUrl: null, createdAt: now },
    ],
    carts: {}, orders: [], calls: [],
  };

  const fail = (status, message, extra = {}) => {
    const err = new Error(message);
    err.isAxiosError = true;
    err.response = { status, data: { status, message, ...extra } };
    throw err;
  };
  const page = (list, params) => {
    const size = Number(params.size ?? 10); const p = Number(params.page ?? 0);
    const content = list.slice(p * size, p * size + size);
    const totalPages = Math.ceil(list.length / size);
    return { content, page: p, size, totalElements: list.length, totalPages, last: p >= totalPages - 1 };
  };
  const toUser = (u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, createdAt: u.createdAt });
  const cartOf = (u) => {
    const items = (db.carts[u.id] ||= []).map((c) => {
      const p = db.products.find((x) => x.id === c.productId);
      return { itemId: c.id, productId: p.id, productName: p.name, imageUrl: p.imageUrl, unitPrice: p.price, quantity: c.quantity, subtotal: p.price * c.quantity, availableStock: p.stockQuantity };
    });
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    return { items, totalItems: items.reduce((s, i) => s + i.quantity, 0), subtotal, total: subtotal };
  };

  const handle = (config) => {
    const method = config.method.toUpperCase();
    const url = config.url;
    const params = config.params || {};
    const body = config.data ? JSON.parse(config.data) : {};
    db.calls.push(`${method} ${url}`);
    if (offline) { const e = new Error('Network Error'); e.isAxiosError = true; throw e; }

    const auth = config.headers.get?.('Authorization') ?? config.headers.Authorization;
    const user = auth ? db.users.find((u) => `Bearer tok-${u.email}` === auth) : null;
    const needUser = () => user || fail(401, 'Authentication required or token expired');
    const needAdmin = () => { needUser(); if (user.role !== 'ADMIN') fail(403, 'You do not have permission to perform this action'); };

    let m;
    if (method === 'POST' && url === '/auth/register') {
      if (body.password.length < 8) fail(400, 'Validation failed', { fieldErrors: { password: 'Password must be 8-72 characters' } });
      if (db.users.some((u) => u.email === body.email)) fail(409, 'An account with this email already exists');
      const u = { id: db.nextId++, fullName: body.fullName, email: body.email, password: body.password, role: 'CUSTOMER', createdAt: now };
      db.users.push(u);
      if ('role' in body) fail(400, 'role must never be sent');
      return { token: `tok-${u.email}`, tokenType: 'Bearer', expiresInSeconds: 3600, user: toUser(u) };
    }
    if (method === 'POST' && url === '/auth/login') {
      const u = db.users.find((x) => x.email === body.email && x.password === body.password);
      if (!u) fail(401, 'Invalid email or password');
      return { token: `tok-${u.email}`, tokenType: 'Bearer', expiresInSeconds: 3600, user: toUser(u) };
    }
    if (method === 'GET' && url === '/users/me') return toUser(needUser());
    if (method === 'GET' && url === '/products/categories') return [...new Set(db.products.map((p) => p.category))];
    if (method === 'GET' && url === '/products') {
      let list = db.products.filter((p) => (!params.q || p.name.toLowerCase().includes(params.q.toLowerCase())) && (!params.category || p.category === params.category));
      if (params.sortBy === 'price') list = [...list].sort((a, b) => (params.direction === 'asc' ? a.price - b.price : b.price - a.price));
      return page(list, params);
    }
    if (method === 'GET' && (m = url.match(/^\/products\/(\d+)$/))) return db.products.find((p) => p.id === +m[1]) ?? fail(404, 'Product not found');
    if (method === 'GET' && url === '/cart') return cartOf(needUser());
    if (method === 'POST' && url === '/cart/items') {
      needUser();
      const p = db.products.find((x) => x.id === body.productId) ?? fail(404, 'Product not found');
      const list = (db.carts[user.id] ||= []);
      const row = list.find((c) => c.productId === p.id);
      const qty = (row?.quantity ?? 0) + body.quantity;
      if (qty > p.stockQuantity) fail(409, `Only ${p.stockQuantity} unit(s) of '${p.name}' available`);
      if (row) row.quantity = qty; else list.push({ id: db.nextId++, productId: p.id, quantity: qty });
      return cartOf(user);
    }
    if (method === 'PUT' && (m = url.match(/^\/cart\/items\/(\d+)$/))) {
      needUser();
      const row = (db.carts[user.id] || []).find((c) => c.id === +m[1]) ?? fail(404, 'Cart item not found');
      const p = db.products.find((x) => x.id === row.productId);
      if (body.quantity > p.stockQuantity) fail(409, `Only ${p.stockQuantity} unit(s) of '${p.name}' available`);
      row.quantity = body.quantity;
      return cartOf(user);
    }
    if (method === 'DELETE' && (m = url.match(/^\/cart\/items\/(\d+)$/))) {
      needUser();
      db.carts[user.id] = (db.carts[user.id] || []).filter((c) => c.id !== +m[1]);
      return cartOf(user);
    }
    if (method === 'POST' && url === '/orders/checkout') {
      needUser();
      const cart = cartOf(user);
      if (!cart.items.length) fail(400, 'Your cart is empty');
      cart.items.forEach((i) => { db.products.find((p) => p.id === i.productId).stockQuantity -= i.quantity; });
      const order = {
        id: db.nextId++, orderNumber: `ORD-20261027-${db.orders.length + 1}ABCDEF`, status: 'PLACED', totalAmount: cart.total,
        shippingAddress: body.shippingAddress, createdAt: now, updatedAt: now, customerName: user.fullName, customerEmail: user.email, ownerId: user.id,
        items: cart.items.map((i, n) => ({ id: n + 1, productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity, subtotal: i.subtotal })),
        paymentNote: 'Order created. No payment has been processed - this application does not charge any payment method.',
      };
      db.orders.push(order);
      db.carts[user.id] = [];
      return order;
    }
    if (method === 'GET' && url === '/orders/my-orders') return page(db.orders.filter((o) => o.ownerId === needUser().id).reverse(), params);
    if (method === 'GET' && (m = url.match(/^\/orders\/(\d+)$/))) {
      needUser();
      return db.orders.find((o) => o.id === +m[1] && o.ownerId === user.id) ?? fail(404, 'Order not found');
    }
    if (method === 'GET' && url === '/admin/dashboard') {
      needAdmin();
      return { totalProducts: db.products.length, totalCustomers: db.users.filter((u) => u.role === 'CUSTOMER').length, totalOrders: db.orders.length,
        totalRevenue: db.orders.reduce((s, o) => s + o.totalAmount, 0), lowStockProducts: 2,
        ordersByStatus: { PLACED: db.orders.length, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 }, recentOrders: db.orders };
    }
    if (method === 'GET' && url === '/admin/users') { needAdmin(); return page(db.users.filter((u) => u.role === 'CUSTOMER').map(toUser), params); }
    return fail(404, `No fake route for ${method} ${url}`);
  };

  api.defaults.adapter = async (config) => {
    const data = handle(config);
    return { data, status: config.method === 'post' ? 201 : 200, statusText: 'OK', headers: {}, config };
  };
  return db;
}

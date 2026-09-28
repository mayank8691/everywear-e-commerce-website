const apiBase = '/api';

export function getSessionId() {
  let sessionId = localStorage.getItem('evara-session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('evara-session', sessionId);
  }
  return sessionId;
}

async function request(path, options) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'The request could not be completed.');
  return body;
}

export const api = {
  products({ search, category, sort, maxPrice, inStockOnly }) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'All') params.set('category', category);
    if (sort) params.set('sort', sort);
    if (maxPrice) params.set('maxPrice', String(maxPrice));
    if (inStockOnly) params.set('inStock', 'true');
    return request(`/products?${params}`);
  },
  register(credentials) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(credentials) });
  },
  login(credentials) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  },
  me() {
    return request('/auth/me');
  },
  logout() {
    return request('/auth/logout', { method: 'POST' });
  },
  cart(sessionId) {
    return request(`/cart/${encodeURIComponent(sessionId)}`);
  },
  addToCart(sessionId, productId) {
    return request(`/cart/${encodeURIComponent(sessionId)}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: 1 }),
    });
  },
  updateCartItem(sessionId, productId, quantity) {
    return request(`/cart/${encodeURIComponent(sessionId)}/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },
  removeCartItem(sessionId, productId) {
    return request(`/cart/${encodeURIComponent(sessionId)}/items/${productId}`, { method: 'DELETE' });
  },
  orders() {
    return request('/orders');
  },
  placeOrder(order) {
    return request('/orders', { method: 'POST', body: JSON.stringify(order) });
  },
  adminDashboard() {
    return request('/admin/dashboard');
  },
  adminProducts() {
    return request('/admin/products');
  },
  createProduct(product) {
    return request('/admin/products', { method: 'POST', body: JSON.stringify(product) });
  },
  updateProduct(productId, product) {
    return request(`/admin/products/${productId}`, { method: 'PATCH', body: JSON.stringify(product) });
  },
  deleteProduct(productId) {
    return request(`/admin/products/${productId}`, { method: 'DELETE' });
  },
  adminOrders() {
    return request('/admin/orders');
  },
  updateOrderStatus(orderId, status) {
    return request(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
};
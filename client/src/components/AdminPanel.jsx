import { useEffect, useState } from 'react';
import { ArrowRight, Box, ClipboardList, LayoutDashboard, Pencil, Plus, Save, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { api } from '../api.js';

const emptyProduct = {
  name: '',
  description: '',
  category: 'Shirts',
  price: '',
  compareAtPrice: '',
  image: '/assets/img/product-1-1.jpg',
  hoverImage: '/assets/img/product-1-2.jpg',
  stock: 1,
  featured: false,
};
const orderStatuses = ['Received', 'Processing', 'Shipped', 'Completed'];
const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

export default function AdminPanel({ user, onLogout, flash, setError, setPage, onCatalogChange }) {
  const [section, setSection] = useState('overview');
  const [dashboard, setDashboard] = useState({ productCount: 0, orderCount: 0, userCount: 0, revenue: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadDashboard() {
    try {
      const [nextDashboard, nextProducts, nextOrders] = await Promise.all([
        api.adminDashboard(),
        api.adminProducts(),
        api.adminOrders(),
      ]);
      setDashboard(nextDashboard);
      setProducts(nextProducts);
      setOrders(nextOrders);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  function editProduct(product) {
    setEditingId(product._id);
    setProductForm({ ...emptyProduct, ...product });
    setShowProductForm(true);
    setSection('products');
  }

  function closeProductForm() {
    setEditingId('');
    setProductForm(emptyProduct);
    setShowProductForm(false);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...productForm,
      price: Number(productForm.price),
      compareAtPrice: productForm.compareAtPrice === '' ? undefined : Number(productForm.compareAtPrice),
      stock: Number(productForm.stock),
    };
    try {
      if (editingId) await api.updateProduct(editingId, payload);
      else await api.createProduct(payload);
      closeProductForm();
      onCatalogChange();
      await loadDashboard();
      flash(editingId ? 'Product updated' : 'Product added');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name} from the catalog?`)) return;
    try {
      await api.deleteProduct(product._id);
      onCatalogChange();
      await loadDashboard();
      flash('Product deleted');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changeOrderStatus(orderId, status) {
    try {
      await api.updateOrderStatus(orderId, status);
      await loadDashboard();
      flash('Order status updated');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const navigation = [
    ['overview', LayoutDashboard, 'Overview'],
    ['products', Box, 'Products'],
    ['orders', ClipboardList, 'Orders'],
  ];

  return (
    <section className="admin-page wrap">
      <div className="admin-heading">
        <div><p className="eyebrow"><ShieldCheck size={14} /> EVERYWEAR CONTROL ROOM</p><h1>Store admin</h1><p>Signed in as {user.name}</p></div>
        <button className="button admin-exit" onClick={onLogout}>Sign out<ArrowRight size={15} /></button>
      </div>
      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Admin sections">
          {navigation.map(([id, Icon, label]) => <button key={id} className={section === id ? 'admin-nav-item active' : 'admin-nav-item'} onClick={() => setSection(id)}><Icon size={17} />{label}</button>)}
          <button className="admin-nav-item storefront-link" onClick={() => setPage('shop')}><ArrowRight size={17} />View storefront</button>
        </nav>
        <div className="admin-content">
          {section === 'overview' && <>
            <div className="admin-section-heading"><div><span className="admin-eyebrow">STORE PERFORMANCE</span><h2>Overview</h2></div><span className="admin-date">Live MongoDB data</span></div>
            <div className="admin-stats">
              <Stat label="Catalog products" value={dashboard.productCount} icon={<Box />} />
              <Stat label="Orders received" value={dashboard.orderCount} icon={<ClipboardList />} />
              <Stat label="Customer accounts" value={dashboard.userCount} icon={<Users />} />
              <Stat label="Order revenue" value={money(dashboard.revenue)} icon={<ShieldCheck />} />
            </div>
            <div className="admin-recent-heading"><h3>Recent orders</h3><button className="text-button" onClick={() => setSection('orders')}>All orders<ArrowRight size={15} /></button></div>
            {orders.length ? <OrderTable orders={orders.slice(0, 5)} onStatus={changeOrderStatus} /> : <p className="admin-empty">Orders placed by customers will appear here.</p>}
          </>}

          {section === 'products' && <>
            <div className="admin-section-heading"><div><span className="admin-eyebrow">CATALOG MANAGEMENT</span><h2>Products <small>{products.length}</small></h2></div><button className="button button-dark" onClick={() => { closeProductForm(); setShowProductForm(true); }}><Plus size={16} /> Add product</button></div>
            {showProductForm && <form className="admin-product-form" onSubmit={saveProduct}>
              <div className="admin-form-heading"><h3>{editingId ? 'Edit product' : 'Add product'}</h3><button type="button" className="icon-button admin-close" onClick={closeProductForm} aria-label="Close product form"><X size={17} /></button></div>
              <div className="admin-product-fields">
                <label>Product name<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label>
                <label>Category<input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} required /></label>
                <label>Description<input value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} required /></label>
                <label>Image path<input value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} placeholder="/assets/img/product-1-1.jpg" required /></label>
                <label>Price ($)<input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required /></label>
                <label>Compare-at price ($)<input type="number" min="0" step="0.01" value={productForm.compareAtPrice ?? ''} onChange={(event) => setProductForm({ ...productForm, compareAtPrice: event.target.value })} /></label>
                <label>Stock<input type="number" min="0" step="1" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required /></label>
                <label className="admin-featured"><input type="checkbox" checked={Boolean(productForm.featured)} onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} />Feature this product</label>
              </div>
              <div className="admin-form-actions"><button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : <><Save size={15} />{editingId ? 'Save changes' : 'Create product'}</>}</button><button className="button admin-cancel" type="button" onClick={closeProductForm}>Cancel</button></div>
            </form>}
            <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
              {products.map((product) => <tr key={product._id}><td><div className="admin-product-name"><img src={product.image} alt="" /><span>{product.name}</span></div></td><td>{product.category}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><div className="admin-row-actions"><button aria-label={`Edit ${product.name}`} onClick={() => editProduct(product)}><Pencil size={15} /></button><button aria-label={`Delete ${product.name}`} onClick={() => deleteProduct(product)}><Trash2 size={15} /></button></div></td></tr>)}
            </tbody></table></div>
          </>}

          {section === 'orders' && <>
            <div className="admin-section-heading"><div><span className="admin-eyebrow">FULFILMENT</span><h2>Orders <small>{orders.length}</small></h2></div></div>
            {orders.length ? <OrderTable orders={orders} onStatus={changeOrderStatus} /> : <p className="admin-empty">There are no orders to fulfil yet.</p>}
          </>}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, icon }) {
  return <div className="admin-stat"><span className="admin-stat-icon">{icon}</span><span className="admin-stat-label">{label}</span><strong>{value}</strong></div>;
}

function OrderTable({ orders, onStatus }) {
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>
    {orders.map((order) => <tr key={order._id}><td><strong>#{order.orderNumber}</strong></td><td>{order.customer?.name || order.user?.name || 'Customer'}<small>{order.customer?.email || order.user?.email}</small></td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>{money(order.total)}</td><td><select className="order-status-select" aria-label={`Status for order ${order.orderNumber}`} value={order.status} onChange={(event) => onStatus(order._id, event.target.value)}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}
  </tbody></table></div>;
}
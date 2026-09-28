import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Check,
  Heart,
  LogOut,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { api, getSessionId } from './api.js';
import AdminPanel from './components/AdminPanel.jsx';
import AuthScreen from './components/AuthScreen.jsx';

const initialCategories = ['Shirts', 'Tops', 'Knitwear', 'Outerwear'];
const sortOptions = [
  ['featured', 'Recommended'],
  ['newest', 'Newest'],
  ['price-low', 'Price: Low to High'],
  ['price-high', 'Price: High to Low'],
];
const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
const imageUrl = (path) => path || '/assets/img/product-1-1.jpg';

function readWishlist() {
  try {
    return JSON.parse(localStorage.getItem('evara-wishlist') || '[]');
  } catch {
    return [];
  }
}

function Header({ page, navigate, cartCount, wishlistCount, category, categoryOptions, onCategory, searchText, setSearchText, onSearch, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['shop', 'Shop']];
  if (user) links.push(['orders', 'Orders'], ['account', 'Account']);
  if (user?.role === 'admin') links.push(['admin', 'Admin']);
  if (!user) links.push(['auth', 'Sign in']);

  return (
    <>
      <div className="announcement">EVERYDAY DEALS <span>•</span> Free delivery on orders over $100</div>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#shop" onClick={() => navigate('shop')} aria-label="Everywear home">
            <span className="brand-mark">e</span><span>everywear</span>
          </a>
          <form className="header-search" onSubmit={onSearch}>
            <Search size={18} />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search products, brands and more" aria-label="Search products" />
            {searchText && <button type="button" aria-label="Clear search" onClick={() => { setSearchText(''); onSearch(null, ''); }}><X size={16} /></button>}
            <button type="submit" aria-label="Submit search"><Search size={17} /></button>
          </form>
          <div className="header-controls">
            <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
              {links.map(([id, label]) => (
                <button className={page === id ? 'nav-link active' : 'nav-link'} key={id} onClick={() => { navigate(id); setMenuOpen(false); }}>
                  {label}
                </button>
              ))}
            </nav>
            <div className="header-actions">
              <button className={page === 'wishlist' ? 'icon-button active' : 'icon-button'} onClick={() => navigate('wishlist')} aria-label={`Wishlist, ${wishlistCount} items`}>
                <Heart /><span className="icon-count">{wishlistCount}</span>
              </button>
              <button className={page === 'cart' ? 'icon-button active' : 'icon-button'} onClick={() => navigate('cart')} aria-label={`Cart, ${cartCount} items`}>
                <ShoppingBag /><span className="icon-count">{cartCount}</span>
              </button>
              {user && <button className="icon-button logout-button" onClick={onLogout} aria-label="Sign out"><LogOut /></button>}
            </div>
            <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav className="department-nav" aria-label="Shop departments">
          {categoryOptions.map((item) => <button key={item} className={category === item ? 'department-link active' : 'department-link'} onClick={() => { onCategory(item); navigate('shop'); }}>{item === 'All' ? 'For you' : item}</button>)}
          <span className="department-promo">New finds, good prices <ArrowRight size={14} /></span>
        </nav>
      </header>
    </>
  );
}

function ProductCard({ product, wished, onAdd, onWish }) {
  return (
    <article className="product-card">
      <div className="product-picture">
        <img src={imageUrl(product.image)} alt={product.name} loading="lazy" />
        <button className={wished ? 'favorite-button is-wished' : 'favorite-button'} onClick={() => onWish(product)} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
          <Heart fill={wished ? 'currentColor' : 'none'} />
        </button>
        {product.compareAtPrice > product.price && <span className="product-label">{Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF</span>}
        <button className="quick-add" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}><Plus /></button>
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <div className="product-price"><span>{money(product.price)}</span>{product.compareAtPrice > product.price && <del>{money(product.compareAtPrice)}</del>}</div>
        <span className={product.stock > 0 ? 'stock-label' : 'stock-label sold-out'}>{product.stock > 0 ? 'In stock' : 'Out of stock'}</span>
      </div>
    </article>
  );
}

function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><ShoppingBag /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="button button-dark" onClick={onAction}>{action}<ArrowRight size={17} /></button>
    </div>
  );
}

function App() {
  const [sessionId] = useState(getSessionId);
  const [page, setPage] = useState(() => window.location.hash.slice(1) || 'shop');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authNextPage, setAuthNextPage] = useState('account');
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(initialCategories);
  const [cart, setCart] = useState({ items: [] });
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState(readWishlist);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [coupon, setCoupon] = useState(() => localStorage.getItem('evara-coupon') || '');
  const [couponText, setCouponText] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const cartItems = cart.items || [];
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 10;
  const discount = coupon === 'SAVE10' ? Math.round(subtotal * 10) / 100 : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const categoryOptions = ['All', ...availableCategories];
  const priceLimit = Math.max(50, Math.ceil(Math.max(...allProducts.map((product) => product.price), 0) / 50) * 50);
  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'All' || product.category?.trim().toLowerCase() === category.toLowerCase();
    const matchesPrice = !maxPrice || product.price <= maxPrice;
    const matchesStock = !inStockOnly || product.stock > 0;
    return matchesCategory && matchesPrice && matchesStock;
  });

  function navigate(nextPage) {
    setPage(nextPage);
    window.location.hash = nextPage;
  }

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  }

  async function refreshCart() {
    const nextCart = await api.cart(sessionId);
    setCart(nextCart);
  }

  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash.slice(1) || 'shop');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [catalogVersion]);

  useEffect(() => {
    api.me().then((result) => setUser(result.user)).catch(() => {});
  }, []);

  useEffect(() => {
    api.products({ search: '', category: 'All', sort: 'featured' })
      .then((result) => {
        setAllProducts(result);
        setAvailableCategories([...new Set(result.map((product) => product.category?.trim()).filter(Boolean))]
          .sort((first, second) => first.localeCompare(second)));
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.products({ search, category, sort, maxPrice, inStockOnly })
      .then((result) => { if (active) { setProducts(result); setError(''); } })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, category, sort, maxPrice, inStockOnly]);

  useEffect(() => {
    refreshCart().catch((requestError) => setError(requestError.message));
  }, [sessionId]);

  useEffect(() => {
    if (user && page === 'orders') api.orders().then(setOrders).catch((requestError) => setError(requestError.message));
  }, [page, user]);

  function toggleWishlist(product) {
    const next = wishlist.includes(product._id)
      ? wishlist.filter((id) => id !== product._id)
      : [...wishlist, product._id];
    setWishlist(next);
    localStorage.setItem('evara-wishlist', JSON.stringify(next));
    flash(next.includes(product._id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
  }

  async function addToCart(product) {
    try {
      setCart(await api.addToCart(sessionId, product._id));
      setError('');
      flash(`${product.name} added to your bag`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updateQuantity(productId, quantity) {
    try {
      setCart(await api.updateCartItem(sessionId, productId, quantity));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeFromCart(productId) {
    try {
      setCart(await api.removeCartItem(sessionId, productId));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function applyCoupon(event) {
    event.preventDefault();
    if (couponText.trim().toUpperCase() !== 'SAVE10') {
      setError('That code is not valid. Try SAVE10.');
      return;
    }
    setCoupon('SAVE10');
    localStorage.setItem('evara-coupon', 'SAVE10');
    setError('');
    flash('10% discount applied');
  }

  function clearFilters() {
    setCategory('All');
    setSearch('');
    setSearchText('');
    setSort('featured');
    setMaxPrice(0);
    setInStockOnly(false);
  }

  async function submitAuth(credentials) {
    try {
      const result = credentials.mode === 'register'
        ? await api.register(credentials)
        : await api.login(credentials);
      setUser(result.user);
      setError('');
      const destination = result.user.role === 'admin' ? 'admin' : authNextPage;
      setAuthNextPage('account');
      navigate(destination);
      flash(credentials.mode === 'register' ? 'Your Everywear account is ready' : 'Signed in successfully');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function signOut() {
    try {
      await api.logout();
      setUser(null);
      setOrders([]);
      navigate('shop');
      flash('Signed out');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function startCheckout() {
    if (user) {
      navigate('checkout');
      return;
    }
    setAuthMode('login');
    setAuthNextPage('checkout');
    navigate('auth');
  }

  async function submitOrder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const customer = Object.fromEntries(formData.entries());
    setPlacingOrder(true);
    try {
      const order = await api.placeOrder({ sessionId, customer, coupon });
      setCart({ items: [] });
      setCoupon('');
      localStorage.removeItem('evara-coupon');
      setOrders((current) => [order, ...current]);
      form.reset();
      navigate('orders');
      flash(`Order ${order.orderNumber} received`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  const wishedProducts = allProducts.filter((product) => wishlist.includes(product._id));

  return (
    <div className="app-shell">
      <Header
        page={page}
        navigate={navigate}
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        user={user}
        onLogout={signOut}
        category={category}
        categoryOptions={categoryOptions}
        onCategory={(nextCategory) => { setCategory(nextCategory); setSearch(''); setSearchText(''); }}
        searchText={searchText}
        setSearchText={setSearchText}
        onSearch={(event, searchOverride) => {
          event?.preventDefault();
          setSearch(searchOverride ?? searchText.trim());
          navigate('shop');
        }}
      />
      <main>
        {error && <div className="status-message error-message" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss message"><X size={16} /></button></div>}

        {page === 'shop' && <>
          <section className="hero wrap">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> EVERYWEAR PICKS / 2026</p>
              <h1>More to love.<br /><em>Less to spend.</em></h1>
              <p className="hero-description">Fresh everyday styles, useful layers, and little upgrades for your wardrobe, all in one place.</p>
              <button className="button button-dark" onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}>Shop today’s picks <ArrowDown size={16} /></button>
              <div className="hero-note"><span>GOOD FINDS, DAILY</span><span>New arrivals and customer favourites</span></div>
            </div>
            <div className="hero-art" aria-label="Featured Henley shirt">
              <img src="/assets/img/product-8-1.jpg" alt="Henley shirt from the everyday collection" />
              <div className="hero-stamp"><span>EVERYDAY</span><strong>great<br />finds</strong><span>EST. 2026</span></div>
              <div className="hero-caption"><span>FRESH PICKS FOR YOUR ROTATION</span><span>SHOP EVERYWEAR</span></div>
            </div>
          </section>

          <section className="collection wrap" id="collection">
            <div className="collection-heading">
              <div><p className="eyebrow">BROWSE THE MARKETPLACE</p><h2>Find your next favourite.</h2></div>
              <p className="collection-copy">Everyday essentials, fresh arrivals, and good-value picks, ready to browse.</p>
            </div>
            <div className="toolbar">
              <div className="category-list" aria-label="Filter by category">
                {categoryOptions.map((item) => {
                  const count = item === 'All' ? allProducts.length : allProducts.filter((product) => product.category?.trim().toLowerCase() === item.toLowerCase()).length;
                  return <button key={item} className={category === item ? 'category-chip selected' : 'category-chip'} onClick={() => setCategory(item)}>
                    <span>{item}</span><span className="category-count">{count}</span>
                  </button>;
                })}
              </div>
            </div>
            <div className="marketplace-controls">
              <div className="filter-controls" aria-label="Product filters">
                <span className="filter-title">Filter by</span>
                <label className="price-filter" htmlFor="max-price">
                  <span>Price up to <strong>{maxPrice ? money(maxPrice) : 'Any'}</strong></span>
                  <input id="max-price" type="range" min="0" max={priceLimit} step="5" value={maxPrice || priceLimit} onChange={(event) => {
                    const nextPrice = Number(event.target.value);
                    setMaxPrice(nextPrice >= priceLimit ? 0 : nextPrice);
                  }} />
                  <span className="price-range-labels"><span>$0</span><span>{money(priceLimit)}</span></span>
                </label>
                <label className="stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.currentTarget.checked)} />In stock</label>
                <button className="clear-filters" onClick={clearFilters} disabled={category === 'All' && !search && !maxPrice && !inStockOnly && sort === 'featured'}>Clear all</button>
              </div>
              <div className="sort-picker" role="group" aria-label="Sort products">
                <span className="sort-title">Sort by</span>
                {sortOptions.map(([value, label]) => <button key={value} className={sort === value ? 'sort-option active' : 'sort-option'} aria-pressed={sort === value} onClick={() => setSort(value)}>{label}</button>)}
              </div>
            </div>
            <div className="results-meta"><span>{loading ? 'Finding your picks…' : `${visibleProducts.length} products`}</span><span>Deals and new arrivals, all in one place</span></div>
            {loading ? <div className="loading-state">Loading the collection<span>•</span><span>•</span><span>•</span></div> : visibleProducts.length ? (
              <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product._id} product={product} wished={wishlist.includes(product._id)} onAdd={addToCart} onWish={toggleWishlist} />)}</div>
            ) : <div className="no-results"><h3>No products match these filters</h3><p>Try a different category, price, or search.</p><button className="text-button" onClick={clearFilters}>Clear all filters <ArrowRight size={16} /></button></div>}
          </section>

          <section className="values-band"><div className="wrap values-grid"><div><span>01</span><h3>Everyday prices</h3><p>Find useful wardrobe staples at prices worth coming back for.</p></div><div><span>02</span><h3>More to explore</h3><p>Browse new arrivals, favourite categories, and special offers.</p></div><div><span>03</span><h3>Simple checkout</h3><p>Clear totals, easy bag updates, and free shipping over $100.</p></div></div></section>
        </>}

        {page === 'cart' && <section className="page-section wrap">
          <PageHeading eyebrow="YOUR SELECTION" title="Your bag" detail={`${cartCount} ${cartCount === 1 ? 'piece' : 'pieces'}`} />
          {cartItems.length ? <div className="commerce-layout"><div className="line-items">{cartItems.map((item) => item.product && <article className="line-item" key={item.product._id}>
            <img src={imageUrl(item.product.image)} alt={item.product.name} />
            <div className="line-item-info"><span className="product-category">{item.product.category}</span><h3>{item.product.name}</h3><span>{money(item.product.price)}</span></div>
            <div className="quantity-control"><button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={15} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div>
            <strong className="line-subtotal">{money(item.product.price * item.quantity)}</strong>
            <button className="remove-button" onClick={() => removeFromCart(item.product._id)} aria-label={`Remove ${item.product.name}`}><Trash2 size={17} /></button>
          </article>)}</div><OrderSummary subtotal={subtotal} shipping={shipping} discount={discount} total={total} coupon={coupon} couponText={couponText} setCouponText={setCouponText} onCoupon={applyCoupon} onCheckout={startCheckout} /></div>
            : <EmptyState title="Your bag is taking a breather." description="Find a piece you love and it will be waiting here." action="Back to the collection" onAction={() => navigate('shop')} />}
        </section>}

        {page === 'wishlist' && <section className="page-section wrap">
          <PageHeading eyebrow="SAVED FOR LATER" title="Your wishlist" detail={`${wishedProducts.length} ${wishedProducts.length === 1 ? 'piece' : 'pieces'}`} />
          {wishedProducts.length ? <div className="product-grid wishlist-grid">{wishedProducts.map((product) => <ProductCard key={product._id} product={product} wished onAdd={addToCart} onWish={toggleWishlist} />)}</div>
            : <EmptyState title="Nothing saved just yet." description="Tap the heart on a piece to keep it close." action="Explore the collection" onAction={() => navigate('shop')} />}
        </section>}

        {page === 'checkout' && !user && <section className="page-section wrap"><EmptyState title="Sign in before checkout." description="Your bag will be waiting after you sign in or create an account." action="Sign in to continue" onAction={() => { setAuthMode('login'); setAuthNextPage('checkout'); navigate('auth'); }} /></section>}

        {page === 'checkout' && user && <section className="page-section wrap">
          <PageHeading eyebrow="ALMOST YOURS" title="Checkout" detail="Secure details, simple delivery" />
          {cartItems.length ? <div className="commerce-layout checkout-layout"><form className="checkout-form" onSubmit={submitOrder}>
            <h2>Delivery details</h2><div className="form-grid">
              <label>Full name<input name="name" autoComplete="name" defaultValue={user?.name || ''} required /></label>
              <label>Email<input name="email" type="email" autoComplete="email" defaultValue={user?.email || ''} readOnly={Boolean(user)} required /></label>
              <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
              <label>Country<input name="country" autoComplete="country-name" required /></label>
              <label className="full-field">Street address<input name="address" autoComplete="street-address" required /></label>
              <label>City<input name="city" autoComplete="address-level2" required /></label>
              <label>Postal code<input name="postalCode" autoComplete="postal-code" required /></label>
            </div>
            <p className="payment-note"><Check size={17} /> Payment collection is not connected in this demo.</p>
            <button className="button button-dark place-order" type="submit" disabled={placingOrder}>{placingOrder ? 'Placing order…' : 'Place demo order'}<ArrowRight size={17} /></button>
          </form><OrderSummary subtotal={subtotal} shipping={shipping} discount={discount} total={total} coupon={coupon} couponText={couponText} setCouponText={setCouponText} onCoupon={applyCoupon} /></div>
            : <EmptyState title="Your bag is empty." description="Add something to your bag before checking out." action="Browse the collection" onAction={() => navigate('shop')} />}
        </section>}

        {page === 'auth' && <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={submitAuth} error={error} />}

        {page === 'account' && user && <section className="page-section wrap">
          <PageHeading eyebrow="EVERYWEAR ACCOUNT" title={`Hello, ${user.name.split(' ')[0]}`} detail={user.role === 'admin' ? 'Administrator account' : 'Customer account'} />
          <div className="account-overview">
            <div className="account-details"><span className="admin-eyebrow">ACCOUNT DETAILS</span><h2>{user.name}</h2><p>{user.email}</p><span className="account-role">{user.role === 'admin' ? 'Administrator' : 'Everywear member'}</span></div>
            <button className="button button-dark" onClick={() => navigate('orders')}>View my orders <ArrowRight size={16} /></button>
          </div>
        </section>}

        {page === 'account' && !user && <section className="page-section wrap"><EmptyState title="Sign in to your account." description="Keep track of your orders and saved details." action="Sign in" onAction={() => { setAuthMode('login'); navigate('auth'); }} /></section>}

        {page === 'admin' && user?.role === 'admin' && <AdminPanel user={user} onLogout={signOut} flash={flash} setError={setError} setPage={navigate} onCatalogChange={() => setCatalogVersion((version) => version + 1)} />}

        {page === 'admin' && user?.role !== 'admin' && <section className="page-section wrap"><EmptyState title="Administrator sign-in required." description="Sign in with an administrator account to manage the store." action="Sign in" onAction={() => { setAuthMode('login'); navigate('auth'); }} /></section>}

        {page === 'orders' && user && <section className="page-section wrap">
          <PageHeading eyebrow="YOUR EVERYWEAR ACCOUNT" title="Order history" detail="Orders placed from this browser" />
          {orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-card" key={order._id || order.orderNumber}>
            <div className="order-card-heading"><div><span className="product-category">ORDER {order.orderNumber}</span><h3>{new Date(order.createdAt).toLocaleDateString()}</h3></div><span className="order-status">{order.status}</span></div>
            <div className="order-product-list">{order.items.map((item, index) => <div className="order-product" key={`${order.orderNumber}-${index}`}><img src={imageUrl(item.image)} alt="" /><span>{item.name} <small>× {item.quantity}</small></span><strong>{money(item.price * item.quantity)}</strong></div>)}</div>
            <div className="order-card-total"><span>Total</span><strong>{money(order.total)}</strong></div>
          </article>)}</div> : <EmptyState title="No orders yet." description="Your order history will appear here after checkout." action="Browse the collection" onAction={() => navigate('shop')} />}
        </section>}

        {page === 'orders' && !user && <section className="page-section wrap"><EmptyState title="Sign in to see your orders." description="Your purchase history is private to your Everywear account." action="Sign in" onAction={() => { setAuthMode('login'); setAuthNextPage('orders'); navigate('auth'); }} /></section>}
      </main>
      <footer className="site-footer"><div className="wrap footer-inner"><a className="brand" href="#shop" onClick={() => navigate('shop')}><span className="brand-mark">e</span><span>everywear</span></a><span>Good finds for every day.</span><span>© 2026 Everywear</span></div></footer>
      {notice && <div className="toast" role="status"><Check size={17} />{notice}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, detail }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><span>{detail}</span></div>;
}

function OrderSummary({ subtotal, shipping, discount, total, coupon, couponText, setCouponText, onCoupon, onCheckout }) {
  return <aside className="order-summary"><h2>Order summary</h2>
    <div className="summary-lines"><div><span>Subtotal</span><span>{money(subtotal)}</span></div><div><span>Shipping</span><span>{shipping ? money(shipping) : 'Complimentary'}</span></div>{discount > 0 && <div><span>Code {coupon}</span><span>−{money(discount)}</span></div>}</div>
    {!coupon && <form className="coupon-form" onSubmit={onCoupon}><label className="visually-hidden" htmlFor="coupon-code">Discount code</label><input id="coupon-code" placeholder="Discount code" value={couponText} onChange={(event) => setCouponText(event.target.value)} /><button type="submit">Apply</button></form>}
    <div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>
    {onCheckout && <button className="button button-dark summary-checkout" onClick={onCheckout}>Continue to checkout <ArrowRight size={17} /></button>}
    <p className="summary-footnote"><Check size={15} /> Free shipping over $100</p>
  </aside>;
}

export default App;
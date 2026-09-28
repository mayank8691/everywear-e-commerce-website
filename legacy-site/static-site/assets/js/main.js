/*=============== NAVIGATION ===============*/
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');

navToggle?.addEventListener('click', () => navMenu?.classList.add('show-menu'));
navClose?.addEventListener('click', () => navMenu?.classList.remove('show-menu'));

/*=============== IMAGE GALLERY ===============*/
const mainImage = document.querySelector('.details__img');
document.querySelectorAll('.details__small-img').forEach((image) => {
    image.addEventListener('click', () => {
        if (mainImage) mainImage.src = image.src;
    });
});

/*=============== SWIPERS ===============*/
if (window.Swiper) {
    if (document.querySelector('.categories__container')) {
        new Swiper('.categories__container', {
            spaceBetween: 24,
            loop: true,
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            breakpoints: {
                350: { slidesPerView: 2, spaceBetween: 24 },
                768: { slidesPerView: 3, spaceBetween: 24 },
                1200: { slidesPerView: 5, spaceBetween: 24 },
                1400: { slidesPerView: 6, spaceBetween: 24 },
            },
        });
    }

    if (document.querySelector('.new__container')) {
        new Swiper('.new__container', {
            spaceBetween: 24,
            loop: true,
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            breakpoints: {
                768: { slidesPerView: 2, spaceBetween: 24 },
                992: { slidesPerView: 3, spaceBetween: 24 },
                1400: { slidesPerView: 4, spaceBetween: 24 },
            },
        });
    }
}

/*=============== TABS ===============*/
const tabs = document.querySelectorAll('[data-target]');
tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.target);
        if (!target) return;

        const scope = tab.closest('.accounts__container') || tab.closest('.details__tab') || document;
        scope.querySelectorAll('[data-target].active-tab, [content].active-tab').forEach((item) => item.classList.remove('active-tab'));
        target.classList.add('active-tab');
        tab.classList.add('active-tab');
    });
});

/*=============== STOREFRONT STATE ===============*/
const storageKeys = { cart: 'shop-cart', wishlist: 'shop-wishlist', coupon: 'shop-coupon' };
const readState = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};
const saveState = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const money = (amount) => `$${amount.toFixed(2)}`;
const cart = readState(storageKeys.cart, []);
const wishlist = readState(storageKeys.wishlist, []);

function productFrom(element) {
    const card = element.closest('.product__item');
    const image = card?.querySelector('.product__img.default') || document.querySelector('.details__img');
    const name = card?.querySelector('.product__title') || document.querySelector('.details__title');
    const price = card?.querySelector('.new__price') || document.querySelector('.details__price .new__price');
    if (!image || !name || !price) return null;

    const imagePath = image.getAttribute('src');
    return {
        id: imagePath,
        image: imagePath,
        name: name.textContent.trim(),
        price: Number(price.textContent.replace(/[^\d.]/g, '')) || 0,
        category: card?.querySelector('.product__category')?.textContent.trim() || 'Clothing',
    };
}

function notify(message) {
    let notice = document.querySelector('.store-notice');
    if (!notice) {
        notice = document.createElement('div');
        notice.className = 'store-notice';
        Object.assign(notice.style, {
            position: 'fixed', right: '1rem', bottom: '1rem', zIndex: '1000',
            padding: '0.9rem 1.2rem', background: '#172b29', color: '#fff',
            borderRadius: '4px', boxShadow: '0 4px 18px #0003',
        });
        document.body.append(notice);
    }
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(notice.timeoutId);
    notice.timeoutId = setTimeout(() => { notice.hidden = true; }, 2200);
}

function addToCart(product, quantity = 1) {
    if (!product) return;
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ ...product, quantity });
    saveState(storageKeys.cart, cart);
    renderStorePages();
    notify(`${product.name} added to cart`);
}

function updateHeaderCounts() {
    const cartLink = document.querySelector('a[href="cart.html"]');
    const wishlistLink = document.querySelector('a[href="wishlist.html"]');
    [[cartLink, cart.reduce((sum, item) => sum + item.quantity, 0)], [wishlistLink, wishlist.length]]
        .forEach(([link, count]) => {
            if (!link) return;
            let badge = link.querySelector('.count');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'count';
                link.append(badge);
            }
            badge.textContent = count;
        });
}

function renderCart() {
    const table = document.querySelector('.cart .table');
    if (!table) return;
    table.innerHTML = `<thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th>Remove</th></tr></thead>
        <tbody>${cart.map((item) => `<tr data-product-id="${escapeHtml(item.id)}">
            <td><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="table__img"></td>
            <td><h3 class="table__title">${escapeHtml(item.name)}</h3><p class="table__description">${escapeHtml(item.category)}</p></td>
            <td><span class="table__price">${money(item.price)}</span></td>
            <td><input type="number" min="1" value="${item.quantity}" class="quantity" aria-label="Quantity for ${escapeHtml(item.name)}"></td>
            <td><span class="table__subtotal">${money(item.price * item.quantity)}</span></td>
            <td><button type="button" class="table__trash" aria-label="Remove ${escapeHtml(item.name)}"><i class="fi fi-rs-trash"></i></button></td>
        </tr>`).join('')}</tbody>`;
    if (cart.length === 0 && !document.querySelector('[data-empty-for="cart"]')) {
        table.insertAdjacentHTML('afterend', '<p class="store-empty" data-empty-for="cart">Your cart is empty. <a href="shop.html">Browse the shop</a>.</p>');
    } else if (cart.length > 0) document.querySelector('[data-empty-for="cart"]')?.remove();

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 10;
    const coupon = readState(storageKeys.coupon, '');
    const discount = coupon === 'SAVE10' ? subtotal * 0.1 : 0;
    const total = subtotal + shipping - discount;
    const totalTable = document.querySelector('.cart__total-table');
    if (totalTable) totalTable.innerHTML = `<tbody>
        <tr><td><span class="cart__total-title">Cart Subtotal</span></td><td><span class="cart__total-price">${money(subtotal)}</span></td></tr>
        <tr><td><span class="cart__total-title">Shipping</span></td><td><span class="cart__total-price">${shipping ? money(shipping) : 'Free'}</span></td></tr>
        ${discount ? `<tr><td><span class="cart__total-title">SAVE10</span></td><td><span class="cart__total-price">-${money(discount)}</span></td></tr>` : ''}
        <tr><td><span class="cart__total-title">Total</span></td><td><span class="cart__total-price">${money(total)}</span></td></tr>
    </tbody>`;
}

function renderWishlist() {
    const table = document.querySelector('.wishlist .table');
    if (!table) return;
    table.innerHTML = `<thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Stock Status</th><th>Action</th><th>Remove</th></tr></thead>
        <tbody>${wishlist.map((item) => `<tr data-product-id="${escapeHtml(item.id)}">
            <td><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="table__img"></td>
            <td><h3 class="table__title">${escapeHtml(item.name)}</h3><p class="table__description">${escapeHtml(item.category)}</p></td>
            <td><span class="table__price">${money(item.price)}</span></td><td><span class="table__stock">In Stock</span></td>
            <td><button type="button" class="btn btn--sm wishlist-add">Add to Cart</button></td>
            <td><button type="button" class="table__trash" aria-label="Remove ${escapeHtml(item.name)}"><i class="fi fi-rs-trash"></i></button></td>
        </tr>`).join('')}</tbody>`;
    if (wishlist.length === 0 && !document.querySelector('[data-empty-for="wishlist"]')) {
        table.insertAdjacentHTML('afterend', '<p class="store-empty" data-empty-for="wishlist">Your wishlist is empty. <a href="shop.html">Find something you love</a>.</p>');
    } else if (wishlist.length > 0) document.querySelector('[data-empty-for="wishlist"]')?.remove();
}

function renderCheckout() {
    const table = document.querySelector('.order__table');
    if (!table) return;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 10;
    const discount = readState(storageKeys.coupon, '') === 'SAVE10' ? subtotal * 0.1 : 0;
    const rows = cart.map((item) => `<tr><td><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="order__img"></td>
        <td><h3 class="table__title">${escapeHtml(item.name)}</h3><p class="table__quantity">x${item.quantity}</p></td>
        <td><span class="table__price">${money(item.price * item.quantity)}</span></td></tr>`).join('');
    table.innerHTML = `<tbody><tr><th colspan="2">Product</th><th>Total</th></tr>${rows}
        <tr><td><span class="order__subtitle">Subtotal</span></td><td colspan="2"><span class="table__price">${money(subtotal)}</span></td></tr>
        ${discount ? `<tr><td><span class="order__subtitle">SAVE10</span></td><td colspan="2"><span class="table__price">-${money(discount)}</span></td></tr>` : ''}
        <tr><td><span class="order__subtitle">Shipping</span></td><td colspan="2"><span class="table__price">${shipping ? money(shipping) : 'Free Shipping'}</span></td></tr>
        <tr><td><span class="order__subtitle">Total</span></td><td colspan="2"><span class="order__grand-total">${money(subtotal + shipping - discount)}</span></td></tr></tbody>`;
}

function renderStorePages() {
    updateHeaderCounts();
    renderCart();
    renderWishlist();
    renderCheckout();
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
}

/*=============== PRODUCT ACTIONS ===============*/
document.addEventListener('click', (event) => {
    const cartButton = event.target.closest('.cart__btn, .details__action .btn');
    if (cartButton) {
        event.preventDefault();
        const product = productFrom(cartButton);
        const quantity = Number(document.querySelector('.details__action .quantity')?.value) || 1;
        addToCart(product, Math.max(1, quantity));
        return;
    }

    const wishlistButton = event.target.closest('.product__actions [aria-label="Add to wishlist"], .details__action-btn');
    if (wishlistButton) {
        event.preventDefault();
        const product = productFrom(wishlistButton);
        if (product && !wishlist.some((item) => item.id === product.id)) {
            wishlist.push(product);
            saveState(storageKeys.wishlist, wishlist);
            renderStorePages();
            notify(`${product.name} added to wishlist`);
        }
        return;
    }

    const row = event.target.closest('tr[data-product-id]');
    if (!row) return;
    const productId = row.dataset.productId;
    if (event.target.closest('.table__trash')) {
        const list = row.closest('.wishlist') ? wishlist : cart;
        const key = row.closest('.wishlist') ? storageKeys.wishlist : storageKeys.cart;
        const index = list.findIndex((item) => item.id === productId);
        if (index >= 0) list.splice(index, 1);
        saveState(key, list);
        renderStorePages();
    } else if (event.target.closest('.wishlist-add')) {
        const item = wishlist.find((product) => product.id === productId);
        addToCart(item);
    }
});

document.addEventListener('change', (event) => {
    if (!event.target.matches('.cart .quantity')) return;
    const row = event.target.closest('tr[data-product-id]');
    const item = cart.find((product) => product.id === row?.dataset.productId);
    if (!item) return;
    item.quantity = Math.max(1, Number.parseInt(event.target.value, 10) || 1);
    saveState(storageKeys.cart, cart);
    renderStorePages();
});

/*=============== SEARCH ===============*/
const searchInput = document.querySelector('.header__search input');
const searchButton = document.querySelector('.search__btn');
const productGrid = document.querySelector('.products__container.grid');
const searchParams = new URLSearchParams(window.location.search);
if (searchInput && searchParams.has('q')) searchInput.value = searchParams.get('q');
const isShopPage = Boolean(document.querySelector('.total__products'));
const productCount = document.querySelector('.total__products span');
if (productGrid && productCount && isShopPage) productCount.textContent = productGrid.querySelectorAll('.product__item').length;

function runSearch() {
    const query = searchInput?.value.trim() || '';
    if (!productGrid || !isShopPage) {
        window.location.href = `shop.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
        return;
    }
    let visible = 0;
    productGrid.querySelectorAll('.product__item').forEach((item) => {
        const matches = item.textContent.toLowerCase().includes(query.toLowerCase());
        item.hidden = !matches;
        if (matches) visible += 1;
    });
    const count = document.querySelector('.total__products span');
    if (count) count.textContent = visible;
}
searchButton?.addEventListener('click', runSearch);
searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        runSearch();
    }
});
if (productGrid && searchParams.has('q')) runSearch();

/*=============== COUPON ===============*/
document.querySelector('.coupon__form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = event.currentTarget.querySelector('input')?.value.trim().toUpperCase();
    if (code !== 'SAVE10') {
        notify('That coupon code is not valid');
        return;
    }
    saveState(storageKeys.coupon, code);
    renderCart();
    notify('10% discount applied');
});

document.querySelectorAll('.cart__actions a').forEach((link, index) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        if (index === 0) {
            renderCart();
            notify('Cart updated');
        } else {
            window.location.href = 'shop.html';
        }
    });
});

/*=============== CHECKOUT ===============*/
document.querySelector('.payment__methods .btn')?.addEventListener('click', (event) => {
    if (!cart.length) {
        event.preventDefault();
        notify('Your cart is empty');
        return;
    }
    const fields = [...document.querySelectorAll('.checkout__group:first-child .form__input')]
        .filter((field) => field.type !== 'textarea');
    const missing = fields.find((field) => !field.value.trim());
    if (missing) {
        event.preventDefault();
        missing.focus();
        notify(`Please enter your ${missing.placeholder.toLowerCase()}`);
        return;
    }
    const payment = document.querySelector('.payment__input:checked');
    if (!payment) {
        event.preventDefault();
        notify('Choose a payment method');
        return;
    }
    event.preventDefault();
    cart.splice(0, cart.length);
    saveState(storageKeys.cart, cart);
    saveState(storageKeys.coupon, '');
    renderStorePages();
    notify('Order placed. This demo does not process payments.');
});

/*=============== NEWSLETTER ===============*/
document.querySelectorAll('.newsletter__form').forEach((form) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('input');
        if (!input?.value.trim()) return;
        notify('Thanks for subscribing');
        form.reset();
    });
});

renderStorePages();


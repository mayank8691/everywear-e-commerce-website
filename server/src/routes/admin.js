import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
const orderStatuses = ['Received', 'Processing', 'Shipped', 'Completed'];
const productFields = ['name', 'description', 'category', 'price', 'compareAtPrice', 'image', 'hoverImage', 'stock', 'featured'];

router.use(requireAuth, requireAdmin);

router.get('/dashboard', async (_request, response, next) => {
  try {
    const [productCount, orderCount, userCount, revenueRows] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);
    response.json({ productCount, orderCount, userCount, revenue: revenueRows[0]?.total || 0 });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (_request, response, next) => {
  try {
    response.json(await Product.find().sort({ updatedAt: -1 }).lean());
  } catch (error) {
    next(error);
  }
});

router.post('/products', async (request, response, next) => {
  try {
    const productData = normalizeProduct(request.body);
    if (!productData) return response.status(400).json({ message: 'Complete the required product fields with valid values.' });
    response.status(201).json(await Product.create(productData));
  } catch (error) {
    next(error);
  }
});

router.patch('/products/:productId', async (request, response, next) => {
  try {
    const productData = normalizeProduct(request.body);
    if (!productData) return response.status(400).json({ message: 'Complete the required product fields with valid values.' });
    const product = await Product.findByIdAndUpdate(request.params.productId, productData, { new: true, runValidators: true });
    if (!product) return response.status(404).json({ message: 'Product not found.' });
    response.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/products/:productId', async (request, response, next) => {
  try {
    const product = await Product.findByIdAndDelete(request.params.productId);
    if (!product) return response.status(404).json({ message: 'Product not found.' });
    response.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (_request, response, next) => {
  try {
    response.json(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).lean());
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:orderId/status', async (request, response, next) => {
  try {
    const status = String(request.body.status || '');
    if (!orderStatuses.includes(status)) return response.status(400).json({ message: 'Choose a valid order status.' });
    const order = await Order.findByIdAndUpdate(request.params.orderId, { status }, { new: true }).populate('user', 'name email');
    if (!order) return response.status(404).json({ message: 'Order not found.' });
    response.json(order);
  } catch (error) {
    next(error);
  }
});

function normalizeProduct(input = {}) {
  const product = Object.fromEntries(productFields.filter((field) => input[field] !== undefined).map((field) => [field, input[field]]));
  product.name = String(product.name || '').trim();
  product.description = String(product.description || '').trim();
  product.category = String(product.category || '').trim();
  product.image = String(product.image || '').trim();
  product.price = Number(product.price);
  product.stock = Number(product.stock);
  product.compareAtPrice = product.compareAtPrice === '' || product.compareAtPrice == null ? undefined : Number(product.compareAtPrice);
  if (!product.name || !product.description || !product.category || !product.image.startsWith('/assets/')) return null;
  if (!Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0) return null;
  if (product.compareAtPrice !== undefined && (!Number.isFinite(product.compareAtPrice) || product.compareAtPrice < 0)) return null;
  product.hoverImage = String(product.hoverImage || '').trim();
  product.featured = Boolean(product.featured);
  return product;
}

export default router;
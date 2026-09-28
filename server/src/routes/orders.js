import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const shippingFor = (subtotal) => subtotal === 0 || subtotal >= 100 ? 0 : 10;

router.get('/', requireAuth, async (request, response, next) => {
  try {
    const orders = await Order.find({ user: request.user._id }).sort({ createdAt: -1 }).lean();
    response.json(orders);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (request, response, next) => {
  try {
    const { sessionId, customer, coupon = '' } = request.body;
    const required = ['name', 'email', 'phone', 'address', 'city', 'country', 'postalCode'];
    if (!sessionId || !customer || required.some((field) => !String(customer[field] || '').trim())) {
      return response.status(400).json({ message: 'Complete all billing details before placing your order.' });
    }
    customer.email = request.user.email;

    const cart = await Cart.findOne({ sessionId }).populate('items.product');
    if (!cart?.items.length) return response.status(400).json({ message: 'Your cart is empty.' });
    const items = cart.items.map(({ product, quantity }) => ({
      productId: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = coupon === 'SAVE10' ? Math.round(subtotal * 10) / 100 : 0;
    const shipping = shippingFor(subtotal);
    const reserved = [];
    for (const item of items) {
      const result = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );
      if (result.modifiedCount !== 1) {
        await Promise.all(reserved.map(({ productId, quantity }) =>
          Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }),
        ));
        return response.status(409).json({ message: 'A piece in your bag is no longer available in that quantity.' });
      }
      reserved.push({ productId: item.productId, quantity: item.quantity });
    }

    let order;
    try {
      order = await Order.create({
        orderNumber: randomUUID().slice(0, 8).toUpperCase(),
        user: request.user._id,
        sessionId,
        customer,
        items,
        subtotal,
        shipping,
        discount,
        total: Math.max(0, subtotal + shipping - discount),
      });
    } catch (error) {
      await Promise.all(reserved.map(({ productId, quantity }) =>
        Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }),
      ));
      throw error;
    }
    await Cart.deleteOne({ sessionId });
    response.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
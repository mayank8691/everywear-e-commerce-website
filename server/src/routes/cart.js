import { Router } from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = Router();

async function getPopulatedCart(sessionId) {
  const cart = await Cart.findOne({ sessionId }).populate('items.product').lean();
  return cart || { sessionId, items: [] };
}

router.get('/:sessionId', async (request, response, next) => {
  try {
    response.json(await getPopulatedCart(request.params.sessionId));
  } catch (error) {
    next(error);
  }
});

router.post('/:sessionId/items', async (request, response, next) => {
  try {
    const { productId, quantity = 1 } = request.body;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return response.status(400).json({ message: 'Quantity must be a positive whole number.' });
    }
    const product = await Product.findById(productId);
    if (!product) return response.status(404).json({ message: 'Product not found.' });
    const cart = await Cart.findOneAndUpdate(
      { sessionId: request.params.sessionId },
      { $setOnInsert: { sessionId: request.params.sessionId, items: [] } },
      { upsert: true, new: true },
    );
    const existing = cart.items.find((item) => item.product.toString() === productId);
    if (product.stock < (existing?.quantity || 0) + quantity) {
      return response.status(409).json({ message: 'Not enough stock available.' });
    }
    if (existing) existing.quantity += quantity;
    else cart.items.push({ product: productId, quantity });
    await cart.save();
    response.json(await getPopulatedCart(request.params.sessionId));
  } catch (error) {
    next(error);
  }
});

router.patch('/:sessionId/items/:productId', async (request, response, next) => {
  try {
    const quantity = Number(request.body.quantity);
    const cart = await Cart.findOne({ sessionId: request.params.sessionId });
    if (!cart) return response.status(404).json({ message: 'Cart not found.' });
    const item = cart.items.find((entry) => entry.product.toString() === request.params.productId);
    if (!item) return response.status(404).json({ message: 'Item not found in cart.' });
    const product = await Product.findById(request.params.productId);
    if (Number.isInteger(quantity) && quantity > (product?.stock || 0)) {
      return response.status(409).json({ message: 'Not enough stock available.' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) cart.items.pull(item._id);
    else item.quantity = quantity;
    await cart.save();
    response.json(await getPopulatedCart(request.params.sessionId));
  } catch (error) {
    next(error);
  }
});

router.delete('/:sessionId/items/:productId', async (request, response, next) => {
  try {
    await Cart.updateOne(
      { sessionId: request.params.sessionId },
      { $pull: { items: { product: request.params.productId } } },
    );
    response.json(await getPopulatedCart(request.params.sessionId));
  } catch (error) {
    next(error);
  }
});

router.delete('/:sessionId', async (request, response, next) => {
  try {
    await Cart.deleteOne({ sessionId: request.params.sessionId });
    response.json({ sessionId: request.params.sessionId, items: [] });
  } catch (error) {
    next(error);
  }
});

export default router;
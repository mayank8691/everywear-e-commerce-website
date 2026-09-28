import { Router } from 'express';
import Product from '../models/Product.js';

const router = Router();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (request, response, next) => {
  try {
    const { search = '', category, sort = 'featured', maxPrice, inStock } = request.query;
    const filter = {};
    if (category && category !== 'All') {
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }
    const priceCeiling = Number(maxPrice);
    if (Number.isFinite(priceCeiling) && priceCeiling > 0) filter.price = { $lte: priceCeiling };
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (search.trim()) {
      const literalSearch = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: literalSearch, $options: 'i' } },
        { description: { $regex: literalSearch, $options: 'i' } },
        { category: { $regex: literalSearch, $options: 'i' } },
      ];
    }

    const sortOptions = {
      featured: { featured: -1, createdAt: -1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      newest: { createdAt: -1 },
      name: { name: 1 },
    };
    const products = await Product.find(filter).sort(sortOptions[sort] || sortOptions.featured).lean();
    response.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:productId', async (request, response, next) => {
  try {
    const product = await Product.findById(request.params.productId).lean();
    if (!product) return response.status(404).json({ message: 'Product not found.' });
    response.json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
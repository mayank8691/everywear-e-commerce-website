import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import products from './data/products.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/evara_store';

try {
  await mongoose.connect(mongoUri);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products.`);
} catch (error) {
  console.error('Unable to seed products:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
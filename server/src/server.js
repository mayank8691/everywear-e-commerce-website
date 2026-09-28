import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cartRoutes from './routes/cart.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import Product from './models/Product.js';
import products from './data/products.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/evara_store';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientBuild = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(express.static(clientBuild, { index: false }));
app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.get('/', (_request, response) => {
  if (process.env.NODE_ENV === 'production') {
    return response.sendFile(path.join(clientBuild, 'index.html'));
  }
  response.redirect(clientOrigin);
});
app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500).json({ message: error.message || 'Unexpected server error.' });
});

try {
  await mongoose.connect(mongoUri);
  if (!(await Product.exists({}))) {
    await Product.insertMany(products);
    console.log(`Added ${products.length} starter products.`);
  }
  app.listen(port, () => console.log(`API listening at http://localhost:${port}`));
} catch (error) {
  console.error(`MongoDB connection failed (${mongoUri}): ${error.message}`);
  process.exitCode = 1;
}
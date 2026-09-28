import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/evara_store';
const name = String(process.env.ADMIN_NAME || 'Everywear Admin').trim();
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');

if (!email || password.length < 12) {
  console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in server/.env.');
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  const passwordHash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    { $set: { name, email, passwordHash, role: 'admin' } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  console.log(`Administrator account is ready for ${email}.`);
} catch (error) {
  console.error('Unable to create administrator:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
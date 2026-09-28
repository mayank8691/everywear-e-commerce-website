import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer', required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
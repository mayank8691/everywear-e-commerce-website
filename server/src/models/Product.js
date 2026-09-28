import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  image: { type: String, required: true },
  hoverImage: { type: String },
  stock: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  }],
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, default: 'Received' },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
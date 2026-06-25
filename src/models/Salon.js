const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    desc: { type: String, default: '' },
    gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  },
  { _id: true },
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    stars: { type: Number, min: 1, max: 5 },
    text: String,
  },
  { timestamps: true },
);

const salonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    category: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
    location: { type: String, default: '' },
    distance: { type: String, default: '' },
    time: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    image: { type: String, default: '' },
    services: { type: [serviceSchema], default: [] },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Salon', salonSchema);

const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    expiry: { type: Date, required: true },
    active: { type: Boolean, default: true },
    discountPercent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Promotion', promotionSchema);

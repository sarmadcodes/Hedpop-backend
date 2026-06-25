const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    serviceName: String,
    price: Number,
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['Confirmed', 'Cancelled', 'Completed'], default: 'Confirmed' },
    reference: { type: String, unique: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Booking', bookingSchema);

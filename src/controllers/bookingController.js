const Booking = require('../models/Booking');
const Salon = require('../models/Salon');

const makeRef = () =>
  'HP-' + Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

exports.list = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate('salon', 'title image');
  res.json(bookings);
};

exports.detail = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id })
    .populate('salon', 'title image');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
};

exports.create = async (req, res) => {
  const salon = await Salon.findById(req.body.salon).select('title');
  if (!salon) return res.status(404).json({ message: 'Salon not found' });

  const booking = await Booking.create({
    ...req.body,
    salonTitle: salon.title,
    user: req.user.id,
    reference: makeRef(),
  });
  res.status(201).json(booking);
};

exports.cancel = async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { status: 'Cancelled' },
    { new: true },
  );
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
};

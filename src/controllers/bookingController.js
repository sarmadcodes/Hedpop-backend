const Booking = require('../models/Booking');
const Salon = require('../models/Salon');
const { emitBookingCreated, emitBookingCancelled } = require('../services/socket');

const makeRef = () =>
  'HP-' + Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

// Customers can cancel within this window after creating the booking.
const CANCEL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

// Returns the list of time strings already booked for a given salon + date.
// Public (no auth) so the booking flow can dim taken slots before login.
exports.takenSlots = async (req, res) => {
  const { salon, date } = req.query;
  if (!salon || !date) return res.json([]);
  const bookings = await Booking.find({
    salon,
    date,
    status: { $ne: 'Cancelled' },
  }).select('time');
  res.json(bookings.map((b) => b.time));
};

exports.create = async (req, res) => {
  const salon = await Salon.findById(req.body.salon).select('title');
  if (!salon) return res.status(404).json({ message: 'Salon not found' });

  // Hard-stop double-booking the same salon/date/time.
  const clash = await Booking.findOne({
    salon: req.body.salon,
    date: req.body.date,
    time: req.body.time,
    status: { $ne: 'Cancelled' },
  });
  if (clash) {
    return res.status(409).json({
      message: 'That time slot was just taken. Please pick another.',
    });
  }

  const booking = await Booking.create({
    ...req.body,
    salonTitle: salon.title,
    user: req.user.id,
    reference: makeRef(),
  });

  emitBookingCreated(booking);
  res.status(201).json(booking);
};

exports.cancel = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  if (booking.status === 'Cancelled') {
    return res.status(409).json({ message: 'This booking is already cancelled.' });
  }
  if (booking.status === 'Completed') {
    return res.status(409).json({ message: 'Completed bookings cannot be cancelled.' });
  }

  const age = Date.now() - new Date(booking.createdAt).getTime();
  if (age > CANCEL_WINDOW_MS) {
    return res.status(403).json({
      message: 'Cancellation window has expired. Bookings can only be cancelled within 1 hour of confirmation.',
    });
  }

  booking.status = 'Cancelled';
  await booking.save();

  // Tell the slot picker in everyone's BookingFlow that this time is free again.
  emitBookingCancelled(booking);
  res.json(booking);
};

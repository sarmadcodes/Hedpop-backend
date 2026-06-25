const User = require('../models/User');
const Salon = require('../models/Salon');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Promotion = require('../models/Promotion');
const { sendPush } = require('../services/firebase');

exports.stats = async (_req, res) => {
  const [users, salons, bookings, revenue] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Salon.countDocuments(),
    Booking.countDocuments({ status: 'Confirmed' }),
    Booking.aggregate([
      { $match: { status: 'Confirmed' } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),
  ]);
  res.json({
    users,
    salons,
    bookings,
    revenue: revenue[0]?.total || 0,
  });
};

exports.recentBookings = async (_req, res) => {
  const items = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name email')
    .populate('salon', 'title');
  res.json(items);
};

// Users
exports.listUsers = async (_req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(500);
  res.json(users);
};
exports.updateUser = async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'role', 'tier', 'loyaltyPoints'];
  const patch = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
  res.json(user);
};
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};

// Salons
exports.listSalons = async (_req, res) => res.json(await Salon.find().sort({ createdAt: -1 }));
exports.createSalon = async (req, res) => res.status(201).json(await Salon.create(req.body));
exports.updateSalon = async (req, res) =>
  res.json(await Salon.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.deleteSalon = async (req, res) => {
  await Salon.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};

// Bookings (admin sees all)
exports.listBookings = async (_req, res) => {
  const items = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .populate('user', 'name email')
    .populate('salon', 'title');
  res.json(items);
};

// Notifications — admin can create broadcast or targeted, and optionally push
exports.broadcastNotification = async (req, res) => {
  const { title, message, userId, sendPush: shouldPush = true } = req.body;
  if (!title || !message) return res.status(400).json({ message: 'title and message are required' });

  const broadcast = !userId;
  await Notification.create({ title, message, broadcast, user: userId || undefined });

  let pushResult = { sent: 0, skipped: true };
  if (shouldPush) {
    const filter = userId ? { _id: userId } : { role: 'customer' };
    const users = await User.find(filter).select('deviceTokens');
    const tokens = users.flatMap((u) => u.deviceTokens || []);
    if (tokens.length > 0) {
      pushResult = await sendPush({ tokens, title, body: message });
    }
  }

  res.status(201).json({ ok: true, push: pushResult });
};

exports.listNotifications = async (_req, res) => {
  const items = await Notification.find().sort({ createdAt: -1 }).limit(200).populate('user', 'name email');
  res.json(items);
};

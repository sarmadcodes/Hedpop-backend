const User = require('../models/User');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'avatar', 'settings'];
  const patch = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(req.user.id, patch, { new: true });
  res.json(user);
};

exports.registerDevice = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'token is required' });
  await User.updateOne({ _id: req.user.id }, { $addToSet: { deviceTokens: token } });
  res.json({ ok: true });
};

exports.unregisterDevice = async (req, res) => {
  const { token } = req.body;
  await User.updateOne({ _id: req.user.id }, { $pull: { deviceTokens: token } });
  res.json({ ok: true });
};

exports.loyalty = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({
    points: user.loyaltyPoints,
    tier: user.tier,
    pointsToNextTier: Math.max(0, 8000 - user.loyaltyPoints),
    nextTier: 'Diamond',
    progressPercent: Math.min(100, Math.round((user.loyaltyPoints / 8000) * 100)),
  });
};

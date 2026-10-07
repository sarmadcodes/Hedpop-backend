const User = require('../models/User');
const { deleteUserAndData } = require('../services/accountDeletion');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'avatar', 'settings', 'gender'];
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

// Account deletion (App Store Guideline 5.1.1(v)). The current password is
// required so a stolen or left-logged-in session can't wipe an account.
exports.deleteAccount = async (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Password is required to delete your account.' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Never let the last admin lock everyone out of the dashboard by accident.
  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Admin accounts cannot be deleted from the app.' });
  }

  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ message: 'Incorrect password.' });

  await deleteUserAndData(user._id);
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

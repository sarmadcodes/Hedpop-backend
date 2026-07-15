const User = require('../models/User');
const { signToken } = require('../utils/jwt');

exports.register = async (req, res) => {
  const { name, email, password, phone, address, gender } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, phone, address, gender });
  const token = signToken(user);
  res.status(201).json({ user, token });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ user, token });
};

exports.logout = async (_req, res) => {
  // Stateless JWT — clients drop the token. Hook here later for token blacklist if needed.
  res.json({ ok: true });
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const ok = await user.verifyPassword(currentPassword);
  if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  res.json({ ok: true });
};

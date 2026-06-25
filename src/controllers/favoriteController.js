const User = require('../models/User');
const Salon = require('../models/Salon');

exports.list = async (req, res) => {
  const user = await User.findById(req.user.id).populate('favorites');
  res.json(user?.favorites || []);
};

exports.add = async (req, res) => {
  const { salonId } = req.body;
  const exists = await Salon.exists({ _id: salonId });
  if (!exists) return res.status(404).json({ message: 'Salon not found' });
  await User.updateOne({ _id: req.user.id }, { $addToSet: { favorites: salonId } });
  res.json({ ok: true });
};

exports.remove = async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { $pull: { favorites: req.params.id } });
  res.json({ ok: true });
};

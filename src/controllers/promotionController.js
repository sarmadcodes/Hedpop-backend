const Promotion = require('../models/Promotion');

exports.list = async (_req, res) => {
  const items = await Promotion.find({ active: true, expiry: { $gte: new Date() } }).sort({ createdAt: -1 });
  res.json(items);
};

exports.adminList = async (_req, res) => {
  const items = await Promotion.find().sort({ createdAt: -1 });
  res.json(items);
};

exports.create = async (req, res) => {
  const promo = await Promotion.create(req.body);
  res.status(201).json(promo);
};

exports.update = async (req, res) => {
  const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!promo) return res.status(404).json({ message: 'Promotion not found' });
  res.json(promo);
};

exports.remove = async (req, res) => {
  await Promotion.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};

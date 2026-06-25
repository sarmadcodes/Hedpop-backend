const Salon = require('../models/Salon');

exports.list = async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (category) filter.category = new RegExp(`^${category}$`, 'i');
  if (q) filter.title = new RegExp(q, 'i');
  const salons = await Salon.find(filter).limit(50);
  res.json(salons);
};

exports.detail = async (req, res) => {
  const salon = await Salon.findById(req.params.id);
  if (!salon) return res.status(404).json({ message: 'Salon not found' });
  res.json(salon);
};

exports.services = async (req, res) => {
  const salon = await Salon.findById(req.params.id).select('services');
  if (!salon) return res.status(404).json({ message: 'Salon not found' });
  res.json(salon.services);
};

exports.reviews = async (req, res) => {
  const salon = await Salon.findById(req.params.id).select('reviews');
  if (!salon) return res.status(404).json({ message: 'Salon not found' });
  res.json(salon.reviews);
};

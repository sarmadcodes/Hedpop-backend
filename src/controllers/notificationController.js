const Notification = require('../models/Notification');

exports.list = async (req, res) => {
  const items = await Notification.find({
    $or: [{ user: req.user.id }, { broadcast: true }],
  }).sort({ createdAt: -1 }).limit(100);
  res.json(items);
};

exports.markRead = async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user.id }, { read: true });
  res.json({ ok: true });
};

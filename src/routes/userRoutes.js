const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

// Slows down password guessing on the destructive endpoint. Keyed by user id
// (this route is behind requireAuth), not IP, so one person never blocks others.
const deleteAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id || 'anonymous'),
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

router.use(requireAuth);
router.get('/me', ctrl.getProfile);
router.patch('/me', ctrl.updateProfile);
router.post('/me/device', ctrl.registerDevice);
router.delete('/me/device', ctrl.unregisterDevice);
router.get('/me/loyalty', ctrl.loyalty);
// POST rather than DELETE: the password travels in a JSON body, which every
// mobile HTTP client and proxy handles reliably for POST.
router.post('/me/delete', deleteAccountLimiter, ctrl.deleteAccount);

module.exports = router;

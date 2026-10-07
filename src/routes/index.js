const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.use('/auth', require('./authRoutes'));
router.use('/salons', require('./salonRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/admin', require('./adminRoutes'));

const notifications = require('../controllers/notificationController');
const favorites = require('../controllers/favoriteController');
const promotions = require('../controllers/promotionController');

router.get('/notifications', requireAuth, notifications.list);
router.post('/notifications/:id/read', requireAuth, notifications.markRead);

router.get('/favorites', requireAuth, favorites.list);
router.post('/favorites', requireAuth, favorites.add);
router.delete('/favorites/:id', requireAuth, favorites.remove);

router.get('/promotions', promotions.list);

module.exports = router;

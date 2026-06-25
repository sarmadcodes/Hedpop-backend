const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const admin = require('../controllers/adminController');
const promo = require('../controllers/promotionController');

router.use(requireAuth, requireRole('admin'));

router.get('/stats', admin.stats);
router.get('/recent-bookings', admin.recentBookings);

router.get('/users', admin.listUsers);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

router.get('/salons', admin.listSalons);
router.post('/salons', admin.createSalon);
router.patch('/salons/:id', admin.updateSalon);
router.delete('/salons/:id', admin.deleteSalon);

router.get('/bookings', admin.listBookings);

router.get('/notifications', admin.listNotifications);
router.post('/notifications', admin.broadcastNotification);

router.get('/promotions', promo.adminList);
router.post('/promotions', promo.create);
router.patch('/promotions/:id', promo.update);
router.delete('/promotions/:id', promo.remove);

module.exports = router;

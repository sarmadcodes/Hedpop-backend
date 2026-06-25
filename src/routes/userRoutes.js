const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.use(requireAuth);
router.get('/me', ctrl.getProfile);
router.patch('/me', ctrl.updateProfile);
router.post('/me/device', ctrl.registerDevice);
router.delete('/me/device', ctrl.unregisterDevice);
router.get('/me/loyalty', ctrl.loyalty);

module.exports = router;

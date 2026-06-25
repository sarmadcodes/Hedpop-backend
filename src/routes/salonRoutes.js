const router = require('express').Router();
const ctrl = require('../controllers/salonController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.get('/:id/services', ctrl.services);
router.get('/:id/reviews', ctrl.reviews);

module.exports = router;

const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/bookingController');

const createSchema = z.object({
  salon: z.string(),
  serviceId: z.string(),
  serviceName: z.string().optional(),
  duration: z.string().optional(),
  price: z.number(),
  date: z.string(),
  time: z.string(),
});

// Public — used by the booking-flow time picker before sign-in.
router.get('/taken', ctrl.takenSlots);

router.use(requireAuth);
router.get('/', ctrl.list);
router.post('/', validate(createSchema), ctrl.create);
router.get('/:id', ctrl.detail);
router.post('/:id/cancel', ctrl.cancel);

module.exports = router;

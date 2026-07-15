const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/authController');
const oauth = require('../controllers/oauthController');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(['male', 'female']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/logout', requireAuth, ctrl.logout);
router.get('/me', requireAuth, ctrl.me);
router.post('/change-password', requireAuth, validate(changePasswordSchema), ctrl.changePassword);

// OAuth — mobile sends a provider-issued token, we verify and issue our own JWT.
router.post('/google', oauth.googleSignIn);
router.post('/facebook', oauth.facebookSignIn);

module.exports = router;

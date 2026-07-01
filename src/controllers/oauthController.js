const User = require('../models/User');
const { signToken } = require('../utils/jwt');

let googleClient = null;
function getGoogleClient() {
  if (googleClient) return googleClient;
  if (!process.env.GOOGLE_CLIENT_ID) return null;
  const { OAuth2Client } = require('google-auth-library');
  googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return googleClient;
}

// Verify a Google ID token sent from the mobile app and exchange it for our own JWT.
exports.googleSignIn = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'idToken is required' });

  const client = getGoogleClient();
  if (!client) {
    return res.status(503).json({ message: 'Google sign-in is not configured on the server.' });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: 'Invalid Google token' });
  }

  const user = await upsertOAuthUser({
    email: payload.email,
    name: payload.name || payload.email,
    avatar: payload.picture,
    provider: 'google',
  });

  res.json({ user, token: signToken(user) });
};

// Verify a Facebook access token by calling Graph API, then issue our JWT.
exports.facebookSignIn = async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'accessToken is required' });
  if (!process.env.FACEBOOK_APP_ID) {
    return res.status(503).json({ message: 'Facebook sign-in is not configured on the server.' });
  }

  try {
    const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(401).json({ message: 'Invalid Facebook token' });
    const profile = await r.json();
    if (!profile.email) {
      return res.status(400).json({ message: 'Facebook account did not return an email. Grant email permission and retry.' });
    }
    const user = await upsertOAuthUser({
      email: profile.email,
      name: profile.name,
      avatar: profile.picture?.data?.url || null,
      provider: 'facebook',
    });
    res.json({ user, token: signToken(user) });
  } catch {
    res.status(401).json({ message: 'Could not verify Facebook token' });
  }
};

// Find or create a user by email; flag the auth provider for analytics later.
async function upsertOAuthUser({ email, name, avatar, provider }) {
  let user = await User.findOne({ email });
  if (user) {
    // Refresh display info if it changed at the provider.
    if (!user.avatar && avatar) user.avatar = avatar;
    if (!user.name) user.name = name;
    await user.save();
    return user;
  }
  // OAuth users have no local password — store a random hash so the schema's
  // `required` validation passes; they'll always log in via OAuth.
  const passwordHash = await User.hashPassword(provider + ':' + Date.now() + Math.random());
  user = await User.create({ email, name, avatar, passwordHash, role: 'customer' });
  return user;
}

// Lazy, fault-tolerant Firebase Admin init.
// If FIREBASE_SA_PATH isn't set, push silently no-ops and logs a warning.
// This keeps local development working before you configure FCM.

let admin = null;
let initialized = false;
let messaging = null;

function initFirebase() {
  const path = process.env.FIREBASE_SA_PATH;
  if (!path) {
    console.warn('\x1b[33m[firebase] FIREBASE_SA_PATH not set — push notifications disabled.\x1b[0m');
    return;
  }
  try {
    admin = require('firebase-admin');
    const serviceAccount = require(require('path').resolve(path));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    messaging = admin.messaging();
    initialized = true;
    console.log('\x1b[32m[firebase] FCM initialized.\x1b[0m');
  } catch (err) {
    console.warn('\x1b[33m[firebase] Failed to init FCM, continuing without push:\x1b[0m', err.message);
  }
}

async function sendPush({ tokens = [], title, body, data = {} }) {
  if (!initialized || !messaging || tokens.length === 0) {
    return { sent: 0, skipped: true };
  }
  const stringifiedData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
  );
  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: stringifiedData,
    });
    return { sent: res.successCount, failed: res.failureCount };
  } catch (err) {
    console.error('[firebase] sendPush error:', err.message);
    return { sent: 0, error: err.message };
  }
}

module.exports = { initFirebase, sendPush };

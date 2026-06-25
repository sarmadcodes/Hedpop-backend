require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { initFirebase } = require('./services/firebase');

const PORT = process.env.PORT || 5000;

const c = { reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', gray: '\x1b[90m' };

(async () => {
  try {
    await connectDB();
    initFirebase();

    app.listen(PORT, () => {
      const lines = [
        '',
        `${c.bold}${c.cyan}  HedPop API${c.reset}  ${c.gray}${process.env.NODE_ENV || 'development'}${c.reset}`,
        `${c.gray}  ---------------------------------------------${c.reset}`,
        `${c.green}  ▸${c.reset} http://localhost:${PORT}/api/v1`,
        `${c.green}  ▸${c.reset} http://localhost:${PORT}/health`,
        `${c.gray}  ---------------------------------------------${c.reset}`,
        '',
      ];
      console.log(lines.join('\n'));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

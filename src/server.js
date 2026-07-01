require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initFirebase } = require('./services/firebase');
const socket = require('./services/socket');

const PORT = process.env.PORT || 5000;

const c = { reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m', green: '\x1b[32m', gray: '\x1b[90m' };

(async () => {
  try {
    await connectDB();
    initFirebase();

    const server = http.createServer(app);
    socket.init(server);

    server.listen(PORT, () => {
      const lines = [
        '',
        `${c.bold}${c.cyan}  HedPop API${c.reset}  ${c.gray}${process.env.NODE_ENV || 'development'}${c.reset}`,
        `${c.gray}  ---------------------------------------------${c.reset}`,
        `${c.green}  ▸${c.reset} http://localhost:${PORT}/api/v1`,
        `${c.green}  ▸${c.reset} http://localhost:${PORT}/health`,
        `${c.green}  ▸${c.reset} ws://localhost:${PORT}  (socket.io)`,
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

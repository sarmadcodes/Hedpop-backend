const { nanoid } = require('nanoid');

const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

const methodColor = {
  GET: c.cyan, POST: c.green, PUT: c.yellow, PATCH: c.yellow, DELETE: c.red,
};

const statusColor = (s) =>
  s >= 500 ? c.red : s >= 400 ? c.yellow : s >= 300 ? c.cyan : c.green;

function fmtMs(ms) {
  if (ms < 10) return `${c.green}${ms.toFixed(1)}ms${c.reset}`;
  if (ms < 100) return `${c.cyan}${ms.toFixed(1)}ms${c.reset}`;
  if (ms < 500) return `${c.yellow}${ms.toFixed(1)}ms${c.reset}`;
  return `${c.red}${ms.toFixed(1)}ms${c.reset}`;
}

module.exports = function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const reqId = nanoid(8);
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);

  res.on('finish', () => {
    const ns = Number(process.hrtime.bigint() - start);
    const ms = ns / 1_000_000;
    const m = methodColor[req.method] || c.gray;
    const sc = statusColor(res.statusCode);
    const time = new Date().toISOString().slice(11, 23);
    const user = req.user ? `${c.gray}user=${req.user.id.slice(-6)}${c.reset} ` : '';
    console.log(
      `${c.gray}${time}${c.reset} ${c.gray}[${reqId}]${c.reset} ` +
      `${m}${req.method.padEnd(6)}${c.reset} ${req.originalUrl} ` +
      `${sc}${res.statusCode}${c.reset} ${fmtMs(ms)} ${user}`,
    );
  });

  next();
};

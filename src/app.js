require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/error');
const routes = require('./routes');

const app = express();

// The API sits behind one nginx reverse proxy. Without this every request looks
// like it comes from 127.0.0.1, so the rate limiter below becomes a single
// bucket shared by ALL users (and logs ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/v1', routes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

module.exports = app;

require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/error');
const routes = require('./routes');

const app = express();

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

module.exports = function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : status >= 500 ? 'Internal server error' : err.message;
  if (status >= 500) console.error(err);
  res.status(status).json({ message, ...(err.details ? { details: err.details } : {}) });
};

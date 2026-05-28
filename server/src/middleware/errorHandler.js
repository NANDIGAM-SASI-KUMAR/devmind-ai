export const errorHandler = (err, req, res, _next) => {
  console.error('🔥 Error:', err.message);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

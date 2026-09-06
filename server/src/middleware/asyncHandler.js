// Express 4 does not catch rejected promises thrown inside an async route handler — an
// unhandled rejection there crashes the entire Node process (affecting every user, not just
// the request that triggered it), not just that one request. This wraps a handler so any
// rejection is forwarded to next(err), which routes it to errorHandler.js as a clean JSON
// error response instead.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

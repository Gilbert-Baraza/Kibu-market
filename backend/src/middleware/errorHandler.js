import ApiError from "../utils/ApiError.js";

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: error.message || "Internal server error.",
    ...(error.details ? { details: error.details } : {}),
  });
}
const errorHandler = (err, req, res, next) => {
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  // Supabase/PostgREST errors
  if (err?.code && err?.message && err?.details !== undefined) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // Axios (integracoes externas)
  if (err?.isAxiosError) {
    const status = err.response?.status || 502;
    const message = err.response?.data?.errors?.[0]?.description
      || err.response?.data?.message
      || err.message;

    return res.status(status).json({
      success: false,
      message,
    });
  }

  // JWT errors
  if (err?.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err?.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  const statusCode = err?.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err?.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err?.stack }),
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };

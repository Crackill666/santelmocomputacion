function errorHandler(err, _req, res, _next){
  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : "Error interno.";
  if(status >= 500){
    console.error("Unhandled error", err);
  }
  res.status(status).json({
    ok: false,
    error: message,
  });
}

module.exports = { errorHandler };

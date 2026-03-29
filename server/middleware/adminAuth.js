const config = require("../config");
const logger = require("../logger");

function getProvidedToken(req){
  const headerToken = req.headers["x-admin-token"];
  if(headerToken){
    return {
      token: String(headerToken).trim(),
      source: "header",
    };
  }

  // TODO: remove query/body token support after frontend migration
  if(req.query && req.query.token){
    return {
      token: String(req.query.token).trim(),
      source: "query",
    };
  }

  // Compatibilidad legacy existente (admin_token).
  if(req.query && req.query.admin_token){
    return {
      token: String(req.query.admin_token).trim(),
      source: "query",
    };
  }

  if(req.body && req.body.token){
    return {
      token: String(req.body.token).trim(),
      source: "body",
    };
  }

  // Compatibilidad legacy existente (admin_token).
  if(req.body && req.body.admin_token){
    return {
      token: String(req.body.admin_token).trim(),
      source: "body",
    };
  }

  return { token: "", source: "" };
}

function adminAuth(req, res, next){
  if(!config.ADMIN_TOKEN_REQUIRED){
    return next();
  }

  const expectedToken = String(process.env.ADMIN_TOKEN || config.ADMIN_TOKEN || "").trim();
  if(!expectedToken){
    return res.status(503).json({
      ok: false,
      error: "Panel admin deshabilitado: falta ADMIN_TOKEN en el backend.",
    });
  }

  const providedInfo = getProvidedToken(req);
  if(providedInfo.source === "query" || providedInfo.source === "body"){
    logger.warn("Admin auth using legacy token method (query/body). Should migrate to header.", {
      method: req.method,
      path: req.path,
      source: providedInfo.source,
    });
  }

  const provided = String(providedInfo.token || "").trim();
  if(!provided || provided !== expectedToken){
    return res.status(401).json({
      ok: false,
      error: "No autorizado. Token admin invalido o ausente.",
    });
  }

  return next();
}

module.exports = { adminAuth };
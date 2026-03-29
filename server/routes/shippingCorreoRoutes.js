const express = require("express");
const config = require("../config");
const logger = require("../logger");
const correoService = require("../services/correoArgentinoService");

const router = express.Router();

function handleKnownError(res, err){
  if(!err || !err.status){
    return false;
  }

  const payload = {
    ok: false,
    error: err.message || "Error consultando Correo Argentino.",
    code: err.code || "CORREO_ARG_ERROR",
  };

  if(err.details){
    payload.details = err.details;
  }

  res.status(err.status).json(payload);
  return true;
}

router.get("/auth-check", async (_req, res, next)=>{
  try{
    const result = await correoService.validateCredentials();
    return res.json({
      ok: true,
      enabled: Boolean(config.CORREO_ARG_ENABLED),
      ...result,
    });
  }catch(err){
    if(handleKnownError(res, err)) return;
    return next(err);
  }
});

router.get("/agencies", async (req, res, next)=>{
  try{
    const result = await correoService.getAgencies(
      req.query.provinceCode,
      req.query.postalCode,
      req.query.locality
    );

    return res.json({
      ok: true,
      enabled: Boolean(config.CORREO_ARG_ENABLED),
      total: Array.isArray(result.agencies) ? result.agencies.length : 0,
      ...result,
    });
  }catch(err){
    if(handleKnownError(res, err)) return;
    return next(err);
  }
});

router.post("/order", async (req, res, next)=>{
  try{
    const payload = req.body || {};

    if(config.FLOW_DIAGNOSTIC){
      logger.info("DIAG correo/order payload", {
        keys: Object.keys(payload),
      });
    }

    const result = await correoService.createOrder(payload);

    return res.json({
      ok: true,
      enabled: Boolean(config.CORREO_ARG_ENABLED),
      ...result,
    });
  }catch(err){
    if(handleKnownError(res, err)) return;
    return next(err);
  }
});

module.exports = router;
const path = require("path");
const express = require("express");

const config = require("./config");
const logger = require("./logger");

const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const shippingCorreoRoutes = require("./routes/shippingCorreoRoutes");
const { errorHandler } = require("./middleware/errorHandler");

function createApp(){
  const app = express();
  app.disable("x-powered-by");

  const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

  app.use((req, res, next)=>{
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if(req.secure){
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    return next();
  });

  app.use((req, res, next)=>{
    const origin = req.headers.origin;
    if(origin && LOCAL_ORIGIN_RE.test(origin)){
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type,x-webhook-secret,x-admin-token");
    }

    if(req.method === "OPTIONS"){
      return res.sendStatus(204);
    }

    return next();
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.get("/api/health", (_req, res)=>{
    const mpMode = String(config.MERCADO_PAGO_MODE || "mock").toLowerCase();
    const forceMock = Boolean(config.MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK);
    const fallbackToMock = Boolean(config.MERCADO_PAGO_FALLBACK_TO_MOCK);

    let runtimeLabel = "MOCK";
    if(mpMode === "real"){
      runtimeLabel = (!forceMock && !fallbackToMock) ? "REAL ESTRICTO" : "DEMO-REAL";
    }

    res.json({
      ok: true,
      service: "santelmo-checkout",
      env: config.NODE_ENV,
      runtime_mode: runtimeLabel,
      shipping_provider: config.SHIPPING_PROVIDER,
      mercado_pago: {
        mode: mpMode,
        fallback_to_mock: fallbackToMock,
        test_token_force_mock: forceMock,
      },
    });
  });

  app.use("/api/checkout", checkoutRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/webhooks", webhookRoutes);
  app.use("/api/shipping/correo", shippingCorreoRoutes);

  app.get("/stc-admin-orders-9x7q", (_req, res)=>{
    res.sendFile(path.join(config.ROOT_DIR, "admin-pedidos.html"));
  });

  app.get("/stc-admin-orders-9x7q/:orderId", (_req, res)=>{
    res.sendFile(path.join(config.ROOT_DIR, "admin-order-detail.html"));
  });

  app.use(express.static(config.ROOT_DIR));

  app.use((req, res)=>{
    res.status(404).json({ ok: false, error: `Ruta no encontrada: ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  logger.info(`Static root: ${path.resolve(config.ROOT_DIR)}`);
  return app;
}

module.exports = { createApp };
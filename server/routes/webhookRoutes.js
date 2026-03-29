const express = require("express");
const config = require("../config");
const logger = require("../logger");
const orderService = require("../services/orderService");

const router = express.Router();

router.post("/mercadopago", async (req, res)=>{
  try{
    if(config.WEBHOOK_SHARED_SECRET){
      const incoming = req.headers["x-webhook-secret"];
      if(incoming !== config.WEBHOOK_SHARED_SECRET){
        return res.status(401).json({ ok: false, error: "Webhook no autorizado." });
      }
    }

    const result = await orderService.processMercadoPagoWebhook(req);
    logger.info("Webhook Mercado Pago procesado", result);

    return res.json({ ok: true, result });
  }catch(err){
    logger.error("Error en webhook Mercado Pago", err);
    return res.status(500).json({ ok: false, error: "Error al procesar webhook." });
  }
});

module.exports = router;

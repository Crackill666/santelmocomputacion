const express = require("express");
const config = require("../config");
const logger = require("../logger");
const orderService = require("../services/orderService");

const router = express.Router();

router.post("/create-preference", async (req, res, next)=>{
  try{
    const body = req.body || {};

    if(config.FLOW_DIAGNOSTIC){
      logger.info("DIAG checkout/create-preference request", {
        source: body.source || "",
        product_id: body.product_id || "",
        product_name: body.product_name || "",
        delivery_method: body.delivery_method || body.deliveryMethod || "",
        price_ars: body.price_ars || "",
      });
    }

    if(!body.product_id && !body.product_name){
      return res.status(400).json({ ok: false, error: "Falta producto para iniciar checkout." });
    }

    const result = await orderService.createCheckout(body);

    if(config.FLOW_DIAGNOSTIC){
      logger.info("DIAG checkout/create-preference response", {
        order_id: result && result.order && result.order.id,
        checkout_mode: result && result.preference && result.preference.mode,
        fallback_from_real: Boolean(result && result.preference && result.preference.fallback_from_real),
      });
    }

    res.json({
      ok: true,
      checkout_url: result.preference.checkoutUrl,
      mode: result.preference.mode,
      fallback_from_real: Boolean(result.preference.fallback_from_real),
      order_id: result.order.id_pedido,
      access_token: result.order.access_token,
      message: result.preference.fallback_from_real
        ? "Mercado Pago real no estuvo disponible. Continuamos en checkout simulado."
        : null,
    });
  }catch(err){
    next(err);
  }
});

router.get("/confirm-return", async (req, res)=>{
  const query = req.query || {};
  const externalReference = String(query.external_reference || "").trim();
  const orderId = externalReference || String(query.order_id || "").trim();
  const accessToken = String(query.access_token || "").trim();
  const paymentId = String(query.payment_id || query.collection_id || "").trim();
  const finalStatus = String(query.status || query.collection_status || "").toLowerCase();

  const redirectParams = new URLSearchParams();
  if(orderId) redirectParams.set("order_id", orderId);
  if(accessToken) redirectParams.set("access_token", accessToken);
  if(paymentId) redirectParams.set("payment_id", paymentId);
  if(finalStatus) redirectParams.set("status", finalStatus);

  const queryString = redirectParams.toString();
  const successBaseUrl = "https://santelmocomputacion.com.ar/checkout-success.html";
  const failureBaseUrl = "https://santelmocomputacion.com.ar/checkout-failure.html";
  const successUrl = `${successBaseUrl}${queryString ? `?${queryString}` : ""}`;
  const failureUrl = `${failureBaseUrl}${queryString ? `?${queryString}` : ""}`;

  if(!orderId){
    logger.warn("checkout/confirm-return sin referencia de pedido", {
      has_external_reference: Boolean(externalReference),
      has_order_id: Boolean(query.order_id),
      has_payment_id: Boolean(paymentId),
      status: finalStatus || "",
    });
    return res.redirect(successUrl);
  }

  try{
    if(paymentId){
      await orderService.confirmCheckoutFromReturn({
        externalReference: orderId,
        paymentId,
        status: finalStatus,
      });
    }else{
      await orderService.getOrderForClient({ orderId });
    }
  }catch(err){
    logger.warn("checkout/confirm-return error. Se redirige al frontend para continuar flujo.", {
      order_id: orderId,
      payment_id: paymentId || "",
      status: finalStatus || "",
      error: err && err.message ? err.message : String(err),
    });
    return res.redirect(successUrl);
  }

  if(finalStatus === "rejected" || finalStatus === "cancelled" || finalStatus === "failure"){
    return res.redirect(failureUrl);
  }

  return res.redirect(successUrl);
});
router.post("/confirm", async (req, res, next)=>{
  try{
    const body = req.body || {};
    const orderId = body.order_id;
    const accessToken = body.access_token;

    if(config.FLOW_DIAGNOSTIC){
      logger.info("DIAG checkout/confirm request", {
        order_id: orderId || "",
        payment_id: body.payment_id || body.collection_id || "",
        status_hint: body.status || body.collection_status || "",
      });
    }

    if(!orderId){
      return res.status(400).json({ ok: false, error: "order_id es obligatorio." });
    }

    const result = await orderService.confirmCheckout({
      orderId,
      accessToken,
      paymentId: body.payment_id || body.collection_id,
      status: body.status || body.collection_status,
    });

    if(config.FLOW_DIAGNOSTIC){
      logger.info("DIAG checkout/confirm response", {
        order_id: orderId,
        already_approved: Boolean(result && result.alreadyApproved),
        payment_status: result && result.order && result.order.paymentStatus,
        shipping_status: result && result.order && result.order.shippingStatus,
      });
    }

    res.json({
      ok: true,
      already_approved: result.alreadyApproved,
      order: result.order,
    });
  }catch(err){
    next(err);
  }
});

module.exports = router;





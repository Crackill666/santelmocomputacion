const express = require("express");
const orderService = require("../services/orderService");

const router = express.Router();

router.get("/:orderId/summary", async (req, res, next)=>{
  try{
    const order = await orderService.getOrderForClient({
      orderId: req.params.orderId,
      accessToken: req.query.access_token,
    });

    res.json({ ok: true, order });
  }catch(err){
    next(err);
  }
});

router.post("/:orderId/shipping", async (req, res, next)=>{
  try{
    const body = req.body || {};
    const result = await orderService.saveShipping({
      orderId: req.params.orderId,
      accessToken: body.access_token,
      form: body,
    });

    res.json({
      ok: true,
      already_submitted: result.alreadySubmitted,
      shipment: result.shipment,
      email: result.email || null,
      order: result.order,
    });
  }catch(err){
    next(err);
  }
});

router.post("/:orderId/pickup-contact", async (req, res, next)=>{
  try{
    const body = req.body || {};
    const result = await orderService.savePickupContact({
      orderId: req.params.orderId,
      accessToken: body.access_token,
      form: body,
    });

    res.json({
      ok: true,
      already_submitted: result.alreadySubmitted,
      shipment: result.shipment,
      email: result.email || null,
      order: result.order,
    });
  }catch(err){
    next(err);
  }
});

module.exports = router;

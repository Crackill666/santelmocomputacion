const path = require("path");
const express = require("express");
const orderService = require("../services/orderService");
const { adminAuth } = require("../middleware/adminAuth");

const router = express.Router();
router.use(adminAuth);

function toBool(value){
  const raw = String(value || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

router.get("/orders", async (req, res, next)=>{
  try{
    const orders = await orderService.listOrders({
      order_id: req.query.order_id,
      estado_pago: req.query.estado_pago || req.query.payment_status,
      estado_envio: req.query.estado_envio || req.query.shipping_status,
    });

    res.json({
      ok: true,
      total: orders.length,
      orders,
    });
  }catch(err){
    next(err);
  }
});

router.get("/orders/:orderId", async (req, res, next)=>{
  try{
    const order = await orderService.getOrderForAdmin({
      orderId: req.params.orderId,
    });

    res.json({ ok: true, order });
  }catch(err){
    next(err);
  }
});

router.post("/orders/:orderId/shipping", async (req, res, next)=>{
  try{
    const order = await orderService.saveShippingAdmin({
      orderId: req.params.orderId,
      form: req.body || {},
    });

    res.json({ ok: true, order });
  }catch(err){
    next(err);
  }
});

router.post("/orders/:orderId/create-shipment", async (req, res, next)=>{
  try{
    const result = await orderService.createShipmentForAdmin({
      orderId: req.params.orderId,
      force: toBool(req.body && req.body.force),
    });

    res.json({
      ok: true,
      order: result.order,
      shipment: result.shipment,
    });
  }catch(err){
    next(err);
  }
});

router.post("/orders/:orderId/label", async (req, res, next)=>{
  try{
    const result = await orderService.getLabelForAdmin({
      orderId: req.params.orderId,
      force: toBool(req.body && req.body.force),
    });

    res.json({
      ok: true,
      order: result.order,
      label: result.label,
    });
  }catch(err){
    next(err);
  }
});

router.post("/orders/:orderId/mock-tracking", async (req, res, next)=>{
  try{
    const result = await orderService.advanceMockTrackingForAdmin({
      orderId: req.params.orderId,
      status: req.body && req.body.status,
    });

    res.json({
      ok: true,
      order: result.order,
      tracking: result.tracking,
    });
  }catch(err){
    next(err);
  }
});

router.get("/orders/:orderId/label", async (req, res, next)=>{
  try{
    const label = await orderService.getLabelFileForAdmin({
      orderId: req.params.orderId,
    });

    return res.download(label.filePath, label.fileName);
  }catch(err){
    next(err);
  }
});

router.post("/orders/:orderId/refresh-tracking", async (req, res, next)=>{
  try{
    const result = await orderService.refreshTrackingForAdmin({
      orderId: req.params.orderId,
    });

    res.json({
      ok: true,
      order: result.order,
      tracking: result.tracking,
    });
  }catch(err){
    next(err);
  }
});

router.post("/orders/:orderId/mark-dispatched", async (req, res, next)=>{
  try{
    const order = await orderService.markDispatchedForAdmin({
      orderId: req.params.orderId,
    });

    res.json({ ok: true, order });
  }catch(err){
    next(err);
  }
});

router.post("/orders/:orderId/cancel", async (req, res, next)=>{
  try{
    const result = await orderService.cancelOrderForAdmin({
      orderId: req.params.orderId,
      reason: req.body && req.body.reason,
    });

    res.json({
      ok: true,
      order: result.order,
      cancel_shipment: result.cancelShipment,
    });
  }catch(err){
    next(err);
  }
});

router.get("/agencies", async (req, res, next)=>{
  try{
    const result = await orderService.listAgenciesForAdmin({
      cityName: req.query.cityName,
      state: req.query.state,
    });

    res.json({
      ok: Boolean(result && result.ok),
      ...result,
    });
  }catch(err){
    next(err);
  }
});

module.exports = router;

const { SHIPPING_STATUS } = require("../../models/orderModel");
const { safeLower, normalize } = require("./utils");

const MOCK_TRACKING_LABELS = {
  shipment_created: "Envio creado",
  in_transit: "En transito",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
};

function mapTrackingStatusToShippingStatus(status){
  const raw = safeLower(status);
  if(raw.includes("delivered") || raw.includes("entregado")) return SHIPPING_STATUS.DELIVERED;
  if(raw.includes("out_for_delivery") || raw.includes("reparto")) return SHIPPING_STATUS.DISPATCHED;
  if(raw.includes("dispatch") || raw.includes("despach") || raw.includes("in_transit") || raw.includes("transito")) return SHIPPING_STATUS.DISPATCHED;
  if(raw.includes("cancel")) return SHIPPING_STATUS.CANCELLED;
  if(raw.includes("error") || raw.includes("failed")) return SHIPPING_STATUS.SHIPPING_ERROR;
  return null;
}

function normalizeTrackingEvents(events){
  if(!Array.isArray(events)) return [];
  return events.map((event)=>{
    const src = event && typeof event === "object" ? event : {};
    return {
      status: safeLower(src.status || src.code || ""),
      label: normalize(src.label || src.description || src.status || src.code || "tracking_event"),
      date: normalize(src.date || src.at || src.createdAt || new Date().toISOString()),
      detail: normalize(src.detail || src.city || src.message || ""),
    };
  }).filter((event)=> Boolean(event.status || event.label));
}

function getCurrentTrackingStatus(order){
  const direct = safeLower(order && order.shipping && order.shipping.currentTrackingStatus);
  if(direct) return direct;
  const events = normalizeTrackingEvents(order && order.shipping && order.shipping.trackingEvents);
  if(events.length){
    return safeLower(events[events.length - 1].status);
  }
  return "";
}

function mapMockTrackingToShippingStatus(mockStatus){
  const normalized = safeLower(mockStatus);
  if(normalized === "delivered") return SHIPPING_STATUS.DELIVERED;
  if(normalized === "in_transit" || normalized === "out_for_delivery") return SHIPPING_STATUS.DISPATCHED;
  if(normalized === "shipment_created") return SHIPPING_STATUS.SHIPMENT_CREATED;
  return null;
}

function buildMockTrackingEvent(status, detail){
  const normalized = safeLower(status);
  return {
    status: normalized,
    label: MOCK_TRACKING_LABELS[normalized] || normalized || "tracking_event",
    date: new Date().toISOString(),
    detail: normalize(detail || ""),
  };
}

module.exports = {
  mapTrackingStatusToShippingStatus,
  normalizeTrackingEvents,
  getCurrentTrackingStatus,
  mapMockTrackingToShippingStatus,
  buildMockTrackingEvent,
};
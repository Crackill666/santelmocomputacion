const { normalizeDeliveryMethod, DELIVERY_METHOD } = require("../../models/orderModel");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DELIVERY_METHOD_SHIPPING_COST = {
  [DELIVERY_METHOD.RETAIL_PICKUP]: 0,
  [DELIVERY_METHOD.CORREO_ARGENTINO]: 10500,
};

const SHIPPING_COST_MOCHILAS = 18000;

function normalize(value){
  return String(value || "").trim();
}

function toNumber(value, fallback){
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round2(value){
  return Math.round(Number(value || 0) * 100) / 100;
}

function safeLower(value){
  return String(value || "").toLowerCase();
}

function isValidEmail(value){
  return EMAIL_RE.test(normalize(value));
}

function isMercadoPagoSandboxEmail(value){
  const email = safeLower(value);
  if(!email) return false;
  return email.endsWith("@testuser.com") || (email.includes("test_user_") && email.includes("@"));
}

function resolveDeliveryMethod(raw){
  return normalizeDeliveryMethod(raw || DELIVERY_METHOD.CORREO_ARGENTINO);
}

function normalizeCategory(value){
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isMochilasCategory(value){
  const category = normalizeCategory(value);
  return category === "mochilas" || category === "mochila";
}

function shippingCostByDeliveryMethod(deliveryMethod, productCategory){
  const method = resolveDeliveryMethod(deliveryMethod);
  if(method !== DELIVERY_METHOD.CORREO_ARGENTINO){
    const pickupCost = DELIVERY_METHOD_SHIPPING_COST[DELIVERY_METHOD.RETAIL_PICKUP];
    return round2(Number.isFinite(pickupCost) ? pickupCost : 0);
  }

  if(isMochilasCategory(productCategory)){
    return round2(SHIPPING_COST_MOCHILAS);
  }

  const amount = DELIVERY_METHOD_SHIPPING_COST[method];
  return round2(Number.isFinite(amount) ? amount : DELIVERY_METHOD_SHIPPING_COST[DELIVERY_METHOD.CORREO_ARGENTINO]);
}

module.exports = {
  normalize,
  toNumber,
  round2,
  safeLower,
  isValidEmail,
  isMercadoPagoSandboxEmail,
  resolveDeliveryMethod,
  normalizeCategory,
  isMochilasCategory,
  shippingCostByDeliveryMethod,
};
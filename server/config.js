const path = require("path");

function toNumber(value, fallback){
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toBool(value, fallback){
  const raw = String(value || "").trim().toLowerCase();
  if(raw === "1" || raw === "true" || raw === "yes" || raw === "on") return true;
  if(raw === "0" || raw === "false" || raw === "no" || raw === "off") return false;
  return fallback;
}

function stripTrailingSlash(value){
  return String(value || "").replace(/\/+$/, "");
}

const PORT = toNumber(process.env.PORT, 3000);
const APP_BASE_URL = stripTrailingSlash(process.env.APP_BASE_URL || `http://localhost:${PORT}`);
const NODE_ENV = process.env.NODE_ENV || "development";
const DEFAULT_ADMIN_TOKEN_REQUIRED = true;

const LEGACY_CORREO_MODE = (process.env.CORREO_ARGENTINO_MODE || "mock").toLowerCase();
const SHIPPING_PROVIDER = (process.env.SHIPPING_PROVIDER
  || (LEGACY_CORREO_MODE === "real" ? "correo_argentino" : "mock")).toLowerCase();

const CORREO_ARG_BASE_URL = stripTrailingSlash(
  process.env.CORREO_ARG_BASE_URL
  || process.env.CORREO_ARG_API_BASE_URL
  || process.env.CORREO_ARGENTINO_API_URL
  || ""
);
const CORREO_ARG_API_KEY = process.env.CORREO_ARG_API_KEY || process.env.CORREO_ARGENTINO_API_TOKEN || "";
const CORREO_ARG_AGREEMENT = process.env.CORREO_ARG_AGREEMENT || "";
const CORREO_ARG_ENABLED = toBool(process.env.CORREO_ARG_ENABLED, false);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_PANEL_TOKEN || "";
const ADMIN_TOKEN_REQUIRED = toBool(process.env.ADMIN_TOKEN_REQUIRED, toBool(process.env.ADMIN_PANEL_TOKEN_REQUIRED, DEFAULT_ADMIN_TOKEN_REQUIRED));

module.exports = {
  PORT,
  APP_BASE_URL,
  NODE_ENV,
  ROOT_DIR: path.resolve(__dirname, ".."),
  ORDERS_FILE: path.join(__dirname, "data", "orders.json"),
  LABELS_DIR: path.join(__dirname, "data", "labels"),

  MERCADO_PAGO_MODE: (process.env.MERCADO_PAGO_MODE || "mock").toLowerCase(),
  MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
  MERCADO_PAGO_PUBLIC_KEY: process.env.MERCADO_PAGO_PUBLIC_KEY || "",
  MERCADO_PAGO_CURRENCY: process.env.MERCADO_PAGO_CURRENCY || "ARS",
  MERCADO_PAGO_PAYER_EMAIL: process.env.MERCADO_PAGO_PAYER_EMAIL || "",
  MERCADO_PAGO_GUEST_CHECKOUT: toBool(process.env.MERCADO_PAGO_GUEST_CHECKOUT, true),
  MERCADO_PAGO_FALLBACK_TO_MOCK: toBool(process.env.MERCADO_PAGO_FALLBACK_TO_MOCK, true),
  MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK: toBool(process.env.MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK, true),

  FX_USD_TO_ARS: toNumber(process.env.FX_USD_TO_ARS, 1400),

  SHIPPING_PROVIDER,
  SHIPPING_FALLBACK_TO_MOCK: toBool(process.env.SHIPPING_FALLBACK_TO_MOCK, true),
  SHIPPING_AUTO_CREATE_ON_CUSTOMER_FORM: toBool(process.env.SHIPPING_AUTO_CREATE_ON_CUSTOMER_FORM, false),
  SHIPPING_DEFAULT_ZONE: String(process.env.SHIPPING_DEFAULT_ZONE || "INTERIOR").toUpperCase(),
  SHIPPING_COST_CABA: toNumber(process.env.SHIPPING_COST_CABA, 10500),
  SHIPPING_COST_GBA: toNumber(process.env.SHIPPING_COST_GBA, 5000),
  SHIPPING_COST_INTERIOR: toNumber(process.env.SHIPPING_COST_INTERIOR, 8000),

  // Correo Argentino API 2.0 (paq.ar)
  CORREO_ARG_ENABLED,
  CORREO_ARG_BASE_URL,
  CORREO_ARG_API_BASE_URL: CORREO_ARG_BASE_URL,
  CORREO_ARG_API_KEY,
  CORREO_ARG_AGREEMENT,
  CORREO_ARG_LABEL_FORMAT: process.env.CORREO_ARG_LABEL_FORMAT || "10x15",

  // Legacy (se mantiene por compatibilidad)
  CORREO_ARGENTINO_MODE: LEGACY_CORREO_MODE,
  CORREO_ARGENTINO_API_URL: process.env.CORREO_ARGENTINO_API_URL || "",
  CORREO_ARGENTINO_API_TOKEN: process.env.CORREO_ARGENTINO_API_TOKEN || "",

  WEBHOOK_SHARED_SECRET: process.env.WEBHOOK_SHARED_SECRET || "",
  ADMIN_TOKEN,
  ADMIN_TOKEN_REQUIRED,
  ADMIN_PANEL_TOKEN: ADMIN_TOKEN,
  ADMIN_PANEL_TOKEN_REQUIRED: ADMIN_TOKEN_REQUIRED,
  FLOW_DIAGNOSTIC: toBool(process.env.FLOW_DIAGNOSTIC, false),

  EMAIL_ENABLED: toBool(process.env.EMAIL_ENABLED, false),
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: toNumber(process.env.SMTP_PORT, 587),
  SMTP_SECURE: toBool(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",

  PICKUP_SHOWROOM_ADDRESS: process.env.PICKUP_SHOWROOM_ADDRESS || "San Martin 50 Piso 8 Oficina 166",
  PICKUP_SHOWROOM_LOCALITY: process.env.PICKUP_SHOWROOM_LOCALITY || "Ciudad Autonoma de Buenos Aires",
  PICKUP_SHOWROOM_HOURS: process.env.PICKUP_SHOWROOM_HOURS || "Lunes a Viernes de 10:00 a 18:00",
  STORE_NAME: process.env.STORE_NAME || "SantelmoComputacion",
};
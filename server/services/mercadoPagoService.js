const config = require("../config");
const logger = require("../logger");

function isRealMode(){
  return config.MERCADO_PAGO_MODE === "real";
}

function isConfigured(){
  return Boolean(config.MERCADO_PAGO_ACCESS_TOKEN);
}

function isTestToken(){
  return String(config.MERCADO_PAGO_ACCESS_TOKEN || "").startsWith("TEST-");
}

function isFlowDiagnosticEnabled(){
  return String(process.env.FLOW_DIAGNOSTIC || "").trim().toLowerCase() === "true";
}

function maskValue(value){
  const raw = String(value || "").trim();
  if(!raw) return "";
  if(raw.length <= 8) return "***";
  return `${raw.slice(0, 4)}...${raw.slice(-3)}`;
}

function maskEmail(value){
  const email = String(value || "").trim();
  if(!email || !email.includes("@")) return "";

  const parts = email.split("@");
  const local = parts[0] || "";
  const domain = parts[1] || "";
  if(!domain) return "";

  const maskedLocal = local.length <= 2 ? `${local.charAt(0) || "*"}***` : `${local.slice(0, 2)}***`;
  const domainParts = domain.split(".");
  const domainName = domainParts[0] || "";
  const tld = domainParts.slice(1).join(".");
  const maskedDomainName = domainName ? `${domainName.charAt(0)}***` : "***";

  return `${maskedLocal}@${maskedDomainName}${tld ? `.${tld}` : ""}`;
}

function sanitizeUrl(value){
  const raw = String(value || "").trim();
  if(!raw) return "";

  try{
    const parsed = new URL(raw);
    return `${parsed.origin}${parsed.pathname}`;
  }catch(_err){
    return raw.split("?")[0];
  }
}

function summarizeBackUrls(backUrls){
  const urls = backUrls && typeof backUrls === "object" ? backUrls : {};
  return {
    success: sanitizeUrl(urls.success),
    failure: sanitizeUrl(urls.failure),
    pending: sanitizeUrl(urls.pending),
  };
}

async function mpRequest(path, options){
  const token = config.MERCADO_PAGO_ACCESS_TOKEN;
  if(!token){
    throw new Error("Falta MERCADO_PAGO_ACCESS_TOKEN para usar modo real.");
  }

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options && options.headers ? options.headers : {}),
    },
  });

  const data = await response.json().catch(()=> ({}));
  if(!response.ok){
    const message = data && data.message ? data.message : "Error de Mercado Pago";
    const err = new Error(`Mercado Pago ${response.status}: ${message}`);
    err.payload = data;
    throw err;
  }

  return data;
}

function buildBackUrl(path, order){
  const url = new URL(`${config.APP_BASE_URL}${path}`);
  url.searchParams.set("order_id", order.id_pedido);
  url.searchParams.set("access_token", order.access_token);
  return url.toString();
}

function buildMockCheckoutUrl(order){
  return buildBackUrl("/mock-mp-checkout.html", order);
}

function buildMockPreference(order, reason){
  const checkoutUrl = new URL(buildMockCheckoutUrl(order));
  if(reason){
    checkoutUrl.searchParams.set("source", "real_fallback");
  }

  return {
    mode: "mock",
    preferenceId: `MOCK-PREF-${Date.now()}`,
    checkoutUrl: checkoutUrl.toString(),
    raw: { mock: true, fallback_reason: reason || null },
    fallback_from_real: Boolean(reason),
  };
}

async function createPreference({ order, item, items }){
  if(!isRealMode()){
    return buildMockPreference(order, null);
  }

  if(isTestToken() && config.MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK){
    logger.warn("Token TEST detectado. Se fuerza checkout mock para evitar inestabilidad de sandbox.");
    return buildMockPreference(order, "test_token_force_mock");
  }

  if(!isConfigured()){
    if(config.MERCADO_PAGO_FALLBACK_TO_MOCK){
      logger.warn("MP real sin token. Se usa fallback mock.");
      return buildMockPreference(order, "missing_access_token");
    }
    throw new Error("Modo real de Mercado Pago activo pero no hay access token.");
  }

  const preferenceItemsInput = Array.isArray(items) && items.length ? items : [item].filter(Boolean);
  const preferenceItems = preferenceItemsInput.map((entry, index)=> ({
    id: entry && entry.id ? entry.id : `item_${index + 1}`,
    title: String((entry && entry.title) || "Producto"),
    quantity: Math.max(1, Number(entry && entry.quantity || 1) || 1),
    currency_id: config.MERCADO_PAGO_CURRENCY,
    unit_price: Number(entry && entry.unit_price || 0),
  }));

  const payload = {
    items: preferenceItems,
    external_reference: order.id_pedido,
    notification_url: `${config.APP_BASE_URL}/api/webhooks/mercadopago`,
    back_urls: {
      success: buildBackUrl("/api/checkout/confirm-return", order),
      failure: buildBackUrl("/api/checkout/confirm-return", order),
      pending: buildBackUrl("/api/checkout/confirm-return", order),
    },
    auto_return: "approved",
    metadata: {
      order_id: order.id_pedido,
      store: "santelmocomputacion",
    },
  };

  const payerEmail = String(config.MERCADO_PAGO_PAYER_EMAIL || "").trim();
  if(payerEmail){
    payload.payer = { email: payerEmail };
  }

  if(config.MERCADO_PAGO_GUEST_CHECKOUT){
    // Reduce friccion en sandbox/pruebas: prioriza tarjeta y evita metodos offline.
    // Nota: "account_money" no siempre puede excluirse y puede romper la preferencia.
    payload.payment_methods = {
      excluded_payment_types: [
        { id: "ticket" },
        { id: "bank_transfer" },
        { id: "atm" },
      ],
      installments: 1,
      default_installments: 1,
    };
  }

  if(Object.prototype.hasOwnProperty.call(payload, "item")){
    delete payload.item;
  }

  let data;
  if(isFlowDiagnosticEnabled()){
    logger.info("MP DIAG create-preference request", {
      mode: "real",
      token_kind: isTestToken() ? "test" : "live",
      order_id: maskValue(order && order.id_pedido),
      items_count: Array.isArray(payload.items) ? payload.items.length : 0,
      item_ids: Array.isArray(payload.items) ? payload.items.map((entry)=> String((entry && entry.id) || "")) : [],
      payer_email: maskEmail(payerEmail),
      auto_return: payload.auto_return,
      notification_url: sanitizeUrl(payload.notification_url),
      back_urls: summarizeBackUrls(payload.back_urls),
    });
  }

  try{
    data = await mpRequest("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }catch(err){
    if(config.MERCADO_PAGO_FALLBACK_TO_MOCK){
      logger.warn("Fallo creando preferencia en MP real. Se usa fallback mock.", {
        error: err.message,
      });
      return buildMockPreference(order, err.message || "real_checkout_error");
    }
    throw err;
  }

  if(isFlowDiagnosticEnabled()){
    logger.info("MP DIAG create-preference response", {
      preference_id: maskValue(data && data.id),
      has_init_point: Boolean(data && data.init_point),
      has_sandbox_init_point: Boolean(data && data.sandbox_init_point),
    });
  }

  const tokenLooksTest = String(config.MERCADO_PAGO_ACCESS_TOKEN || "").startsWith("TEST-");
  const checkoutUrl = tokenLooksTest
    ? (data.sandbox_init_point || data.init_point)
    : (data.init_point || data.sandbox_init_point);

  return {
    mode: "real",
    preferenceId: data.id,
    checkoutUrl,
    raw: data,
    fallback_from_real: false,
  };
}

async function getPaymentById(paymentId){
  if(!paymentId) throw new Error("paymentId es requerido");

  if(!isRealMode()){
    return {
      id: paymentId,
      status: "approved",
      status_detail: "accredited",
      external_reference: null,
      payer: {
        email: "",
        first_name: "",
        last_name: "",
      },
    };
  }

  return mpRequest(`/v1/payments/${paymentId}`, { method: "GET" });
}

function extractPaymentIdFromWebhook(req){
  const query = req.query || {};
  const body = req.body || {};

  const direct = query["data.id"] || query.id;
  if(direct) return String(direct);

  if(body && body.data && body.data.id) return String(body.data.id);
  if(body && body.id && (body.type === "payment" || body.topic === "payment")) return String(body.id);

  if(body && typeof body.resource === "string"){
    const m = body.resource.match(/\/payments\/(\d+)/);
    if(m) return m[1];
  }

  return null;
}

function extractWebhookType(req){
  const query = req.query || {};
  const body = req.body || {};
  return String(query.topic || query.type || body.topic || body.type || "").toLowerCase();
}

module.exports = {
  createPreference,
  getPaymentById,
  extractPaymentIdFromWebhook,
  extractWebhookType,
  isRealMode,
};
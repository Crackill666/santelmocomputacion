const config = require("../../config");
const mockAdapter = require("./adapters/mockShipping");
const correoArgentinoAdapter = require("./adapters/correoArgentinoAdapter");

function normalizeProvider(value){
  const raw = String(value || "").trim().toLowerCase();
  if(raw === "correo_argentino" || raw === "correo-argentino" || raw === "correo"){
    return "correo_argentino";
  }
  return "mock";
}

async function resolveAdapter(preferredProvider){
  const requested = normalizeProvider(preferredProvider || config.SHIPPING_PROVIDER);

  if(requested === "correo_argentino"){
    const credential = await correoArgentinoAdapter.validateCredentials();
    if(credential.ok){
      return {
        provider: "correo_argentino",
        adapter: correoArgentinoAdapter,
        fallback: false,
        reason: "",
      };
    }

    if(config.SHIPPING_FALLBACK_TO_MOCK){
      return {
        provider: "mock",
        adapter: mockAdapter,
        fallback: true,
        reason: credential.message || "correo_credentials_missing",
      };
    }

    return {
      provider: "correo_argentino",
      adapter: correoArgentinoAdapter,
      fallback: false,
      reason: credential.message || "correo_credentials_missing",
    };
  }

  return {
    provider: "mock",
    adapter: mockAdapter,
    fallback: false,
    reason: "",
  };
}

async function runWithAdapter(methodName, payload, options){
  const preferredProvider = options && options.preferredProvider ? options.preferredProvider : null;
  const resolved = await resolveAdapter(preferredProvider);

  const fn = resolved.adapter[methodName];
  if(typeof fn !== "function"){
    return {
      ok: false,
      success: false,
      provider: resolved.provider,
      message: `Metodo ${methodName} no implementado para provider ${resolved.provider}`,
      fallback_from_provider: resolved.fallback,
      fallback_reason: resolved.reason || null,
    };
  }

  const result = await fn(payload, options || {});
  return {
    ...(result || {}),
    provider: result && result.provider ? result.provider : resolved.provider,
    fallback_from_provider: resolved.fallback,
    fallback_reason: resolved.reason || null,
  };
}

async function validateCredentials(options){
  return runWithAdapter("validateCredentials", null, options);
}

async function createShipment(order, options){
  return runWithAdapter("createShipment", order, options);
}

async function getLabel(order, options){
  return runWithAdapter("getLabel", order, options);
}

async function cancelShipment(trackingNumber, options){
  return runWithAdapter("cancelShipment", trackingNumber, options);
}

async function getTracking(trackingNumber, options){
  return runWithAdapter("getTracking", trackingNumber, options);
}

async function listAgencies(filters, options){
  return runWithAdapter("listAgencies", filters || {}, options);
}

module.exports = {
  normalizeProvider,
  validateCredentials,
  createShipment,
  getLabel,
  cancelShipment,
  getTracking,
  listAgencies,
};

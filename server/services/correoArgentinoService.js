const config = require("../config");
const logger = require("../logger");

function toStr(value){
  return String(value || "").trim();
}

function createError(status, message, code, details){
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if(typeof details !== "undefined"){
    err.details = details;
  }
  return err;
}

function isEnabled(){
  return Boolean(config.CORREO_ARG_ENABLED);
}

function getMissingConfig(){
  const missing = [];
  if(!toStr(config.CORREO_ARG_BASE_URL)) missing.push("CORREO_ARG_BASE_URL");
  if(!toStr(config.CORREO_ARG_API_KEY)) missing.push("CORREO_ARG_API_KEY");
  if(!toStr(config.CORREO_ARG_AGREEMENT)) missing.push("CORREO_ARG_AGREEMENT");
  return missing;
}

function assertReady(){
  if(!isEnabled()){
    throw createError(
      503,
      "Correo Argentino deshabilitado por configuracion (CORREO_ARG_ENABLED=false).",
      "CORREO_ARG_DISABLED"
    );
  }

  const missing = getMissingConfig();
  if(missing.length){
    throw createError(
      500,
      `Faltan variables de Correo Argentino: ${missing.join(", ")}`,
      "CORREO_ARG_CONFIG_MISSING",
      { missing }
    );
  }
}

function buildHeaders(includeJsonBody){
  const headers = {
    Authorization: `Apikey ${config.CORREO_ARG_API_KEY}`,
    agreement: config.CORREO_ARG_AGREEMENT,
    Accept: "application/json",
  };

  if(includeJsonBody){
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

function buildUrl(pathname, query){
  const base = toStr(config.CORREO_ARG_BASE_URL);
  const url = new URL(`${base}${pathname}`);

  Object.entries(query || {}).forEach(([key, value])=>{
    const normalized = toStr(value);
    if(normalized){
      url.searchParams.set(key, normalized);
    }
  });

  return url.toString();
}

async function parseResponseBody(response){
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const rawText = await response.text().catch(()=> "");

  if(!rawText){
    return {};
  }

  if(contentType.includes("application/json")){
    return JSON.parse(rawText);
  }

  try{
    return JSON.parse(rawText);
  }catch(_err){
    return { raw: rawText };
  }
}

function buildUpstreamErrorMessage(status, body){
  const fromBody = body && (body.message || body.error || body.detail || body.descripcion || body.descripcionError);
  const suffix = fromBody ? `: ${String(fromBody)}` : "";
  return `Correo Argentino respondio ${status}${suffix}`;
}

async function request({ method, path, query, body }){
  assertReady();

  const url = buildUrl(path, query);
  const hasBody = typeof body !== "undefined";

  if(config.FLOW_DIAGNOSTIC){
    logger.info("DIAG correo/request", {
      method,
      path,
      has_body: hasBody,
      query: query || {},
    });
  }

  let response;
  try{
    response = await fetch(url, {
      method,
      headers: buildHeaders(hasBody),
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  }catch(err){
    throw createError(
      502,
      "No se pudo conectar con Correo Argentino.",
      "CORREO_ARG_NETWORK_ERROR",
      { reason: err && err.message ? err.message : "network_error" }
    );
  }

  const payload = await parseResponseBody(response);

  if(!response.ok){
    logger.warn("Correo Argentino respondio error", {
      method,
      path,
      status: response.status,
    });

    throw createError(
      502,
      buildUpstreamErrorMessage(response.status, payload),
      "CORREO_ARG_HTTP_ERROR",
      {
        upstream_status: response.status,
        upstream: payload,
      }
    );
  }

  return payload;
}

async function validateCredentials(){
  const payload = await request({
    method: "GET",
    path: "/v1/auth",
  });

  return {
    ok: true,
    provider: "correo_argentino",
    enabled: true,
    message: "Credenciales validadas correctamente.",
    raw: payload,
  };
}

async function getAgencies(provinceCode, postalCode, locality){
  const payload = await request({
    method: "GET",
    path: "/v1/agencies",
    query: {
      provinceCode,
      postalCode,
      locality,
    },
  });

  const agencies = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload && payload.agencies)
      ? payload.agencies
      : (Array.isArray(payload && payload.items) ? payload.items : []));

  return {
    ok: true,
    provider: "correo_argentino",
    agencies,
    raw: payload,
  };
}

async function createOrder(payload){
  const response = await request({
    method: "POST",
    path: "/v1/orders",
    body: payload && typeof payload === "object" ? payload : {},
  });

  return {
    ok: true,
    provider: "correo_argentino",
    order: response,
    raw: response,
  };
}

module.exports = {
  isEnabled,
  validateCredentials,
  getAgencies,
  createOrder,
};
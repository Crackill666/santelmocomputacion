const config = require("../../../config");

function toStr(value){
  return String(value || "").trim();
}

function getMissingConfig(){
  const missing = [];
  if(!config.CORREO_ARG_API_BASE_URL) missing.push("CORREO_ARG_API_BASE_URL");
  if(!config.CORREO_ARG_API_KEY) missing.push("CORREO_ARG_API_KEY");
  if(!config.CORREO_ARG_AGREEMENT) missing.push("CORREO_ARG_AGREEMENT");
  return missing;
}

function buildHeaders(extra){
  return {
    Authorization: `Apikey ${config.CORREO_ARG_API_KEY}`,
    agreement: config.CORREO_ARG_AGREEMENT,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

async function request(path, options){
  const missing = getMissingConfig();
  if(missing.length){
    const err = new Error(`Faltan variables para Correo Argentino: ${missing.join(", ")}`);
    err.code = "CREDENTIALS_MISSING";
    throw err;
  }

  const url = `${config.CORREO_ARG_API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "GET",
    ...(options || {}),
    headers: buildHeaders(options && options.headers),
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json().catch(()=> ({})) : await response.text().catch(()=> "");

  if(!response.ok){
    const err = new Error(`Correo Argentino ${response.status}`);
    err.code = "CORREO_ARG_API_ERROR";
    err.payload = body;
    throw err;
  }

  return body;
}

function mapTrackingFromCreateResponse(response){
  const trackingNumber = response && (
    response.trackingNumber ||
    response.tracking_number ||
    response.codigoSeguimiento ||
    response.codigo_seguimiento ||
    ""
  );

  const shipmentClientId = response && (
    response.shipmentClientId ||
    response.shipment_client_id ||
    response.id ||
    ""
  );

  return {
    trackingNumber: toStr(trackingNumber),
    shipmentClientId: toStr(shipmentClientId),
  };
}

async function validateCredentials(){
  const missing = getMissingConfig();
  if(missing.length){
    return {
      ok: false,
      provider: "correo_argentino",
      message: `Faltan variables: ${missing.join(", ")}`,
      missing,
    };
  }

  return {
    ok: true,
    provider: "correo_argentino",
    message: "Credenciales configuradas.",
    missing: [],
  };
}

async function createShipment(order){
  try{
    const payload = {
      orderId: order.id,
      saleDate: order.saleDate || order.createdAt,
      deliveryType: order.shipping.deliveryType,
      agencyId: order.shipping.agencyId || undefined,
      receiver: {
        name: order.shipping.address.receiverName,
        phone: order.shipping.address.phone || order.shipping.address.cellphone,
        email: order.shipping.address.email,
      },
      address: {
        streetName: order.shipping.address.streetName,
        streetNumber: order.shipping.address.streetNumber,
        cityName: order.shipping.address.cityName,
        state: order.shipping.address.state,
        zipCode: order.shipping.address.zipCode,
        floor: order.shipping.address.floor,
        department: order.shipping.address.department,
        observation: order.shipping.address.observation,
      },
      package: {
        items: order.items,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        currency: order.currency,
      },
    };

    // Endpoint base preparado para API 2.0 (ajustar path final al integrar credenciales reales).
    const response = await request("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const mapped = mapTrackingFromCreateResponse(response);

    return {
      ok: true,
      success: true,
      provider: "correo_argentino",
      trackingNumber: mapped.trackingNumber,
      shipmentClientId: mapped.shipmentClientId,
      message: "Envio creado en Correo Argentino.",
      raw: response,
    };
  }catch(err){
    return {
      ok: false,
      success: false,
      provider: "correo_argentino",
      message: err.message || "No se pudo crear envio en Correo Argentino.",
      raw: err.payload || null,
      errorCode: err.code || "UNKNOWN",
    };
  }
}

async function getLabel(order){
  try{
    const shipmentClientId = toStr(order.shipping.shipmentClientId);
    const trackingNumber = toStr(order.shipping.trackingNumber);

    const id = shipmentClientId || trackingNumber;
    if(!id){
      return {
        ok: false,
        success: false,
        provider: "correo_argentino",
        message: "Falta shipmentClientId/tracking para solicitar etiqueta.",
      };
    }

    // Endpoint base preparado para API 2.0 (ajustar path final al integrar credenciales reales).
    const response = await request(`/orders/${encodeURIComponent(id)}/label?format=${encodeURIComponent(config.CORREO_ARG_LABEL_FORMAT)}`);

    return {
      ok: true,
      success: true,
      provider: "correo_argentino",
      message: "Etiqueta obtenida de Correo Argentino.",
      labelData: response,
      raw: response,
    };
  }catch(err){
    return {
      ok: false,
      success: false,
      provider: "correo_argentino",
      message: err.message || "No se pudo obtener etiqueta.",
      raw: err.payload || null,
      errorCode: err.code || "UNKNOWN",
    };
  }
}

async function cancelShipment(trackingNumber){
  try{
    const id = toStr(trackingNumber);
    if(!id){
      return {
        ok: false,
        success: false,
        provider: "correo_argentino",
        message: "trackingNumber requerido para cancelar envio.",
      };
    }

    // Endpoint base preparado para API 2.0 (ajustar path final al integrar credenciales reales).
    const response = await request(`/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });

    return {
      ok: true,
      success: true,
      provider: "correo_argentino",
      message: "Envio cancelado en Correo Argentino.",
      raw: response,
    };
  }catch(err){
    return {
      ok: false,
      success: false,
      provider: "correo_argentino",
      message: err.message || "No se pudo cancelar envio.",
      raw: err.payload || null,
      errorCode: err.code || "UNKNOWN",
    };
  }
}

async function getTracking(trackingNumber){
  try{
    const id = toStr(trackingNumber);
    if(!id){
      return {
        ok: false,
        success: false,
        provider: "correo_argentino",
        message: "trackingNumber requerido.",
      };
    }

    // Endpoint base preparado para API 2.0 (ajustar path final al integrar credenciales reales).
    const response = await request(`/tracking/${encodeURIComponent(id)}`);

    return {
      ok: true,
      success: true,
      provider: "correo_argentino",
      trackingNumber: id,
      currentStatus: toStr(response && (response.currentStatus || response.status || response.estado)),
      events: Array.isArray(response && response.events) ? response.events : [],
      raw: response,
    };
  }catch(err){
    return {
      ok: false,
      success: false,
      provider: "correo_argentino",
      message: err.message || "No se pudo consultar tracking.",
      raw: err.payload || null,
      errorCode: err.code || "UNKNOWN",
    };
  }
}

async function listAgencies(filters){
  try{
    const query = new URLSearchParams();
    if(filters && filters.cityName) query.set("cityName", filters.cityName);
    if(filters && filters.state) query.set("state", filters.state);

    // Endpoint base preparado para API 2.0 (ajustar path final al integrar credenciales reales).
    const response = await request(`/agencies${query.toString() ? `?${query.toString()}` : ""}`);

    return {
      ok: true,
      success: true,
      provider: "correo_argentino",
      agencies: Array.isArray(response) ? response : (response && response.items ? response.items : []),
      raw: response,
    };
  }catch(err){
    return {
      ok: false,
      success: false,
      provider: "correo_argentino",
      message: err.message || "No se pudieron listar sucursales.",
      raw: err.payload || null,
      errorCode: err.code || "UNKNOWN",
      agencies: [],
    };
  }
}

module.exports = {
  validateCredentials,
  createShipment,
  getLabel,
  cancelShipment,
  getTracking,
  listAgencies,
};

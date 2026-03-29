const crypto = require("crypto");

const PAYMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REFUNDED: "refunded",
};

const PAYMENT_PENDING_REASON = {
  AWAITING_CONFIRMATION: "awaiting_confirmation",
  MP_PENDING: "mp_pending",
  CHECKOUT_ABANDONED: "checkout_abandoned",
  FALLBACK_MISSING_STATUS: "fallback_missing_status",
  FALLBACK_UNKNOWN_STATUS: "fallback_unknown_status",
};

const SHIPPING_STATUS = {
  PENDING_SHIPPING_DATA: "pending_shipping_data",
  READY_TO_CREATE_SHIPMENT: "ready_to_create_shipment",
  SHIPMENT_CREATED: "shipment_created",
  LABEL_READY: "label_ready",
  DISPATCHED: "dispatched",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  SHIPPING_ERROR: "shipping_error",
};

const LEGACY_PAYMENT_MAP = {
  pendiente_pago: PAYMENT_STATUS.PENDING,
  pago_aprobado: PAYMENT_STATUS.APPROVED,
  pago_rechazado: PAYMENT_STATUS.REJECTED,
  pago_reembolsado: PAYMENT_STATUS.REFUNDED,
};

const LEGACY_SHIPPING_MAP = {
  envio_pendiente_de_datos: SHIPPING_STATUS.PENDING_SHIPPING_DATA,
  listo_para_generar_envio: SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT,
  envio_generado: SHIPPING_STATUS.SHIPMENT_CREATED,
  etiqueta_lista: SHIPPING_STATUS.LABEL_READY,
  despachado: SHIPPING_STATUS.DISPATCHED,
  entregado: SHIPPING_STATUS.DELIVERED,
  cancelado: SHIPPING_STATUS.CANCELLED,
  error_envio: SHIPPING_STATUS.SHIPPING_ERROR,
};

const CANONICAL_TO_LEGACY_PAYMENT = {
  [PAYMENT_STATUS.PENDING]: "pendiente_pago",
  [PAYMENT_STATUS.APPROVED]: "pago_aprobado",
  [PAYMENT_STATUS.REJECTED]: "pago_rechazado",
  [PAYMENT_STATUS.REFUNDED]: "pago_reembolsado",
};

const CANONICAL_TO_LEGACY_SHIPPING = {
  [SHIPPING_STATUS.PENDING_SHIPPING_DATA]: "envio_pendiente_de_datos",
  [SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT]: "listo_para_generar_envio",
  [SHIPPING_STATUS.SHIPMENT_CREATED]: "envio_generado",
  [SHIPPING_STATUS.LABEL_READY]: "etiqueta_lista",
  [SHIPPING_STATUS.DISPATCHED]: "despachado",
  [SHIPPING_STATUS.DELIVERED]: "entregado",
  [SHIPPING_STATUS.CANCELLED]: "cancelado",
  [SHIPPING_STATUS.SHIPPING_ERROR]: "error_envio",
};

const DELIVERY_METHOD = {
  RETAIL_PICKUP: "retail_pickup",
  CORREO_ARGENTINO: "correo_argentino",
};

function nowIso(){
  return new Date().toISOString();
}

function toSafeNumber(value, fallback){
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStr(value){
  return String(value || "").trim();
}

function buildOrderId(){
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PED-${y}${m}${d}-${rand}`;
}

function buildAccessToken(){
  return crypto.randomBytes(16).toString("hex");
}

function normalizePaymentStatus(value){
  const raw = toStr(value).toLowerCase();
  if(raw && PAYMENT_STATUS[raw.toUpperCase()]){
    return PAYMENT_STATUS[raw.toUpperCase()];
  }
  if(LEGACY_PAYMENT_MAP[raw]){
    return LEGACY_PAYMENT_MAP[raw];
  }
  if(raw === "approved") return PAYMENT_STATUS.APPROVED;
  if(raw === "rejected" || raw === "cancelled") return PAYMENT_STATUS.REJECTED;
  if(raw === "refunded") return PAYMENT_STATUS.REFUNDED;
  return PAYMENT_STATUS.PENDING;
}

function normalizePaymentPendingReason(value){
  const raw = toStr(value).toLowerCase();
  if(raw === PAYMENT_PENDING_REASON.AWAITING_CONFIRMATION) return PAYMENT_PENDING_REASON.AWAITING_CONFIRMATION;
  if(raw === PAYMENT_PENDING_REASON.MP_PENDING) return PAYMENT_PENDING_REASON.MP_PENDING;
  if(raw === PAYMENT_PENDING_REASON.CHECKOUT_ABANDONED) return PAYMENT_PENDING_REASON.CHECKOUT_ABANDONED;
  if(raw === PAYMENT_PENDING_REASON.FALLBACK_MISSING_STATUS) return PAYMENT_PENDING_REASON.FALLBACK_MISSING_STATUS;
  if(raw === PAYMENT_PENDING_REASON.FALLBACK_UNKNOWN_STATUS) return PAYMENT_PENDING_REASON.FALLBACK_UNKNOWN_STATUS;
  return "";
}

function normalizeShippingStatus(value){
  const raw = toStr(value).toLowerCase();
  if(raw && SHIPPING_STATUS[raw.toUpperCase()]){
    return SHIPPING_STATUS[raw.toUpperCase()];
  }
  if(LEGACY_SHIPPING_MAP[raw]){
    return LEGACY_SHIPPING_MAP[raw];
  }
  return SHIPPING_STATUS.PENDING_SHIPPING_DATA;
}

function toLegacyPaymentStatus(value){
  const normalized = normalizePaymentStatus(value);
  return CANONICAL_TO_LEGACY_PAYMENT[normalized] || CANONICAL_TO_LEGACY_PAYMENT[PAYMENT_STATUS.PENDING];
}

function toLegacyShippingStatus(value){
  const normalized = normalizeShippingStatus(value);
  return CANONICAL_TO_LEGACY_SHIPPING[normalized] || CANONICAL_TO_LEGACY_SHIPPING[SHIPPING_STATUS.PENDING_SHIPPING_DATA];
}

function normalizeDeliveryType(value){
  const raw = toStr(value).toLowerCase();
  if(raw === "agency") return "agency";
  if(raw === "locker") return "locker";
  return "homeDelivery";
}

function normalizeDeliveryMethod(value){
  const raw = toStr(value).toLowerCase();
  if(raw === "retail_pickup" || raw === "retiro_en_tienda" || raw === "pickup"){
    return DELIVERY_METHOD.RETAIL_PICKUP;
  }
  if(raw === "correo_argentino" || raw === "correo"){
    return DELIVERY_METHOD.CORREO_ARGENTINO;
  }
  return DELIVERY_METHOD.CORREO_ARGENTINO;
}

function normalizeTrackingEvent(event){
  const src = event && typeof event === "object" ? event : {};
  const status = toStr(src.status || src.code || "").toLowerCase();
  const label = toStr(src.label || src.description || status || "tracking_event");
  const date = toStr(src.date || src.at || src.createdAt || nowIso());
  const detail = toStr(src.detail || src.city || src.message || "");

  return { status, label, date, detail };
}

function normalizeTrackingEvents(events){
  if(!Array.isArray(events)) return [];
  return events
    .map((event)=> normalizeTrackingEvent(event))
    .filter((event)=> Boolean(event.status || event.label));
}

function normalizePickupContact(src){
  const input = src && typeof src === "object" ? src : {};
  return {
    name: toStr(input.name || input.pickupContactName || input.pickup_contact_name || input.nombre_apellido),
    phone: toStr(input.phone || input.pickupContactPhone || input.pickup_contact_phone || input.telefono),
    email: toStr(input.email || input.pickupContactEmail || input.pickup_contact_email || input.email_comprador || input.correo),
  };
}

function getLastTrackingStatus(events){
  if(!Array.isArray(events) || events.length === 0) return "";
  const last = events[events.length - 1];
  return toStr(last && last.status).toLowerCase();
}

function buildShippingAddressLine(address){
  const parts = [
    `${toStr(address.streetName)} ${toStr(address.streetNumber)}`.trim(),
    toStr(address.floor) || toStr(address.department) ? `Piso/Dto ${toStr(address.floor)} ${toStr(address.department)}`.trim() : "",
    toStr(address.cityName),
    toStr(address.state),
    toStr(address.zipCode) ? `CP ${toStr(address.zipCode)}` : "",
  ].filter(Boolean);
  return parts.join(", ");
}

function hasShippingAddress(order){
  const address = order && order.shipping && order.shipping.address ? order.shipping.address : {};
  return Boolean(
    toStr(address.receiverName) &&
    toStr(address.streetName) &&
    toStr(address.streetNumber) &&
    toStr(address.cityName) &&
    toStr(address.state) &&
    toStr(address.zipCode)
  );
}

function createOrder({ item, source, currency, subtotal, shippingCost, deliveryType, deliveryMethod }){
  const now = nowIso();
  const safeSubtotal = toSafeNumber(subtotal, 0);
  const safeShippingCost = toSafeNumber(shippingCost, 0);

  const order = {
    schemaVersion: 2,
    id: buildOrderId(),
    accessToken: buildAccessToken(),
    createdAt: now,
    saleDate: null,
    source: source || "web",

    customer: {
      name: "",
      email: "",
      phone: "",
    },
    pickupContact: {
      name: "",
      phone: "",
      email: "",
    },

    items: [
      {
        productId: item.productId,
        title: item.title,
        unitPrice: toSafeNumber(item.unitPrice, 0),
        quantity: Math.max(1, Math.floor(toSafeNumber(item.quantity, 1))),
        subtotal: toSafeNumber(item.subtotal, toSafeNumber(item.unitPrice, 0)),
      },
    ],

    subtotal: safeSubtotal,
    shippingCost: safeShippingCost,
    total: safeSubtotal + safeShippingCost,
    currency: currency || "ARS",
    deliveryMethod: normalizeDeliveryMethod(deliveryMethod),

    payment: {
      status: PAYMENT_STATUS.PENDING,
      paymentId: null,
      statusDetail: null,
      rawLastResponse: null,
      pendingReason: PAYMENT_PENDING_REASON.AWAITING_CONFIRMATION,
    },

    shipping: {
      status: SHIPPING_STATUS.PENDING_SHIPPING_DATA,
      deliveryType: normalizeDeliveryType(deliveryType),
      agencyId: "",
      address: {
        receiverName: "",
        streetName: "",
        streetNumber: "",
        cityName: "",
        state: "",
        zipCode: "",
        floor: "",
        department: "",
        observation: "",
        phone: "",
        cellphone: "",
        email: "",
      },
      provider: "mock",
      trackingNumber: "",
      shipmentClientId: "",
      labelPath: "",
      labelUrl: "",
      rawShipmentResponse: null,
      rawLabelResponse: null,
      lastSyncStatus: "",
      trackingEvents: [],
      currentTrackingStatus: "",
    },

    internalNotes: "",

    mercadoPago: {
      preferenceId: null,
      externalReference: null,
      checkoutUrl: null,
      status: "pending",
      mode: null,
      fallbackFromReal: false,
      rawPreferenceResponse: null,
    },

    history: [
      {
        at: now,
        event: "order_created",
        payload: {
          paymentStatus: PAYMENT_STATUS.PENDING,
          shippingStatus: SHIPPING_STATUS.PENDING_SHIPPING_DATA,
        },
      },
    ],
  };

  return syncLegacyFields(order);
}

function appendHistory(order, event, payload){
  const next = { ...order };
  next.history = Array.isArray(order.history) ? order.history.slice() : [];
  next.history.push({ at: nowIso(), event, payload: payload || null });
  return next;
}

function inferProviderFromTracking(trackingNumber){
  const tracking = toStr(trackingNumber);
  if(!tracking) return "mock";
  if(tracking.startsWith("CA-")) return "correo_argentino";
  return "mock";
}

function extractLegacyItem(order){
  const product = order && order.producto ? order.producto : {};
  const price = order && order.precio ? order.precio : {};
  return {
    productId: toStr(product.id),
    title: toStr(product.nombre) || "Producto",
    unitPrice: toSafeNumber(price.amount, 0),
    quantity: 1,
    subtotal: toSafeNumber(price.amount, 0),
  };
}

function normalizeAddressFromLegacy(legacy){
  return {
    receiverName: toStr(legacy.nombre_apellido),
    streetName: toStr(legacy.calle),
    streetNumber: toStr(legacy.numero),
    cityName: toStr(legacy.localidad),
    state: toStr(legacy.provincia),
    zipCode: toStr(legacy.codigo_postal),
    floor: toStr(legacy.piso_departamento),
    department: toStr(legacy.piso_departamento),
    observation: toStr(legacy.observaciones),
    phone: toStr(legacy.telefono),
    cellphone: toStr(legacy.telefono),
    email: "",
  };
}

function migrateLegacyOrder(order){
  const src = order && typeof order === "object" ? { ...order } : {};

  const paymentStatus = normalizePaymentStatus(
    src.paymentStatus ||
    (src.payment && src.payment.status) ||
    src.estado_pago
  );

  const shippingStatus = normalizeShippingStatus(
    src.shippingStatus ||
    (src.shipping && src.shipping.status) ||
    src.estado_envio
  );

  const items = Array.isArray(src.items) && src.items.length
    ? src.items.map((item)=> ({
      productId: toStr(item.productId || item.id),
      title: toStr(item.title || item.nombre || "Producto"),
      unitPrice: toSafeNumber(item.unitPrice, 0),
      quantity: Math.max(1, Math.floor(toSafeNumber(item.quantity, 1))),
      subtotal: toSafeNumber(item.subtotal, toSafeNumber(item.unitPrice, 0)),
    }))
    : [extractLegacyItem(src)];

  const subtotal = toSafeNumber(src.subtotal, items.reduce((acc, item)=> acc + toSafeNumber(item.subtotal, 0), 0));
  const shippingCost = toSafeNumber(src.shippingCost, 0);
  const total = toSafeNumber(src.total, subtotal + shippingCost);
  const deliveryMethod = normalizeDeliveryMethod(
    src.deliveryMethod
    || src.metodo_entrega
    || (shippingCost <= 0 ? DELIVERY_METHOD.RETAIL_PICKUP : DELIVERY_METHOD.CORREO_ARGENTINO)
  );

  const trackingEvents = normalizeTrackingEvents(
    Array.isArray(src.shipping && src.shipping.trackingEvents)
      ? src.shipping.trackingEvents
      : (Array.isArray(src.tracking_events) ? src.tracking_events : [])
  );

  const paymentPendingReason = normalizePaymentPendingReason(
    (src.payment && src.payment.pendingReason)
    || src.payment_pending_reason
  );

  const normalized = {
    ...src,

    schemaVersion: 2,
    id: toStr(src.id || src.id_pedido || buildOrderId()),
    accessToken: toStr(src.accessToken || src.access_token || buildAccessToken()),
    createdAt: toStr(src.createdAt || src.fecha || nowIso()),
    saleDate: toStr(src.saleDate || "") || (paymentStatus === PAYMENT_STATUS.APPROVED ? toStr(src.createdAt || src.fecha || nowIso()) : null),
    source: toStr(src.source || src.origen || "web"),

    customer: {
      name: toStr((src.customer && src.customer.name) || src.nombre_comprador),
      email: toStr((src.customer && src.customer.email) || src.email_comprador),
      phone: toStr((src.customer && src.customer.phone) || src.telefono),
    },

    pickupContact: normalizePickupContact(
      src.pickupContact
      || src.shipping
      || {
        pickupContactName: src.pickupContactName || src.pickup_contact_name,
        pickupContactPhone: src.pickupContactPhone || src.pickup_contact_phone,
        pickupContactEmail: src.pickupContactEmail || src.pickup_contact_email || src.email_comprador,
      }
    ),

    items,

    subtotal,
    shippingCost,
    total,
    currency: toStr(src.currency || (src.precio && src.precio.currency) || "ARS"),
    deliveryMethod,

    payment: {
      status: paymentStatus,
      paymentId: toStr((src.payment && src.payment.paymentId) || src.payment_id) || null,
      statusDetail: toStr((src.payment && src.payment.statusDetail) || src.payment_status_detail) || null,
      rawLastResponse: (src.payment && src.payment.rawLastResponse)
        || (src.mercado_pago && src.mercado_pago.last_payment_payload)
        || null,
      pendingReason: paymentStatus === PAYMENT_STATUS.PENDING
        ? (paymentPendingReason || undefined)
        : undefined,
    },

    shipping: {
      status: shippingStatus,
      deliveryType: normalizeDeliveryType((src.shipping && src.shipping.deliveryType) || src.deliveryType),
      agencyId: toStr((src.shipping && src.shipping.agencyId) || src.agencyId),
      address: {
        ...normalizeAddressFromLegacy(src.shipping || {}),
        ...(src.shipping && src.shipping.address ? src.shipping.address : {}),
        email: toStr((src.shipping && src.shipping.address && src.shipping.address.email) || src.email_comprador),
      },
      provider: toStr((src.shipping && src.shipping.provider) || src.provider || inferProviderFromTracking(src.tracking || (src.shipping && src.shipping.trackingNumber) || "")),
      trackingNumber: toStr((src.shipping && src.shipping.trackingNumber) || src.tracking),
      shipmentClientId: toStr((src.shipping && src.shipping.shipmentClientId) || src.shipmentClientId),
      labelPath: toStr((src.shipping && src.shipping.labelPath) || src.label_path),
      labelUrl: toStr((src.shipping && src.shipping.labelUrl) || src.label_url),
      rawShipmentResponse: (src.shipping && src.shipping.rawShipmentResponse) || src.raw_shipment_response || null,
      rawLabelResponse: (src.shipping && src.shipping.rawLabelResponse) || src.raw_label_response || null,
      lastSyncStatus: toStr((src.shipping && src.shipping.lastSyncStatus) || src.last_shipping_sync_status),
      trackingEvents,
      currentTrackingStatus: toStr((src.shipping && src.shipping.currentTrackingStatus) || src.tracking_current_status || getLastTrackingStatus(trackingEvents)).toLowerCase(),
    },

    internalNotes: toStr(src.internalNotes || src.notas_internas || ""),

    mercadoPago: {
      preferenceId: toStr((src.mercadoPago && src.mercadoPago.preferenceId) || (src.mercado_pago && src.mercado_pago.preference_id)) || null,
      externalReference: toStr((src.mercadoPago && src.mercadoPago.externalReference) || (src.mercado_pago && src.mercado_pago.external_reference)) || null,
      checkoutUrl: toStr((src.mercadoPago && src.mercadoPago.checkoutUrl) || (src.mercado_pago && src.mercado_pago.checkout_url)) || null,
      status: toStr((src.mercadoPago && src.mercadoPago.status) || (src.mercado_pago && src.mercado_pago.status) || "pending"),
      mode: toStr((src.mercadoPago && src.mercadoPago.mode) || (src.mercado_pago && src.mercado_pago.mode)) || null,
      fallbackFromReal: Boolean((src.mercadoPago && src.mercadoPago.fallbackFromReal) || false),
      rawPreferenceResponse: (src.mercadoPago && src.mercadoPago.rawPreferenceResponse) || null,
      lastPaymentPayload: (src.mercadoPago && src.mercadoPago.lastPaymentPayload)
        || (src.mercado_pago && src.mercado_pago.last_payment_payload)
        || null,
    },

    history: Array.isArray(src.history) ? src.history : [],
    shippingSubmittedAt: toStr(src.shippingSubmittedAt || src.shipping_submitted_at) || null,
  };

  if(deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP
    && !toStr(normalized.shipping.trackingNumber)
    && !toStr(normalized.shipping.currentTrackingStatus)){
    normalized.shipping.currentTrackingStatus = "no_aplica_retiro_en_tienda";
  }
  if(deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP && !toStr(normalized.pickupContact.name)){
    normalized.pickupContact.name = toStr(normalized.customer && normalized.customer.name);
  }
  if(deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP && !toStr(normalized.pickupContact.phone)){
    normalized.pickupContact.phone = toStr(normalized.customer && normalized.customer.phone);
  }
  if(deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP && !toStr(normalized.pickupContact.email)){
    normalized.pickupContact.email = toStr(normalized.customer && normalized.customer.email)
      || toStr(normalized.shipping && normalized.shipping.address && normalized.shipping.address.email);
  }

  return syncLegacyFields(normalized);
}

function syncLegacyFields(order){
  const next = { ...order };
  const resolvedDeliveryMethod = normalizeDeliveryMethod(next.deliveryMethod);
  const firstItem = Array.isArray(next.items) && next.items.length ? next.items[0] : null;
  const address = next.shipping && next.shipping.address ? next.shipping.address : {};

  next.id_pedido = next.id;
  next.access_token = next.accessToken;
  next.fecha = next.createdAt;
  next.origen = next.source;

  next.producto = {
    id: firstItem ? toStr(firstItem.productId) : "",
    nombre: firstItem ? toStr(firstItem.title) : "",
    categoria: toStr((next.producto && next.producto.categoria) || "Producto"),
  };

  next.precio = {
    currency: next.currency,
    amount: toSafeNumber(next.total, 0),
    usd_reference: toSafeNumber((next.precio && next.precio.usd_reference), null),
  };

  next.estado_pago = toLegacyPaymentStatus(next.payment && next.payment.status);
  next.payment_id = next.payment && next.payment.paymentId ? next.payment.paymentId : null;
  next.payment_status_detail = next.payment && next.payment.statusDetail ? next.payment.statusDetail : null;
  next.payment_pending_reason = next.payment && next.payment.pendingReason ? next.payment.pendingReason : null;

  next.nombre_comprador = toStr(next.customer && next.customer.name);
  next.email_comprador = toStr(next.customer && next.customer.email);
  next.telefono = toStr(next.customer && next.customer.phone);
  next.pickupContact = normalizePickupContact(next.pickupContact || {});
  next.pickupContactName = toStr(next.pickupContact.name);
  next.pickupContactPhone = toStr(next.pickupContact.phone);
  next.pickupContactEmail = toStr(next.pickupContact.email) || (resolvedDeliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP ? toStr(next.customer && next.customer.email) : "");
  next.pickup_contact_name = next.pickupContactName;
  next.pickup_contact_phone = next.pickupContactPhone;
  next.pickup_contact_email = next.pickupContactEmail;
  next.direccion_completa = buildShippingAddressLine(address);
  next.codigo_postal = toStr(address.zipCode);
  next.observaciones = toStr(address.observation);

  next.estado_envio = toLegacyShippingStatus(next.shipping && next.shipping.status);
  next.tracking = toStr(next.shipping && next.shipping.trackingNumber);
  next.tracking_current_status = toStr((next.shipping && next.shipping.currentTrackingStatus) || getLastTrackingStatus(next.shipping && next.shipping.trackingEvents)).toLowerCase();
  next.deliveryMethod = resolvedDeliveryMethod;
  next.metodo_entrega = next.deliveryMethod;

  next.shipping = {
    ...(next.shipping || {}),
    nombre_apellido: toStr(address.receiverName),
    telefono: toStr(address.phone || address.cellphone),
    calle: toStr(address.streetName),
    numero: toStr(address.streetNumber),
    piso_departamento: toStr(address.floor || address.department),
    localidad: toStr(address.cityName),
    provincia: toStr(address.state),
    codigo_postal: toStr(address.zipCode),
    observaciones: toStr(address.observation),
    currentTrackingStatus: toStr((next.shipping && next.shipping.currentTrackingStatus) || getLastTrackingStatus(next.shipping && next.shipping.trackingEvents)).toLowerCase(),
  };

  next.mercado_pago = {
    ...(next.mercado_pago || {}),
    preference_id: next.mercadoPago && next.mercadoPago.preferenceId ? next.mercadoPago.preferenceId : null,
    external_reference: next.mercadoPago && next.mercadoPago.externalReference ? next.mercadoPago.externalReference : null,
    checkout_url: next.mercadoPago && next.mercadoPago.checkoutUrl ? next.mercadoPago.checkoutUrl : null,
    status: next.mercadoPago && next.mercadoPago.status ? next.mercadoPago.status : "pending",
    mode: next.mercadoPago && next.mercadoPago.mode ? next.mercadoPago.mode : null,
    last_payment_payload: next.mercadoPago && next.mercadoPago.lastPaymentPayload ? next.mercadoPago.lastPaymentPayload : null,
  };

  next.shipping_submitted_at = next.shippingSubmittedAt || null;

  return next;
}

module.exports = {
  PAYMENT_STATUS,
  PAYMENT_PENDING_REASON,
  SHIPPING_STATUS,
  createOrder,
  appendHistory,
  migrateLegacyOrder,
  syncLegacyFields,
  normalizePaymentStatus,
  normalizePaymentPendingReason,
  normalizeShippingStatus,
  normalizeDeliveryType,
  normalizeDeliveryMethod,
  DELIVERY_METHOD,
  hasShippingAddress,
};

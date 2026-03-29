const fs = require("fs/promises");
const path = require("path");
const config = require("../config");
const logger = require("../logger");
const store = require("../data/ordersStore");
const {
  createOrder,
  appendHistory,
  PAYMENT_STATUS,
  PAYMENT_PENDING_REASON,
  SHIPPING_STATUS,
  syncLegacyFields,
  hasShippingAddress,
  normalizeShippingStatus,
  normalizeDeliveryType,
  DELIVERY_METHOD,
} = require("../models/orderModel");
const products = require("./productCatalogService");
const mercadoPago = require("./mercadoPagoService");
const shippingService = require("./shipping");
const emailService = require("./emailService");

const {
  normalize,
  toNumber,
  round2,
  safeLower,
  isValidEmail,
  isMercadoPagoSandboxEmail,
  resolveDeliveryMethod,
  shippingCostByDeliveryMethod,
} = require("./orders/utils");

const {
  validateShippingInput,
  validatePickupInput,
} = require("./orders/shippingValidation");

const {
  mapTrackingStatusToShippingStatus,
  normalizeTrackingEvents,
  getCurrentTrackingStatus,
  mapMockTrackingToShippingStatus,
  buildMockTrackingEvent,
} = require("./orders/trackingHelpers");

const MOCK_TRACKING_FLOW = ["shipment_created", "in_transit", "out_for_delivery", "delivered"];

function resolvePickupShowroomFromForm(raw){
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    address: normalize(input.pickup_showroom_address || input.pickupShowroomAddress || config.PICKUP_SHOWROOM_ADDRESS),
    locality: normalize(input.pickup_showroom_locality || input.pickupShowroomLocality || config.PICKUP_SHOWROOM_LOCALITY),
    hours: normalize(input.pickup_showroom_hours || input.pickupShowroomHours || config.PICKUP_SHOWROOM_HOURS),
  };
}

function ensureOrderAccess(order, accessToken){
  if(!order) throw httpError(404, "Pedido no encontrado.");
  if(!accessToken || accessToken !== order.accessToken){
    throw httpError(403, "No tenes permiso para acceder a este pedido.");
  }
}

function ensureOrderExists(order){
  if(!order) throw httpError(404, "Pedido no encontrado.");
}

function httpError(status, message){
  const err = new Error(message);
  err.status = status;
  return err;
}

function mapPaymentStatus(status){
  const raw = safeLower(status);
  if(raw === "approved") return PAYMENT_STATUS.APPROVED;
  if(raw === "rejected" || raw === "cancelled") return PAYMENT_STATUS.REJECTED;
  if(raw === "refunded") return PAYMENT_STATUS.REFUNDED;
  return PAYMENT_STATUS.PENDING;
}

function resolvePaymentPendingReason({ hasExplicitPaymentStatus, paymentStatusRaw, paymentStatus }){
  if(paymentStatus !== PAYMENT_STATUS.PENDING) return "";
  if(!hasExplicitPaymentStatus) return PAYMENT_PENDING_REASON.FALLBACK_MISSING_STATUS;

  const raw = safeLower(paymentStatusRaw);
  if(raw === PAYMENT_STATUS.PENDING) return PAYMENT_PENDING_REASON.MP_PENDING;

  return PAYMENT_PENDING_REASON.FALLBACK_UNKNOWN_STATUS;
}

function getBuyerNameFromPayment(payment){
  const payer = payment && payment.payer ? payment.payer : {};
  return `${payer.first_name || ""} ${payer.last_name || ""}`.trim();
}

function ensureShippingForApprovedOrder(current){
  const next = { ...current };
  const deliveryMethod = resolveDeliveryMethod(next.deliveryMethod);
  const currentStatus = normalizeShippingStatus(next.shipping && next.shipping.status);

  if(currentStatus === SHIPPING_STATUS.SHIPMENT_CREATED
    || currentStatus === SHIPPING_STATUS.LABEL_READY
    || currentStatus === SHIPPING_STATUS.DISPATCHED
    || currentStatus === SHIPPING_STATUS.DELIVERED
    || currentStatus === SHIPPING_STATUS.CANCELLED){
    return next;
  }

  if(deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP){
    next.shipping = {
      ...(next.shipping || {}),
      status: SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT,
      lastSyncStatus: "pickup_selected_no_shipping_required",
      currentTrackingStatus: "no_aplica_retiro_en_tienda",
      trackingEvents: [],
    };
    return next;
  }

  next.shipping = {
    ...(next.shipping || {}),
    status: hasShippingAddress(next)
      ? SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT
      : SHIPPING_STATUS.PENDING_SHIPPING_DATA,
  };

  return next;
}

function recalculateTotals(order){
  const subtotal = round2((order.items || []).reduce((acc, item)=> acc + round2(item.subtotal), 0));
  const shippingCost = round2(order.shippingCost || 0);
  const total = round2(subtotal + shippingCost);

  const next = {
    ...order,
    subtotal,
    shippingCost,
    total,
  };

  return syncLegacyFields(next);
}
async function persistLabelData(order, labelResult){
  if(labelResult.labelPath){
    return {
      labelPath: labelResult.labelPath,
      labelFileName: labelResult.labelFileName || path.basename(labelResult.labelPath),
    };
  }

  if(!labelResult.labelData){
    return {
      labelPath: "",
      labelFileName: "",
    };
  }

  await fs.mkdir(config.LABELS_DIR, { recursive: true });
  const fileName = `${order.id}-label.json`;
  const filePath = path.join(config.LABELS_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(labelResult.labelData, null, 2), "utf8");

  return {
    labelPath: filePath,
    labelFileName: fileName,
  };
}

async function createCheckout(input){
  const found = await products.findProduct({ id: input.product_id, name: input.product_name });

  const fallbackName = normalize(input.product_name) || "Producto";
  const fallbackId = normalize(input.product_id) || fallbackName.toLowerCase().replace(/\s+/g, "-");
  const usdRef = round2(toNumber(found ? found.price_usd : input.price_usd, 0));

  let amountArs = round2(toNumber(input.price_ars, 0));
  if(amountArs <= 0){
    amountArs = round2(usdRef * config.FX_USD_TO_ARS);
  }

  const deliveryMethod = resolveDeliveryMethod(input.delivery_method || input.deliveryMethod);
  const productCategory = found ? found.categoria : normalize(input.category) || "Producto";
  const requestedDeliveryType = normalizeDeliveryType(input.delivery_type || input.deliveryType || "homeDelivery");
  const deliveryType = deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP
    ? "homeDelivery"
    : requestedDeliveryType;
  const shippingCost = shippingCostByDeliveryMethod(deliveryMethod, productCategory);
  const total = round2(amountArs + shippingCost);

  const order = createOrder({
    item: {
      productId: found ? found.id : fallbackId,
      title: found ? found.nombre : fallbackName,
      unitPrice: amountArs,
      quantity: 1,
      subtotal: amountArs,
    },
    source: normalize(input.source) || "web",
    currency: config.MERCADO_PAGO_CURRENCY,
    subtotal: amountArs,
    shippingCost,
    deliveryMethod,
    deliveryType,
  });

  order.deliveryMethod = deliveryMethod;
  order.shippingCost = shippingCost;
  order.total = total;
  order.producto.categoria = productCategory;
  order.precio.usd_reference = usdRef || null;
  order.shipping.deliveryType = deliveryType;
  order.shipping.lastSyncStatus = deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP
    ? "checkout_delivery_method:retail_pickup"
    : "checkout_delivery_method:correo_argentino";
  order.shipping.status = deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP
    ? SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT
    : SHIPPING_STATUS.PENDING_SHIPPING_DATA;
  order.shipping.currentTrackingStatus = deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP
    ? "no_aplica_retiro_en_tienda"
    : "";
  order.shipping.trackingEvents = deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP ? [] : order.shipping.trackingEvents;

  const savedOrder = await store.createOrder(order);
  const preferenceSubtotal = round2(toNumber(savedOrder.subtotal, 0));
  const preferenceShipping = round2(toNumber(savedOrder.shippingCost, 0));
  const preferenceItems = [
    {
      id: savedOrder.items[0].productId,
      title: savedOrder.items[0].title,
      unit_price: preferenceSubtotal,
      quantity: 1,
    },
  ];
  if(preferenceShipping > 0){
    preferenceItems.push({
      id: "shipping",
      title: "Envio a domicilio",
      unit_price: preferenceShipping,
      quantity: 1,
    });
  }
  if(config.FLOW_DIAGNOSTIC){
    logger.info("DIAG order/created", {
      order_id: savedOrder && savedOrder.id,
      delivery_method: savedOrder && savedOrder.deliveryMethod,
      delivery_type: savedOrder && savedOrder.shipping && savedOrder.shipping.deliveryType,
      subtotal: savedOrder && savedOrder.subtotal,
      shipping_cost: savedOrder && savedOrder.shippingCost,
      total: savedOrder && savedOrder.total,
      source: savedOrder && savedOrder.source,
    });
  }

  const preference = await mercadoPago.createPreference({
    order: savedOrder,
    items: preferenceItems,
  });

  const updated = await store.updateOrderById(savedOrder.id, (current)=>{
    let next = { ...current };
    next.mercadoPago = {
      ...(current.mercadoPago || {}),
      preferenceId: preference.preferenceId,
      externalReference: current.id,
      checkoutUrl: preference.checkoutUrl,
      status: "created",
      mode: preference.mode,
      fallbackFromReal: Boolean(preference.fallback_from_real),
      rawPreferenceResponse: preference.raw || null,
    };

    next = appendHistory(next, "checkout_preference_created", {
      preference_id: preference.preferenceId,
      mode: preference.mode,
      fallback_from_real: Boolean(preference.fallback_from_real),
      total: next.total,
      shippingCost: next.shippingCost,
    });

    return syncLegacyFields(next);
  });

  return {
    order: updated,
    preference,
  };
}

async function applyPaymentToOrder({ orderId, payment, source, pendingReasonOverride }){
  const paymentId = payment && payment.id ? String(payment.id) : null;
  const paymentStatusInput = payment && Object.prototype.hasOwnProperty.call(payment, "status")
    ? payment.status
    : undefined;
  const hasExplicitPaymentStatus = normalize(paymentStatusInput) !== "";
  const paymentStatusRaw = hasExplicitPaymentStatus ? normalize(paymentStatusInput) : PAYMENT_STATUS.PENDING;
  const paymentStatus = mapPaymentStatus(paymentStatusRaw);
  const paymentPendingReason = typeof pendingReasonOverride !== "undefined"
    ? pendingReasonOverride
    : resolvePaymentPendingReason({
      hasExplicitPaymentStatus,
      paymentStatusRaw,
      paymentStatus,
    });
  const paymentDetail = payment && payment.status_detail ? payment.status_detail : null;
  const buyerName = getBuyerNameFromPayment(payment);
  const buyerEmail = payment && payment.payer && payment.payer.email ? String(payment.payer.email) : "";

  if(paymentPendingReason === PAYMENT_PENDING_REASON.FALLBACK_MISSING_STATUS
    || paymentPendingReason === PAYMENT_PENDING_REASON.FALLBACK_UNKNOWN_STATUS){
    logger.warn("Pago marcado pending por fallback", {
      order_id: orderId,
      payment_id: paymentId,
      source: source || "unknown",
      status_raw: paymentStatusRaw,
      pending_reason: paymentPendingReason,
    });
  }

  return store.updateOrderById(orderId, (current)=>{
    if(!current) return current;

    let next = { ...current };

    next.payment = {
      ...(current.payment || {}),
      status: paymentStatus,
      paymentId: paymentId || (current.payment && current.payment.paymentId) || null,
      statusDetail: paymentDetail,
      rawLastResponse: {
        id: paymentId,
        status: paymentStatusRaw,
        status_detail: paymentDetail,
        external_reference: payment.external_reference || null,
      },
      pendingReason: paymentPendingReason || undefined,
    };

    if(!paymentPendingReason){
      delete next.payment.pendingReason;
    }

    if(buyerName){
      next.customer = { ...(next.customer || {}), name: buyerName };
    }
    const buyerEmailNormalized = normalize(buyerEmail);
    if(buyerEmailNormalized && isValidEmail(buyerEmailNormalized) && !isMercadoPagoSandboxEmail(buyerEmailNormalized)){
      next.customer = { ...(next.customer || {}), email: buyerEmailNormalized };
    }

    if(paymentStatus === PAYMENT_STATUS.APPROVED && !next.saleDate){
      next.saleDate = new Date().toISOString();
    }

    if(paymentStatus === PAYMENT_STATUS.APPROVED){
      next = ensureShippingForApprovedOrder(next);
    }

    next.mercadoPago = {
      ...(current.mercadoPago || {}),
      status: paymentStatusRaw,
      lastPaymentPayload: {
        id: paymentId,
        status: paymentStatusRaw,
        status_detail: paymentDetail,
        external_reference: payment.external_reference || null,
      },
    };

    next = appendHistory(next, "payment_updated", {
      source: source || "unknown",
      payment_id: paymentId,
      payment_status: paymentStatusRaw,
      mapped_status: paymentStatus,
    });

    return syncLegacyFields(next);
  });
}

function hasApprovedEmailSent(order){
  return Boolean(
    order
    && Array.isArray(order.history)
    && order.history.some((entry)=> entry && entry.event === "approved_email_sent")
  );
}

function hasCustomerDataAdminEmailSent(order){
  return Boolean(
    order
    && Array.isArray(order.history)
    && order.history.some((entry)=> entry && entry.event === "customer_data_admin_email_sent")
  );
}

async function sendAdminEmailAfterCustomerData(order, source){
  if(!order || !order.payment || order.payment.status !== PAYMENT_STATUS.APPROVED){
    return {
      attempted: false,
      sent: false,
      reason: "payment_not_approved",
    };
  }

  if(hasCustomerDataAdminEmailSent(order)){
    return {
      attempted: false,
      sent: false,
      reason: "already_sent",
    };
  }

  try{
    const adminResult = await emailService.sendAdminEmail(order);

    if(adminResult && adminResult.sent){
      await store.updateOrderById(order.id, (current)=>{
        if(!current) return current;
        if(hasCustomerDataAdminEmailSent(current)) return current;

        let next = appendHistory(current, "customer_data_admin_email_sent", {
          source: source || "unknown",
          to: adminResult.to || "",
        });

        return syncLegacyFields(next);
      });
    }

    return adminResult;
  }catch(err){
    logger.error("Error enviando email admin tras datos del cliente.", {
      order_id: order && (order.id || order.id_pedido),
      source: source || "unknown",
      error: err && err.message ? err.message : String(err),
    });

    return {
      attempted: true,
      sent: false,
      reason: "send_failed_unexpected",
      error: err && err.message ? err.message : String(err),
    };
  }
}

async function sendCustomerEmailAfterApprovedOrder(order, source){
  if(!order || !order.payment || order.payment.status !== PAYMENT_STATUS.APPROVED){
    return {
      attempted: false,
      sent: false,
      reason: "payment_not_approved",
    };
  }

  if(hasApprovedEmailSent(order)){
    return {
      attempted: false,
      sent: false,
      reason: "already_sent",
    };
  }

  try{
    const customerResult = await emailService.sendOrderEmail(order);

    if(customerResult && customerResult.sent){
      await store.updateOrderById(order.id, (current)=>{
        if(!current) return current;
        if(hasApprovedEmailSent(current)) return current;

        let next = appendHistory(current, "approved_email_sent", {
          source: source || "unknown",
          to: customerResult.to || "",
        });

        return syncLegacyFields(next);
      });
    }

    return customerResult || { attempted: false, sent: false, reason: "unknown" };
  }catch(err){
    logger.error("Error enviando email automatico por pago aprobado.", {
      order_id: order && (order.id || order.id_pedido),
      source: source || "unknown",
      error: err && err.message ? err.message : String(err),
    });

    return {
      attempted: true,
      sent: false,
      reason: "send_failed_unexpected",
      error: err && err.message ? err.message : String(err),
    };
  }
}

function triggerApprovedPaymentEmail(order, source){
  Promise.resolve(sendCustomerEmailAfterApprovedOrder(order, source)).catch(()=>{});
}

async function confirmCheckout({ orderId, accessToken, paymentId, status }){
  const order = await store.getOrderById(orderId);
  if(accessToken){
    ensureOrderAccess(order, accessToken);
  }else{
    ensureOrderExists(order);
  }

  if(order.payment && order.payment.status === PAYMENT_STATUS.APPROVED){
    return { order: toClientOrder(order), alreadyApproved: true };
  }

  const orderCheckoutMode = String(order.mercadoPago && order.mercadoPago.mode || order.mercado_pago && order.mercado_pago.mode || "").toLowerCase();
  const useRealValidation = mercadoPago.isRealMode() && orderCheckoutMode === "real";

  if(useRealValidation){
    if(!paymentId){
      throw httpError(400, "No se recibio payment_id para validar el pago.");
    }

    const payment = await mercadoPago.getPaymentById(paymentId);
    if(payment.external_reference && payment.external_reference !== order.id){
      throw httpError(400, "El pago no corresponde al pedido indicado.");
    }

    const updated = await applyPaymentToOrder({
      orderId: order.id,
      payment,
      source: "checkout_confirm",
    });

    triggerApprovedPaymentEmail(updated, "checkout_confirm");

    return { order: toClientOrder(updated), alreadyApproved: false };
  }

  const hint = safeLower(status);
  const isApproved = hint === "approved";
  const isAbandoned = hint === "abandoned";
  const mockPayment = {
    id: paymentId || `MOCK-PAY-${Date.now()}`,
    status: isApproved ? "approved" : (isAbandoned ? "pending" : "rejected"),
    status_detail: isApproved ? "accredited" : (isAbandoned ? "checkout_abandoned" : "cc_rejected_bad_filled_card_number"),
    external_reference: order.id,
    payer: {
      email: order.customer && order.customer.email ? order.customer.email : "",
      first_name: "",
      last_name: "",
    },
  };

  const updated = await applyPaymentToOrder({
    orderId: order.id,
    payment: mockPayment,
    source: orderCheckoutMode === "mock" ? "checkout_confirm_mock" : "checkout_confirm_mock_fallback",
    pendingReasonOverride: isAbandoned ? PAYMENT_PENDING_REASON.CHECKOUT_ABANDONED : undefined,
  });

  triggerApprovedPaymentEmail(updated, "checkout_confirm_mock");

  return { order: toClientOrder(updated), alreadyApproved: false };
}

async function confirmCheckoutFromReturn({ externalReference, paymentId, status }){
  const orderId = normalize(externalReference);
  if(!orderId){
    throw httpError(400, "external_reference es obligatorio.");
  }
  if(!paymentId){
    throw httpError(400, "payment_id es obligatorio.");
  }

  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  return confirmCheckout({
    orderId: order.id,
    accessToken: order.accessToken,
    paymentId,
    status,
  });
}
async function processMercadoPagoWebhook(req){
  const topic = mercadoPago.extractWebhookType(req);
  if(topic && !topic.includes("payment")){
    return { ignored: true, reason: "topic_not_payment" };
  }

  const paymentId = mercadoPago.extractPaymentIdFromWebhook(req);
  if(!paymentId){
    return { ignored: true, reason: "payment_id_missing" };
  }

  const payment = await mercadoPago.getPaymentById(paymentId);
  const orderId = payment.external_reference || (payment.metadata && payment.metadata.order_id) || null;
  if(!orderId){
    return { ignored: true, reason: "external_reference_missing", paymentId };
  }

  const order = await store.getOrderById(orderId);
  if(!order){
    return { ignored: true, reason: "order_not_found", orderId, paymentId };
  }

  const wasApprovedBeforeWebhook = Boolean(order.payment && order.payment.status === PAYMENT_STATUS.APPROVED);

  const updated = await applyPaymentToOrder({
    orderId: order.id,
    payment,
    source: "webhook",
  });

  if(!wasApprovedBeforeWebhook && updated && updated.payment && updated.payment.status === PAYMENT_STATUS.APPROVED){
    triggerApprovedPaymentEmail(updated, "webhook");
  }

  return {
    ignored: false,
    orderId: updated.id,
    paymentId,
    paymentStatus: updated.payment.status,
  };
}

function toClientOrder(order){
  if(!order) return null;

  const mapped = syncLegacyFields(order);
  const pickupName = mapped.pickupContactName || (mapped.pickupContact && mapped.pickupContact.name) || "";
  const pickupPhone = mapped.pickupContactPhone || (mapped.pickupContact && mapped.pickupContact.phone) || "";
  const pickupEmail = mapped.pickupContactEmail
    || (mapped.pickupContact && mapped.pickupContact.email)
    || (mapped.customer && mapped.customer.email)
    || (mapped.shipping && mapped.shipping.address && mapped.shipping.address.email)
    || "";
  const customerName = (mapped.customer && mapped.customer.name) || pickupName || "";
  const customerPhone = (mapped.customer && mapped.customer.phone) || pickupPhone || "";
  const customerEmail = (mapped.customer && mapped.customer.email) || pickupEmail || "";
  const sanitized = {
    ...mapped,

    id: mapped.id,
    createdAt: mapped.createdAt,
    saleDate: mapped.saleDate,

    customer: {
      ...(mapped.customer || {}),
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    },
    items: mapped.items,
    subtotal: mapped.subtotal,
    shippingCost: mapped.shippingCost,
    total: mapped.total,
    currency: mapped.currency,
    deliveryMethod: mapped.deliveryMethod || mapped.metodo_entrega || DELIVERY_METHOD.CORREO_ARGENTINO,
    pickupContactName: pickupName,
    pickupContactPhone: pickupPhone,
    pickupContactEmail: pickupEmail,
    pickupContact: {
      ...(mapped.pickupContact || {}),
      name: pickupName,
      phone: pickupPhone,
      email: pickupEmail,
    },

    paymentStatus: mapped.payment && mapped.payment.status,
    shippingStatus: mapped.shipping && mapped.shipping.status,

    deliveryType: mapped.shipping && mapped.shipping.deliveryType,
    agencyId: mapped.shipping && mapped.shipping.agencyId,
    trackingNumber: mapped.shipping && mapped.shipping.trackingNumber,
    shipmentClientId: mapped.shipping && mapped.shipping.shipmentClientId,
    labelPath: mapped.shipping && mapped.shipping.labelPath,
    labelUrl: mapped.shipping && mapped.shipping.labelUrl,
    lastShippingSyncStatus: mapped.shipping && mapped.shipping.lastSyncStatus,
    trackingCurrentStatus: mapped.shipping && mapped.shipping.currentTrackingStatus,
    trackingEvents: mapped.shipping && Array.isArray(mapped.shipping.trackingEvents) ? mapped.shipping.trackingEvents : [],
    internalNotes: mapped.internalNotes || "",
    shippingAddress: mapped.shipping && mapped.shipping.address,

    shipmentProvider: mapped.shipping && mapped.shipping.provider,

    payment: mapped.payment,
    shipping: mapped.shipping,
    mercadoPago: mapped.mercadoPago,

    accessToken: undefined,
    access_token: undefined,
  };

  return sanitized;
}

async function getOrderForClient({ orderId, accessToken }){
  const order = await store.getOrderById(orderId);
  if(accessToken){
    ensureOrderAccess(order, accessToken);
  }else{
    ensureOrderExists(order);
  }
  return toClientOrder(order);
}

async function savePickupContact({ orderId, accessToken, form }){
  const order = await store.getOrderById(orderId);
  if(accessToken){
    ensureOrderAccess(order, accessToken);
  }else{
    ensureOrderExists(order);
  }

  if(!order || !order.payment || order.payment.status !== PAYMENT_STATUS.APPROVED){
    throw httpError(409, "Solo podes confirmar retiro con pago aprobado.");
  }

  const deliveryMethod = resolveDeliveryMethod(order.deliveryMethod);
  if(deliveryMethod !== DELIVERY_METHOD.RETAIL_PICKUP){
    throw httpError(409, "Este pedido no es retiro en tienda.");
  }

  const existingPickupName = normalize(order && (order.pickupContactName || order.pickup_contact_name || order.pickupContact && order.pickupContact.name));
  const existingPickupPhone = normalize(order && (order.pickupContactPhone || order.pickup_contact_phone || order.pickupContact && order.pickupContact.phone));
  const existingEmail = normalize(order && (
    order.pickupContactEmail
    || order.pickup_contact_email
    || order.pickupContact && order.pickupContact.email
    || order.customer && order.customer.email
    || order.shipping && order.shipping.address && order.shipping.address.email
  ));

  if(order.shippingSubmittedAt && existingPickupName && existingPickupPhone && existingEmail){
    return {
      order: toClientOrder(order),
      alreadySubmitted: true,
      shipment: null,
      email: {
        attempted: false,
        sent: false,
        reason: "already_submitted",
      },
    };
  }

  const pickupData = validatePickupInput(form || {});

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };

    next.deliveryMethod = DELIVERY_METHOD.RETAIL_PICKUP;
    next.pickupContact = {
      ...(next.pickupContact || {}),
      name: pickupData.name,
      phone: pickupData.phone,
      email: pickupData.email,
    };
    next.pickupContactEmail = pickupData.email;
    next.pickup_contact_email = pickupData.email;
    next.customer = {
      ...(next.customer || {}),
      name: pickupData.name || (next.customer && next.customer.name) || "",
      phone: pickupData.phone || (next.customer && next.customer.phone) || "",
      email: pickupData.email || (next.customer && next.customer.email) || "",
    };
    next.shipping = {
      ...(next.shipping || {}),
      status: SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT,
      currentTrackingStatus: "no_aplica_retiro_en_tienda",
      trackingEvents: [],
      nombre_apellido: pickupData.name,
      telefono: pickupData.phone,
      address: {
        ...(next.shipping && next.shipping.address ? next.shipping.address : {}),
        email: pickupData.email,
      },
      lastSyncStatus: "pickup_data_saved",
    };
    next.shippingCost = 0;
    next.total = round2((next.subtotal || 0) + next.shippingCost);
    next.shippingSubmittedAt = new Date().toISOString();

    next = appendHistory(next, "pickup_contact_saved", {
      deliveryMethod: next.deliveryMethod,
      pickupContactName: pickupData.name,
      pickupContactPhone: pickupData.phone,
      customerEmail: pickupData.email,
      shippingCost: next.shippingCost,
      total: next.total,
    });

    return recalculateTotals(next);
  });

  const emailResult = await sendCustomerEmailAfterApprovedOrder(updated, "pickup_contact_saved");
  await sendAdminEmailAfterCustomerData(updated, "pickup_contact_saved");

  if(config.FLOW_DIAGNOSTIC){
    logger.info("DIAG order/pickup_saved", {
      order_id: updated && updated.id,
      pickup_contact_name: updated && updated.pickupContactName,
      pickup_contact_phone: updated && updated.pickupContactPhone,
      customer_email: updated && updated.customer && updated.customer.email,
      shipping_submitted_at: updated && updated.shippingSubmittedAt,
      email_sent: Boolean(emailResult && emailResult.sent),
      email_reason: emailResult && emailResult.reason ? emailResult.reason : "",
    });
  }

  return {
    order: toClientOrder(updated),
    alreadySubmitted: false,
    shipment: null,
    email: emailResult,
  };
}

async function saveShipping({ orderId, accessToken, form }){
  const order = await store.getOrderById(orderId);
  if(accessToken){
    ensureOrderAccess(order, accessToken);
  }else{
    ensureOrderExists(order);
  }

  if(!order || !order.payment || order.payment.status !== PAYMENT_STATUS.APPROVED){
    throw httpError(409, "Solo podes cargar envio con pago aprobado.");
  }

  const deliveryMethod = resolveDeliveryMethod(order.deliveryMethod);
  if(deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP){
    // Compatibilidad: si llega por /shipping y el pedido es pickup,
    // reutilizamos el flujo dedicado de retiro.
    return savePickupContact({ orderId, accessToken, form });
  }

  const shippingData = validateShippingInput(form || {});

  if(order.shippingSubmittedAt){
    return {
      order: toClientOrder(order),
      alreadySubmitted: true,
      shipment: null,
      email: {
        attempted: false,
        sent: false,
        reason: "already_submitted",
      },
    };
  }

  const afterAddress = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };

    next.customer = {
      ...(next.customer || {}),
      name: shippingData.address.receiverName || (next.customer && next.customer.name) || "",
      phone: shippingData.address.phone || shippingData.address.cellphone || (next.customer && next.customer.phone) || "",
      email: shippingData.address.email || (next.customer && next.customer.email) || "",
    };

    next.shipping = {
      ...(next.shipping || {}),
      status: SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT,
      deliveryType: shippingData.deliveryType,
      agencyId: shippingData.agencyId,
      address: {
        ...(next.shipping && next.shipping.address ? next.shipping.address : {}),
        ...shippingData.address,
      },
      provider: next.shipping && next.shipping.provider ? next.shipping.provider : "mock",
      lastSyncStatus: "shipping_data_saved",
    };

    next.pickupContact = {
      ...(next.pickupContact || {}),
      name: "",
      phone: "",
      email: "",
    };

    next.deliveryMethod = resolveDeliveryMethod(next.deliveryMethod);
    next.shippingCost = shippingCostByDeliveryMethod(next.deliveryMethod, next.producto && next.producto.categoria);
    next.total = round2((next.subtotal || 0) + next.shippingCost);
    next.shippingSubmittedAt = new Date().toISOString();

    next = appendHistory(next, "shipping_data_saved", {
      shippingStatus: next.shipping.status,
      deliveryMethod: next.deliveryMethod,
      customerEmail: shippingData.address.email,
      shippingCost: next.shippingCost,
      total: next.total,
    });

    return recalculateTotals(next);
  });

  let shipment = null;
  let finalOrder = afterAddress;

  if(config.SHIPPING_AUTO_CREATE_ON_CUSTOMER_FORM){
    const creation = await createShipmentForOrderInternal(afterAddress.id, {
      force: false,
      source: "customer_form_auto",
    });
    shipment = creation.shipment;
    finalOrder = creation.order;
  }

  const emailResult = await sendCustomerEmailAfterApprovedOrder(finalOrder, "shipping_data_saved");
  await sendAdminEmailAfterCustomerData(finalOrder, "shipping_data_saved");

  if(config.FLOW_DIAGNOSTIC){
    logger.info("DIAG order/shipping_saved", {
      order_id: finalOrder && finalOrder.id,
      delivery_method: finalOrder && finalOrder.deliveryMethod,
      shipping_status: finalOrder && finalOrder.shipping && finalOrder.shipping.status,
      shipping_submitted_at: finalOrder && finalOrder.shippingSubmittedAt,
      auto_shipment: Boolean(shipment),
      tracking: shipment && shipment.trackingNumber ? shipment.trackingNumber : "",
      email_sent: Boolean(emailResult && emailResult.sent),
      email_reason: emailResult && emailResult.reason ? emailResult.reason : "",
    });
  }

  return {
    order: toClientOrder(finalOrder),
    alreadySubmitted: false,
    shipment,
    email: emailResult,
  };
}

async function saveShippingAdmin({ orderId, form }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  const shippingData = validateShippingInput(form || {});

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };
    next.customer = {
      ...(next.customer || {}),
      name: shippingData.address.receiverName || (next.customer && next.customer.name) || "",
      phone: shippingData.address.phone || shippingData.address.cellphone || (next.customer && next.customer.phone) || "",
      email: shippingData.address.email || (next.customer && next.customer.email) || "",
    };

    next.shipping = {
      ...(next.shipping || {}),
      address: {
        ...(next.shipping && next.shipping.address ? next.shipping.address : {}),
        ...shippingData.address,
      },
      deliveryType: shippingData.deliveryType,
      agencyId: shippingData.agencyId,
      status: SHIPPING_STATUS.READY_TO_CREATE_SHIPMENT,
      lastSyncStatus: "shipping_data_saved_admin",
    };

    next.deliveryMethod = resolveDeliveryMethod(next.deliveryMethod);
    next.shippingCost = shippingCostByDeliveryMethod(next.deliveryMethod, next.producto && next.producto.categoria);
    next.total = round2((next.subtotal || 0) + next.shippingCost);

    next = appendHistory(next, "admin_shipping_updated", {
      deliveryMethod: next.deliveryMethod,
      shippingCost: next.shippingCost,
      total: next.total,
    });

    return recalculateTotals(next);
  });

  return toClientOrder(updated);
}

async function createShipmentForOrderInternal(orderId, options){
  const opts = options || {};
  const force = Boolean(opts.force);

  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  if(!order.payment || order.payment.status !== PAYMENT_STATUS.APPROVED){
    throw httpError(409, "No se puede crear envio: el pago no esta aprobado.");
  }

  if(resolveDeliveryMethod(order.deliveryMethod) === DELIVERY_METHOD.RETAIL_PICKUP){
    throw httpError(409, "Este pedido es retiro en tienda. No requiere creacion de envio.");
  }

  if(!hasShippingAddress(order)){
    throw httpError(409, "No se puede crear envio: faltan datos de envio.");
  }

  if(order.shipping && order.shipping.trackingNumber && !force){
    throw httpError(409, "El pedido ya tiene tracking. Usa regeneracion forzada si queres recrear el envio.");
  }

  const shipment = await shippingService.createShipment(order, {
    preferredProvider: order.shipping && order.shipping.provider,
  });

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };

    next.shipping = {
      ...(next.shipping || {}),
      provider: shipment.provider || (next.shipping && next.shipping.provider) || "mock",
      lastSyncStatus: shipment.message || "shipment_create_attempt",
      rawShipmentResponse: shipment.raw || null,
    };

    if(shipment.success){
      next.shipping.status = SHIPPING_STATUS.SHIPMENT_CREATED;
      next.shipping.trackingNumber = shipment.trackingNumber || next.shipping.trackingNumber || "";
      next.shipping.shipmentClientId = shipment.shipmentClientId || next.shipping.shipmentClientId || "";
      next.shipping.currentTrackingStatus = "shipment_created";
      next.shipping.trackingEvents = [
        buildMockTrackingEvent("shipment_created", "Envio mock creado desde panel admin."),
      ];
    }else{
      next.shipping.status = SHIPPING_STATUS.SHIPPING_ERROR;
    }

    next = appendHistory(next, "shipment_generation_attempt", {
      success: Boolean(shipment.success),
      provider: next.shipping.provider,
      tracking: next.shipping.trackingNumber,
      message: shipment.message || null,
      source: opts.source || "admin",
      fallback_from_provider: Boolean(shipment.fallback_from_provider),
      fallback_reason: shipment.fallback_reason || null,
    });

    return syncLegacyFields(next);
  });

  return {
    order: updated,
    shipment,
  };
}

async function createShipmentForAdmin({ orderId, force }){
  const result = await createShipmentForOrderInternal(orderId, {
    force: Boolean(force),
    source: "admin",
  });
  return {
    order: toClientOrder(result.order),
    shipment: result.shipment,
  };
}

async function advanceMockTrackingForAdmin({ orderId, status }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  if(!order.shipping || !order.shipping.trackingNumber){
    throw httpError(409, "El pedido no tiene tracking. Primero crea el envio.");
  }

  const provider = safeLower(order.shipping.provider || "mock");
  if(provider !== "mock"){
    throw httpError(409, "El avance manual de tracking solo esta habilitado para provider mock.");
  }

  const targetStatus = safeLower(status);
  if(!MOCK_TRACKING_FLOW.includes(targetStatus)){
    throw httpError(400, `Estado de tracking mock invalido: ${status}`);
  }

  const currentStatus = getCurrentTrackingStatus(order) || "shipment_created";
  const currentIdx = MOCK_TRACKING_FLOW.indexOf(currentStatus);
  const targetIdx = MOCK_TRACKING_FLOW.indexOf(targetStatus);

  if(targetIdx < currentIdx){
    throw httpError(409, "No se puede volver atras en tracking mock.");
  }

  if(targetIdx === currentIdx){
    return {
      order: toClientOrder(order),
      tracking: {
        success: true,
        currentStatus: currentStatus,
        events: normalizeTrackingEvents(order.shipping && order.shipping.trackingEvents),
        message: "El pedido ya estaba en ese estado.",
      },
    };
  }

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };
    const existingEvents = normalizeTrackingEvents(next.shipping && next.shipping.trackingEvents);

    next.shipping = {
      ...(next.shipping || {}),
      currentTrackingStatus: targetStatus,
      trackingEvents: [
        ...existingEvents,
        buildMockTrackingEvent(targetStatus, "Actualizacion manual desde panel admin."),
      ],
      lastSyncStatus: `mock_tracking:${targetStatus}`,
    };

    const mappedShippingStatus = mapMockTrackingToShippingStatus(targetStatus);
    if(mappedShippingStatus){
      next.shipping.status = mappedShippingStatus;
    }

    next = appendHistory(next, "mock_tracking_advanced", {
      from: currentStatus,
      to: targetStatus,
      shippingStatus: next.shipping.status,
      tracking: next.shipping.trackingNumber,
    });

    return syncLegacyFields(next);
  });

  return {
    order: toClientOrder(updated),
    tracking: {
      success: true,
      currentStatus: targetStatus,
      events: normalizeTrackingEvents(updated.shipping && updated.shipping.trackingEvents),
      message: `Tracking mock actualizado a ${targetStatus}.`,
    },
  };
}

async function getLabelForAdmin({ orderId, force }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  const hasLabel = Boolean(order.shipping && order.shipping.labelPath);
  if(hasLabel && !force){
    return {
      order: toClientOrder(order),
      label: {
        success: true,
        provider: order.shipping.provider,
        labelPath: order.shipping.labelPath,
        labelUrl: order.shipping.labelUrl,
        message: "Etiqueta ya disponible.",
      },
    };
  }

  if(!order.shipping || (!order.shipping.trackingNumber && !order.shipping.shipmentClientId)){
    throw httpError(409, "No hay tracking/shipment para obtener etiqueta.");
  }

  const labelResult = await shippingService.getLabel(order, {
    preferredProvider: order.shipping.provider,
  });

  const persisted = labelResult.success
    ? await persistLabelData(order, labelResult)
    : { labelPath: "", labelFileName: "" };

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };

    next.shipping = {
      ...(next.shipping || {}),
      provider: labelResult.provider || (next.shipping && next.shipping.provider) || "mock",
      lastSyncStatus: labelResult.message || "label_attempt",
      rawLabelResponse: labelResult.raw || null,
    };

    if(labelResult.success){
      next.shipping.status = SHIPPING_STATUS.LABEL_READY;
      next.shipping.labelPath = persisted.labelPath;
      next.shipping.labelUrl = persisted.labelPath ? `/api/admin/orders/${encodeURIComponent(next.id)}/label` : "";
    }else if(next.shipping.status !== SHIPPING_STATUS.SHIPPING_ERROR){
      next.shipping.status = SHIPPING_STATUS.SHIPPING_ERROR;
    }

    next = appendHistory(next, "label_generation_attempt", {
      success: Boolean(labelResult.success),
      provider: next.shipping.provider,
      labelPath: next.shipping.labelPath || null,
      message: labelResult.message || null,
    });

    return syncLegacyFields(next);
  });

  return {
    order: toClientOrder(updated),
    label: {
      ...labelResult,
      labelPath: updated.shipping && updated.shipping.labelPath,
      labelUrl: updated.shipping && updated.shipping.labelUrl,
    },
  };
}

async function refreshTrackingForAdmin({ orderId }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  if(!order.shipping || !order.shipping.trackingNumber){
    throw httpError(409, "El pedido no tiene tracking para refrescar.");
  }

  const trackingResult = await shippingService.getTracking(order.shipping.trackingNumber, {
    preferredProvider: order.shipping.provider,
  });

  const normalizedEvents = normalizeTrackingEvents(trackingResult.events);
  const currentTrackingStatus = safeLower(trackingResult.currentStatus) || (normalizedEvents.length ? safeLower(normalizedEvents[normalizedEvents.length - 1].status) : "");
  const mappedStatus = mapTrackingStatusToShippingStatus(currentTrackingStatus);

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };

    next.shipping = {
      ...(next.shipping || {}),
      provider: trackingResult.provider || (next.shipping && next.shipping.provider) || "mock",
      lastSyncStatus: trackingResult.message || trackingResult.currentStatus || "tracking_refresh",
      trackingEvents: normalizedEvents.length ? normalizedEvents : normalizeTrackingEvents(next.shipping && next.shipping.trackingEvents),
      currentTrackingStatus: currentTrackingStatus || safeLower(next.shipping && next.shipping.currentTrackingStatus),
    };

    if(mappedStatus){
      next.shipping.status = mappedStatus;
    }

    next = appendHistory(next, "tracking_refresh", {
      success: Boolean(trackingResult.success),
      provider: next.shipping.provider,
      currentStatus: trackingResult.currentStatus || null,
      normalizedCurrentStatus: currentTrackingStatus || null,
      mappedStatus: mappedStatus || null,
    });

    return syncLegacyFields(next);
  });

  return {
    order: toClientOrder(updated),
    tracking: trackingResult,
  };
}

async function markDispatchedForAdmin({ orderId }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };
    next.shipping = {
      ...(next.shipping || {}),
      status: SHIPPING_STATUS.DISPATCHED,
      lastSyncStatus: "marked_dispatched_admin",
    };
    next = appendHistory(next, "marked_dispatched", { by: "admin" });
    return syncLegacyFields(next);
  });

  return toClientOrder(updated);
}

async function cancelOrderForAdmin({ orderId, reason }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  let cancelResult = null;
  if(order.shipping && order.shipping.trackingNumber){
    cancelResult = await shippingService.cancelShipment(order.shipping.trackingNumber, {
      preferredProvider: order.shipping.provider,
    });
  }

  const updated = await store.updateOrderById(order.id, (current)=>{
    let next = { ...current };

    next.shipping = {
      ...(next.shipping || {}),
      status: SHIPPING_STATUS.CANCELLED,
      lastSyncStatus: cancelResult && cancelResult.message ? cancelResult.message : "cancelled_admin",
    };

    if(reason){
      next.internalNotes = `${next.internalNotes || ""}${next.internalNotes ? "\n" : ""}[cancel] ${reason}`;
    }

    next = appendHistory(next, "order_cancelled", {
      by: "admin",
      reason: reason || null,
      cancelShipmentSuccess: cancelResult ? Boolean(cancelResult.success) : null,
    });

    return syncLegacyFields(next);
  });

  return {
    order: toClientOrder(updated),
    cancelShipment: cancelResult,
  };
}

async function listAgenciesForAdmin(filters){
  return shippingService.listAgencies(filters || {}, {
    preferredProvider: "correo_argentino",
  });
}

async function getOrderForAdmin({ orderId }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);
  return toClientOrder(order);
}

async function listOrders(filters){
  const orders = await store.listOrders(filters || {});
  return orders.map((order)=> toClientOrder(order));
}

async function getLabelFileForAdmin({ orderId }){
  const order = await store.getOrderById(orderId);
  ensureOrderExists(order);

  const labelPath = order.shipping && order.shipping.labelPath ? order.shipping.labelPath : "";
  if(!labelPath){
    throw httpError(404, "Este pedido no tiene etiqueta generada.");
  }

  const resolved = path.resolve(labelPath);
  const allowedRoot = path.resolve(config.LABELS_DIR);
  if(!resolved.startsWith(allowedRoot)){
    throw httpError(403, "Ruta de etiqueta invalida.");
  }

  return {
    order: toClientOrder(order),
    filePath: resolved,
    fileName: path.basename(resolved),
  };
}

module.exports = {
  createCheckout,
  confirmCheckout,
  confirmCheckoutFromReturn,
  processMercadoPagoWebhook,
  getOrderForClient,
  getOrderForAdmin,
  savePickupContact,
  saveShipping,
  saveShippingAdmin,
  createShipmentForAdmin,
  advanceMockTrackingForAdmin,
  getLabelForAdmin,
  getLabelFileForAdmin,
  refreshTrackingForAdmin,
  markDispatchedForAdmin,
  cancelOrderForAdmin,
  listAgenciesForAdmin,
  listOrders,
  httpError,
};


































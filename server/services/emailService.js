const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const config = require("../config");
const logger = require("../logger");
const { DELIVERY_METHOD } = require("../models/orderModel");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// LEGACY SMTP DISABLED - DO NOT USE
const LEGACY_SMTP_DISABLED = true;

let cachedTransport = null;
let cachedTransportKey = "";

function normalize(value){
  return String(value || "").trim();
}

function safeLower(value){
  return normalize(value).toLowerCase();
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value){
  return EMAIL_RE.test(normalize(value));
}

function money(value, currency){
  const amount = Number(value || 0);
  return `${currency || "ARS"} ${amount.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getPrimaryProductTitle(order){
  if(order && Array.isArray(order.items) && order.items.length){
    return normalize(order.items[0].title) || "Producto";
  }
  if(order && order.producto && order.producto.nombre){
    return normalize(order.producto.nombre) || "Producto";
  }
  return "Producto";
}

function resolveDeliveryMethod(order){
  const raw = safeLower(order && (order.deliveryMethod || order.metodo_entrega));
  if(raw === DELIVERY_METHOD.RETAIL_PICKUP) return DELIVERY_METHOD.RETAIL_PICKUP;
  return DELIVERY_METHOD.CORREO_ARGENTINO;
}

function getPickupShowroom(source){
  const input = source && typeof source === "object" ? source : {};

  return {
    address: normalize(input.address || config.PICKUP_SHOWROOM_ADDRESS) || "-",
    locality: normalize(input.locality || config.PICKUP_SHOWROOM_LOCALITY) || "-",
    hours: normalize(input.hours || config.PICKUP_SHOWROOM_HOURS) || "A coordinar",
  };
}

function pickupTemplate(order, pickupShowroom){
  const productTitle = getPrimaryProductTitle(order);
  const totalFormatted = money(order && order.total, order && order.currency);
  const pickupName = normalize(order && (order.pickupContactName || order.pickup_contact_name || order.customer && order.customer.name)) || "-";
  const pickupPhone = normalize(order && (order.pickupContactPhone || order.pickup_contact_phone || order.customer && order.customer.phone)) || "-";
  const customerEmail = normalize(order && order.customer && order.customer.email) || "-";
  const showroom = getPickupShowroom(pickupShowroom);

  const subject = "Pedido confirmado - SantelmoComputacion";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:640px;margin:0 auto;">
      <h1 style="margin:0 0 12px;font-size:24px;">Pedido confirmado</h1>
      <p style="margin:0 0 12px;">Gracias por tu compra.</p>

      <div style="border:1px solid #d7dbe3;border-radius:10px;padding:12px 14px;margin:0 0 12px;background:#f8fafc;">
        <div><strong>Pedido:</strong> ${escapeHtml(order && order.id_pedido || order && order.id || "-")}</div>
        <div><strong>Producto:</strong> ${escapeHtml(productTitle)}</div>
        <div><strong>Total:</strong> ${escapeHtml(totalFormatted)}</div>
      </div>

      <h2 style="margin:14px 0 8px;font-size:18px;">Retiro en tienda</h2>
      <div style="border:1px solid #d7dbe3;border-radius:10px;padding:12px 14px;margin:0 0 12px;">
        <div><strong>Direccion:</strong> ${escapeHtml(showroom.address)}</div>
        <div><strong>Localidad:</strong> ${escapeHtml(showroom.locality)}</div>
        <div><strong>Horario:</strong> ${escapeHtml(showroom.hours)}</div>
      </div>

      <div style="border:1px solid #d7dbe3;border-radius:10px;padding:12px 14px;margin:0 0 12px;">
        <div><strong>Persona que retira:</strong> ${escapeHtml(pickupName)}</div>
        <div><strong>Telefono:</strong> ${escapeHtml(pickupPhone)}</div>
        <div><strong>Email:</strong> ${escapeHtml(customerEmail)}</div>
      </div>

      <p style="margin:0 0 10px;"><strong>Presenta tu numero de pedido al retirar.</strong></p>
      <p style="margin:0;color:#4b5563;">${escapeHtml(config.STORE_NAME || "SantelmoComputacion")}</p>
    </div>
  `;

  const text = [
    "Gracias por tu compra.",
    "",
    `Pedido: ${order && (order.id_pedido || order.id) || "-"}`,
    `Producto: ${productTitle}`,
    `Total: ${totalFormatted}`,
    "",
    "Retiro en tienda",
    `Direccion: ${showroom.address}`,
    `${showroom.locality}`,
    `Horario: ${showroom.hours}`,
    `Persona que retira: ${pickupName}`,
    `Telefono: ${pickupPhone}`,
    `Email: ${customerEmail}`,
    "",
    "Presenta tu numero de pedido al retirar.",
  ].join("\n");

  return { subject, html, text };
}

function shippingTemplate(order){
  const productTitle = getPrimaryProductTitle(order);
  const totalFormatted = money(order && order.total, order && order.currency);
  const customerName = normalize(order && order.customer && order.customer.name) || "-";
  const customerPhone = normalize(order && order.customer && order.customer.phone) || "-";
  const customerEmail = normalize(order && order.customer && order.customer.email) || "-";

  const address = order && order.shipping && order.shipping.address ? order.shipping.address : (order && order.shippingAddress ? order.shippingAddress : {});
  const streetName = normalize(address.streetName) || "-";
  const streetNumber = normalize(address.streetNumber) || "-";
  const floorDepartment = [normalize(address.floor), normalize(address.department)].filter(Boolean).join(" ").trim();
  const cityName = normalize(address.cityName) || "-";
  const state = normalize(address.state) || "-";
  const zipCode = normalize(address.zipCode) || "-";

  const subject = "Pedido confirmado - SantelmoComputacion";
  const floorHtml = floorDepartment ? `<div><strong>Piso / Depto:</strong> ${escapeHtml(floorDepartment)}</div>` : "";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:640px;margin:0 auto;">
      <h1 style="margin:0 0 12px;font-size:24px;">Pedido confirmado</h1>
      <p style="margin:0 0 12px;">Gracias por tu compra.</p>

      <div style="border:1px solid #d7dbe3;border-radius:10px;padding:12px 14px;margin:0 0 12px;background:#f8fafc;">
        <div><strong>Pedido:</strong> ${escapeHtml(order && order.id_pedido || order && order.id || "-")}</div>
        <div><strong>Producto:</strong> ${escapeHtml(productTitle)}</div>
        <div><strong>Total:</strong> ${escapeHtml(totalFormatted)}</div>
      </div>

      <h2 style="margin:14px 0 8px;font-size:18px;">Direccion de envio</h2>
      <div style="border:1px solid #d7dbe3;border-radius:10px;padding:12px 14px;margin:0 0 12px;">
        <div>${escapeHtml(streetName)} ${escapeHtml(streetNumber)}</div>
        ${floorHtml}
        <div>${escapeHtml(cityName)}</div>
        <div>${escapeHtml(state)}</div>
        <div>CP ${escapeHtml(zipCode)}</div>
      </div>

      <div style="border:1px solid #d7dbe3;border-radius:10px;padding:12px 14px;margin:0 0 12px;">
        <div><strong>Estado actual:</strong> Preparando despacho.</div>
        <div>Te enviaremos el numero de seguimiento cuando el envio sea generado.</div>
      </div>

      <div style="border:1px solid #d7dbe3;border-radius:10px;padding:12px 14px;margin:0 0 12px;">
        <div><strong>Nombre del comprador:</strong> ${escapeHtml(customerName)}</div>
        <div><strong>Telefono:</strong> ${escapeHtml(customerPhone)}</div>
        <div><strong>Email:</strong> ${escapeHtml(customerEmail)}</div>
      </div>

      <p style="margin:0;color:#4b5563;">${escapeHtml(config.STORE_NAME || "SantelmoComputacion")}</p>
    </div>
  `;

  const text = [
    "Gracias por tu compra.",
    "",
    `Pedido: ${order && (order.id_pedido || order.id) || "-"}`,
    `Producto: ${productTitle}`,
    `Total: ${totalFormatted}`,
    "",
    "Direccion de envio:",
    `${streetName} ${streetNumber}`.trim(),
    floorDepartment || "",
    cityName,
    state,
    `CP ${zipCode}`,
    "",
    "Estado actual: Preparando despacho.",
    "Te enviaremos el numero de seguimiento cuando el envio sea generado.",
    "",
    `Nombre del comprador: ${customerName}`,
    `Telefono: ${customerPhone}`,
    `Email: ${customerEmail}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

function transportConfigKey(){
  return [
    config.EMAIL_ENABLED,
    config.SMTP_HOST,
    config.SMTP_PORT,
    config.SMTP_SECURE,
    config.SMTP_USER,
    config.SMTP_PASS ? "***" : "",
  ].join("|");
}

function getTransportInfo(){
  if(!config.EMAIL_ENABLED){
    return { enabled: false, reason: "email_disabled" };
  }

  if(!normalize(config.SMTP_HOST)){
    return { enabled: false, reason: "smtp_host_missing" };
  }

  const fromAddress = normalize(config.EMAIL_FROM || config.SMTP_USER);
  if(!fromAddress){
    return { enabled: false, reason: "email_from_missing" };
  }

  const currentKey = transportConfigKey();
  if(cachedTransport && cachedTransportKey === currentKey){
    return { enabled: true, from: fromAddress, transport: cachedTransport };
  }

  const options = {
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT || 587),
    secure: Boolean(config.SMTP_SECURE),
  };

  if(normalize(config.SMTP_USER) && normalize(config.SMTP_PASS)){
    options.auth = {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    };
  }

  cachedTransport = nodemailer.createTransport(options);
  cachedTransportKey = currentKey;

  return { enabled: true, from: fromAddress, transport: cachedTransport };
}

function getResendInfo(){
  const apiKey = normalize(process.env.RESEND_API_KEY);
  if(!apiKey){
    return { enabled: false, reason: "resend_api_key_missing" };
  }

  return {
    enabled: true,
    client: new Resend(apiKey),
  };
}

function isMercadoPagoSandboxEmail(value){
  const email = safeLower(value);
  if(!email) return false;
  return email.endsWith("@testuser.com") || (email.includes("test_user_") && email.includes("@"));
}

function resolveOrderEmailRecipient(order){
  const candidates = [
    order && order.email_comprador,
    order && order.shipping && order.shipping.address && order.shipping.address.email,
    order && order.pickupContactEmail,
    order && order.pickup_contact_email,
    order && order.pickupContact && order.pickupContact.email,
    order && order.customer && order.customer.email,
  ]
    .map((value)=> normalize(value))
    .filter(Boolean)
    .filter((value, idx, arr)=> arr.indexOf(value) === idx);

  const valid = candidates.filter((email)=> isValidEmail(email));
  const real = valid.find((email)=> !isMercadoPagoSandboxEmail(email));
  if(real){
    return {
      recipient: real,
      source: "order_real_email",
      isSandbox: false,
    };
  }

  const fallback = valid[0] || "";
  return {
    recipient: fallback,
    source: fallback ? "order_fallback_email" : "missing",
    isSandbox: fallback ? isMercadoPagoSandboxEmail(fallback) : false,
  };
}
async function sendOrderEmail(order){
  const recipientInfo = resolveOrderEmailRecipient(order);
  const recipient = normalize(recipientInfo.recipient);

  if(!recipient){
    logger.warn("Email de pago aprobado omitido: pedido sin email de cliente.", {
      order_id: order && (order.id || order.id_pedido),
    });
    return {
      attempted: false,
      sent: false,
      reason: "recipient_missing",
    };
  }

  if(!isValidEmail(recipient)){
    logger.warn("Email de pago aprobado omitido: email invalido.", {
      order_id: order && (order.id || order.id_pedido),
      email: recipient,
    });
    return {
      attempted: false,
      sent: false,
      reason: "recipient_invalid",
    };
  }

  if(recipientInfo.isSandbox){
    logger.warn("Email de pago aprobado omitido: email sandbox de Mercado Pago sin email real en pedido.", {
      order_id: order && (order.id || order.id_pedido),
      email: recipient,
      source: recipientInfo.source,
    });
    return {
      attempted: false,
      sent: false,
      reason: "recipient_mp_sandbox",
    };
  }

  const resendInfo = getResendInfo();
  if(!resendInfo.enabled){
    logger.warn("Email de pago aprobado omitido: Resend no configurado.", {
      order_id: order && (order.id || order.id_pedido),
      reason: resendInfo.reason,
    });
    return {
      attempted: false,
      sent: false,
      reason: resendInfo.reason,
    };
  }

  const buyerName = normalize((order && order.nombre_comprador) || (order && order.customer && order.customer.name)) || "Cliente";
  const productName = normalize((order && order.producto && order.producto.nombre) || getPrimaryProductTitle(order));
  const currency = normalize((order && order.precio && order.precio.currency) || (order && order.currency)) || "ARS";
  const amount = Number(
    (order && order.precio && order.precio.amount)
    || (order && order.total)
    || 0
  );
  const orderId = normalize((order && order.id_pedido) || (order && order.id)) || "-";
  const deliveryMethodRaw = safeLower((order && (order.deliveryMethod || order.metodo_entrega)) || "");
  const isRetailPickup = deliveryMethodRaw === "retail_pickup";
  const deliveryMethodLabel = isRetailPickup ? "Retiro en local" : "Envio a domicilio";
  const totalLabel = `${currency} ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const deliveryContentHtml = isRetailPickup
    ? `
<div style="background:#0b1220; padding:15px; border-radius:8px; margin-bottom:20px;">
  <h4 style="margin:0 0 10px 0;">Retiro confirmado</h4>
  <p style="margin:0 0 10px 0;">Presenta este numero de pedido al retirar.</p>
  <p><strong>ID Pedido:</strong> ${escapeHtml(orderId)}</p>
  <p><strong>Direccion showroom:</strong> San Martin 50 Piso 8 Oficina 166</p>
  <p><strong>Localidad:</strong> Ciudad Autonoma de Buenos Aires</p>
  <p><strong>Horario:</strong> Lunes a Viernes de 10:00 a 18:00</p>
  <p><strong>Telefono:</strong> +54 11 3260-4541</p>
  <p><strong>WhatsApp:</strong> <a href="https://wa.me/5491132604541" style="color:#93c5fd; text-decoration:none;">5491132604541</a></p>
  <p><strong>Email:</strong> info@santelmocomputacion.com.ar</p>
</div>

<p style="margin-bottom:20px;">
  Tu pedido esta confirmado para retiro en local.
</p>
`
    : `
<p style="margin-bottom:20px;">
  Estamos preparando tu pedido. Te vamos a contactar para coordinar el envio.
</p>
`;

  const html = `
<div style="font-family: Arial, sans-serif; background:#0f172a; padding:30px; color:#ffffff;">

  <div style="max-width:600px; margin:0 auto; background:#111827; border-radius:10px; padding:25px;">

<h2 style="margin:0 0 10px 0;">Santelmocomputacion</h2>

<p style="color:#9ca3af; margin-bottom:20px;">
  Compra confirmada
</p>

<h3 style="margin-bottom:10px;">Hola ${escapeHtml(buyerName)},</h3>

<p style="margin-bottom:20px;">
  Tu pago fue aprobado correctamente.
</p>

<div style="background:#0b1220; padding:15px; border-radius:8px; margin-bottom:20px;">
  <p><strong>Producto:</strong> ${escapeHtml(productName || "-")}</p>
  <p><strong>Total:</strong> ${escapeHtml(totalLabel)}</p>
  <p><strong>ID Pedido:</strong> ${escapeHtml(orderId)}</p>
  <p><strong>Entrega:</strong> ${escapeHtml(deliveryMethodLabel)}</p>
</div>

${deliveryContentHtml}

<a href="https://wa.me/5491132604541" 
   style="display:inline-block; padding:12px 18px; background:#22c55e; color:#000; text-decoration:none; border-radius:6px; font-weight:bold;">
   Contactar por WhatsApp
</a>

<p style="margin-top:30px; font-size:12px; color:#6b7280;">
  Santelmocomputacion
</p>

  </div>
</div>
  `;

  try{
    await resendInfo.client.emails.send({
      from: "Santelmocomputacion <pedidos@mail.santelmocomputacion.com.ar>",
      to: recipient,
      subject: "Compra confirmada - Santelmocomputacion",
      html,
    });

    logger.info("Email de pago aprobado enviado.", {
      order_id: orderId,
      to: recipient,
    });

    return {
      attempted: true,
      sent: true,
      to: recipient,
    };
  }catch (error) {
    console.error('❌ ERROR RESEND FULL:', error);
    if (error?.response) {
      console.error('❌ RESEND RESPONSE:', error.response.data);
    }

    return {
      attempted: true,
      sent: false,
      to: recipient,
      reason: "send_failed",
      error: error && error.message ? error.message : String(error),
    };
  }
}
async function sendAdminEmail(order){
  const resendInfo = getResendInfo();
  if(!resendInfo.enabled){
    logger.warn("Email admin omitido: Resend no configurado.", {
      order_id: order && (order.id || order.id_pedido),
      reason: resendInfo.reason,
    });
    return {
      attempted: false,
      sent: false,
      reason: resendInfo.reason,
    };
  }

  const orderId = normalize((order && order.id_pedido) || (order && order.id)) || "-";
  const fecha = normalize((order && (order.saleDate || order.createdAt || order.fecha)) || new Date().toISOString());
  const clienteNombre = normalize((order && order.nombre_comprador) || (order && order.customer && order.customer.name)) || "-";
  const clienteEmail = normalize(
    (order && order.email_comprador)
    || (order && order.customer && order.customer.email)
    || (order && order.shipping && order.shipping.address && order.shipping.address.email)
    || (order && order.pickupContactEmail)
    || (order && order.pickup_contact_email)
  ) || "-";
  const clienteTelefono = normalize((order && order.telefono) || (order && order.customer && order.customer.phone)) || "-";
  const productoNombre = normalize((order && order.producto && order.producto.nombre) || getPrimaryProductTitle(order)) || "-";
  const currency = normalize((order && order.precio && order.precio.currency) || (order && order.currency)) || "ARS";
  const amount = Number((order && order.precio && order.precio.amount) || (order && order.total) || 0);
  const total = `${currency} ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const deliveryMethodRaw = safeLower((order && (order.deliveryMethod || order.metodo_entrega)) || "");
  const tipoEntrega = deliveryMethodRaw === "retail_pickup" ? "Retiro en local" : "Envio a domicilio";

  const shippingAddress = order && order.shipping && order.shipping.address ? order.shipping.address : (order && order.shippingAddress ? order.shippingAddress : {});
  const direccion = normalize(
    (order && order.direccion_completa)
    || [
      `${normalize(shippingAddress.streetName)} ${normalize(shippingAddress.streetNumber)}`.trim(),
      [normalize(shippingAddress.floor), normalize(shippingAddress.department)].filter(Boolean).join(" ").trim(),
      normalize(shippingAddress.cityName),
      normalize(shippingAddress.state),
      normalize(shippingAddress.zipCode) ? `CP ${normalize(shippingAddress.zipCode)}` : "",
    ].filter(Boolean).join(", ")
  );

  const estadoPago = normalize(
    (order && order.payment_status)
    || (order && order.payment && order.payment.status)
    || (order && order.estado_pago)
  ) || "-";

  const html = `
<div style="font-family: Arial, sans-serif; background:#0f172a; padding:24px; color:#ffffff;">
  <div style="max-width:640px; margin:0 auto; background:#111827; border-radius:10px; padding:20px;">
    <h2 style="margin:0 0 10px 0;">Santelmocomputacion</h2>
    <p style="margin:0 0 16px 0; color:#9ca3af;">Nueva venta aprobada</p>

    <div style="background:#0b1220; padding:14px; border-radius:8px;">
      <p><strong>ID pedido:</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Fecha:</strong> ${escapeHtml(fecha)}</p>
      <p><strong>Nombre cliente:</strong> ${escapeHtml(clienteNombre)}</p>
      <p><strong>Email cliente:</strong> ${escapeHtml(clienteEmail)}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(clienteTelefono)}</p>
      <p><strong>Producto:</strong> ${escapeHtml(productoNombre)}</p>
      <p><strong>Total:</strong> ${escapeHtml(total)}</p>
      <p><strong>Tipo de entrega:</strong> ${escapeHtml(tipoEntrega)}</p>
      ${direccion ? `<p><strong>Direccion:</strong> ${escapeHtml(direccion)}</p>` : ""}
      <p><strong>Estado pago:</strong> ${escapeHtml(estadoPago)}</p>
    </div>
  </div>
</div>
  `;

  try{
    await resendInfo.client.emails.send({
      from: "Santelmocomputacion <pedidos@mail.santelmocomputacion.com.ar>",
      to: "info@santelmocomputacion.com.ar",
      subject: `🛒 Nueva venta - Pedido ${orderId}`,
      html,
    });

    logger.info("Email de venta enviado a admin.", {
      order_id: orderId,
      to: "info@santelmocomputacion.com.ar",
    });

    return {
      attempted: true,
      sent: true,
      to: "info@santelmocomputacion.com.ar",
    };
  }catch(err){
    logger.error("Error enviando email de venta a admin.", {
      order_id: orderId,
      error: err && err.message ? err.message : String(err),
    });
    return {
      attempted: true,
      sent: false,
      to: "info@santelmocomputacion.com.ar",
      reason: "send_failed",
      error: err && err.message ? err.message : String(err),
    };
  }
}
async function sendOrderConfirmationEmail({ order, pickupShowroom }){
  // LEGACY SMTP DISABLED - DO NOT USE
  if(LEGACY_SMTP_DISABLED){
    if(config.FLOW_DIAGNOSTIC){
      logger.info("DIAG legacy SMTP confirmation email omitted.", {
        order_id: order && order.id ? order.id : "",
      });
    }
    return {
      attempted: false,
      sent: false,
    };
  }
  const deliveryMethod = resolveDeliveryMethod(order);
  const recipient = normalize(order && order.customer && order.customer.email);

  if(!recipient){
    logger.warn("Email confirmacion omitido: pedido sin email de cliente.", {
      order_id: order && order.id,
    });
    return {
      attempted: false,
      sent: false,
      reason: "recipient_missing",
    };
  }

  if(!isValidEmail(recipient)){
    logger.warn("Email confirmacion omitido: email invalido.", {
      order_id: order && order.id,
      email: recipient,
    });
    return {
      attempted: false,
      sent: false,
      reason: "recipient_invalid",
    };
  }

  const transportInfo = getTransportInfo();
  if(!transportInfo.enabled){
    logger.warn("Email desactivado o incompleto. Se confirma compra sin envio de email.", {
      order_id: order && order.id,
      reason: transportInfo.reason,
    });
    return {
      attempted: false,
      sent: false,
      reason: transportInfo.reason,
    };
  }

  const template = deliveryMethod === DELIVERY_METHOD.RETAIL_PICKUP
    ? pickupTemplate(order, pickupShowroom)
    : shippingTemplate(order);

  try{
    const info = await transportInfo.transport.sendMail({
      from: transportInfo.from,
      to: recipient,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    logger.info("Email de confirmacion enviado.", {
      order_id: order && order.id,
      to: recipient,
      message_id: info && info.messageId ? info.messageId : null,
    });

    return {
      attempted: true,
      sent: true,
      to: recipient,
      messageId: info && info.messageId ? info.messageId : null,
    };
  }catch(err){
    logger.error("Fallo envio de email de confirmacion. Se mantiene compra confirmada.", {
      order_id: order && order.id,
      to: recipient,
      error: err && err.message ? err.message : String(err),
    });
    return {
      attempted: true,
      sent: false,
      to: recipient,
      reason: "send_failed",
      error: err && err.message ? err.message : String(err),
    };
  }
}

module.exports = {
  sendOrderEmail,
  sendAdminEmail,
  sendOrderConfirmationEmail,
};












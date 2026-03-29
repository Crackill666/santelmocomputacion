(function(){
  const ADMIN_TOKEN_KEY = "stc_admin_token";
  const TRACKING_FLOW = ["shipment_created", "in_transit", "out_for_delivery", "delivered"];
  let currentOrderId = "";
  let currentOrder = null;
  let panelUnlocked = false;

  function qs(sel){ return document.querySelector(sel); }

  function setAlert(type, message){
    const box = qs("#detailAlert");
    if(!box) return;
    box.className = `alert-box ${type}`;
    box.textContent = message;
    box.style.display = "block";
  }

  function clearAlert(){
    const box = qs("#detailAlert");
    if(!box) return;
    box.style.display = "none";
    box.textContent = "";
  }

  function toMoney(amount, currency){
    const n = Number(amount || 0);
    return `${currency || "ARS"} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function deliveryLabel(method){
    const raw = String(method || "").toLowerCase();
    if(raw === "retail_pickup") return "Retiro en tienda";
    if(raw === "correo_argentino") return "Correo Argentino";
    return method || "-";
  }

  function getPickupShowroomInfo(){
    const cfg = window.STORE_CONFIG || {};
    const pickup = cfg.pickupShowroom || {};
    const whatsapp = String(pickup.whatsappNumber || cfg.whatsappNumber || "").replace(/\D+/g, "");
    const whatsappUrl = whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(cfg.whatsappDefaultText || "Hola! Quiero coordinar retiro en tienda.")}`
      : "";

    return {
      address: String(pickup.address || cfg.address || "-").trim() || "-",
      locality: String(pickup.locality || "-").trim() || "-",
      hours: String(pickup.hours || "A coordinar por WhatsApp").trim() || "A coordinar por WhatsApp",
      phone: String(cfg.phone || "-").trim() || "-",
      whatsapp,
      whatsappUrl,
    };
  }

  function toDate(value){
    if(!value) return "-";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("es-AR");
  }

  function resolveApiBaseUrl(){
    const configured = window.STORE_CONFIG && window.STORE_CONFIG.apiBaseUrl
      ? String(window.STORE_CONFIG.apiBaseUrl).replace(/\/+$/, "")
      : "";
    if(configured) return configured;

    const host = String(window.location.hostname || "").toLowerCase();
    const port = String(window.location.port || "");
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    if(isLocalHost && port && port !== "3000"){
      return `${window.location.protocol}//${host}:3000`;
    }

    return "";
  }

  function buildApiUrl(path){
    const base = resolveApiBaseUrl();
    return base ? `${base}${path}` : path;
  }

  function getOrderIdFromPath(){
    const match = String(window.location.pathname || "").match(/\/stc-admin-orders-9x7q\/([^/?#]+)/i);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function getAdminToken(){
    const input = qs("#adminToken");
    return input ? String(input.value || "").trim() : "";
  }

  function saveAdminToken(value){
    try{
      if(value){
        window.sessionStorage.setItem(ADMIN_TOKEN_KEY, value);
        window.localStorage.setItem(ADMIN_TOKEN_KEY, value);
      }else{
        window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    }catch(_err){
      // noop
    }
  }

  function initAdminToken(){
    const input = qs("#adminToken");
    if(!input) return;

    const queryToken = new URLSearchParams(window.location.search || "").get("admin_token");
    if(queryToken){
      input.value = queryToken;
      saveAdminToken(queryToken);
      return;
    }

    try{
      const sessionSaved = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
      const localSaved = window.localStorage.getItem(ADMIN_TOKEN_KEY);
      const saved = sessionSaved || localSaved || "";
      if(saved) input.value = saved;
      if(saved) window.sessionStorage.setItem(ADMIN_TOKEN_KEY, saved);
    }catch(_err){
      // noop
    }
  }

  function setAccessState(unlocked){
    const gate = qs("#detailAccessGate");
    const panel = qs("#detailPanelContent");
    if(gate) gate.style.display = unlocked ? "none" : "block";
    if(panel) panel.style.display = unlocked ? "block" : "none";
  }

  function setAccessInfo(message){
    const info = qs("#detailAccessInfo");
    if(info) info.textContent = message;
  }

  function describeAccessError(err){
    const msg = String(err && err.message ? err.message : "").toLowerCase();
    if(msg.includes("no autorizado") || msg.includes("token admin")) return "Token invalido";
    if(msg.includes("deshabilitado") || msg.includes("admin_panel_token")) return "Panel admin deshabilitado en backend: falta ADMIN_PANEL_TOKEN.";
    return err && err.message ? err.message : "No se pudo desbloquear el panel.";
  }

  async function apiRequest(method, path, body){
    const token = getAdminToken();
    if(token) saveAdminToken(token);

    const headers = {};
    if(token) headers["x-admin-token"] = token;
    if(method !== "GET") headers["Content-Type"] = "application/json";

    const res = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(()=> ({}));
    if(!res.ok || !data.ok){
      throw new Error(data.error || "Error en solicitud admin.");
    }
    return data;
  }

  function renderItems(order){
    const body = qs("#itemsBody");
    if(!body) return;

    const items = Array.isArray(order.items) ? order.items : [];
    body.innerHTML = "";

    if(!items.length){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="muted">Sin items</td>`;
      body.appendChild(tr);
      return;
    }

    items.forEach((item)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.title || "-"}</td>
        <td>${item.quantity || 1}</td>
        <td>${toMoney(item.unitPrice, order.currency)}</td>
        <td>${toMoney(item.subtotal, order.currency)}</td>
      `;
      body.appendChild(tr);
    });
  }

  function renderCustomer(order){
    const el = qs("#customerSummary");
    if(!el) return;
    const c = order.customer || {};
    const shippingEmail = order.shippingAddress && order.shippingAddress.email
      ? String(order.shippingAddress.email)
      : (order.shipping && order.shipping.address && order.shipping.address.email ? String(order.shipping.address.email) : "");
    const displayEmail = c.email
      || order.pickupContactEmail
      || order.pickup_contact_email
      || (order.pickupContact && order.pickupContact.email)
      || shippingEmail
      || "-";

    el.innerHTML = `
      <div><strong>Nombre:</strong> ${c.name || "-"}</div>
      <div><strong>Email:</strong> ${displayEmail}</div>
      <div><strong>Telefono:</strong> ${c.phone || "-"}</div>
    `;
  }

  function renderTotals(order){
    const el = qs("#totalsSummary");
    if(!el) return;
    el.innerHTML = `
      <div><strong>Subtotal:</strong> ${toMoney(order.subtotal, order.currency)}</div>
      <div><strong>Shipping cost:</strong> ${toMoney(order.shippingCost, order.currency)}</div>
      <div><strong>Total:</strong> ${toMoney(order.total, order.currency)}</div>
    `;
  }

  function buildAddressLine(order){
    const a = order.shippingAddress || {};
    const line1 = `${a.streetName || ""} ${a.streetNumber || ""}`.trim();
    const line2 = `${a.cityName || ""}${a.state ? `, ${a.state}` : ""}`.trim();
    const line3 = a.zipCode ? `CP ${a.zipCode}` : "";
    const line4 = [a.floor, a.department].filter(Boolean).join(" / ");
    return { line1, line2, line3, line4 };
  }

  function renderShippingAddress(order){
    const el = qs("#shippingSummary");
    if(!el) return;

    const deliveryMethod = String(order && order.deliveryMethod || "").toLowerCase();
    if(deliveryMethod === "retail_pickup"){
      const pickupName = String(order && (
        order.pickupContactName
        || order.pickupContact && order.pickupContact.name
        || order.customer && order.customer.name
        || order.pickup_contact_name
        || order.shipping && order.shipping.nombre_apellido
      ) || "-");
      const pickupPhone = String(order && (
        order.pickupContactPhone
        || order.pickupContact && order.pickupContact.phone
        || order.customer && order.customer.phone
        || order.pickup_contact_phone
        || order.shipping && order.shipping.telefono
      ) || "-");
      const pickupEmail = String(order && (
        order.pickupContactEmail
        || order.pickup_contact_email
        || order.pickupContact && order.pickupContact.email
        || order.customer && order.customer.email
        || order.shippingAddress && order.shippingAddress.email
        || order.shipping && order.shipping.address && order.shipping.address.email
      ) || "-");
      const showroom = getPickupShowroomInfo();
      const whatsappLine = showroom.whatsappUrl
        ? `<div><strong>WhatsApp showroom:</strong> <a href="${showroom.whatsappUrl}" target="_blank" rel="noopener">${showroom.whatsapp}</a></div>`
        : `<div><strong>WhatsApp showroom:</strong> -</div>`;

      el.innerHTML = `
        <div><strong>Retiro en tienda:</strong> Este pedido se retira en tienda. No requiere direccion de envio.</div>
        <div><strong>Nombre retiro:</strong> ${pickupName || "-"}</div>
        <div><strong>Telefono retiro:</strong> ${pickupPhone || "-"}</div>
        <div><strong>Email retiro:</strong> ${pickupEmail || "-"}</div>
        <div><strong>Direccion showroom:</strong> ${showroom.address}</div>
        <div><strong>Localidad:</strong> ${showroom.locality}</div>
        <div><strong>Horario:</strong> ${showroom.hours}</div>
        <div><strong>Telefono showroom:</strong> ${showroom.phone}</div>
        ${whatsappLine}
      `;
      return;
    }

    const a = order.shippingAddress || {};
    const hasAddress = Boolean(a.receiverName || a.streetName || a.cityName || a.zipCode);
    if(!hasAddress){
      el.innerHTML = "<div class='muted'>Sin direccion de envio cargada.</div>";
      return;
    }

    const lines = buildAddressLine(order);
    el.innerHTML = `
      <div><strong>Destinatario:</strong> ${a.receiverName || "-"}</div>
      <div><strong>Direccion:</strong> ${lines.line1 || "-"}</div>
      <div><strong>Localidad/Provincia:</strong> ${lines.line2 || "-"}</div>
      <div><strong>Codigo postal:</strong> ${lines.line3 || "-"}</div>
      <div><strong>Piso/Depto:</strong> ${lines.line4 || "-"}</div>
      <div><strong>Telefono:</strong> ${a.phone || a.cellphone || "-"}</div>
      <div><strong>Email:</strong> ${a.email || order.customer && order.customer.email || "-"}</div>
      <div><strong>Observacion:</strong> ${a.observation || "-"}</div>
    `;
  }

  function renderTracking(order){
    const el = qs("#trackingSummary");
    if(!el) return;

    const isPickup = String(order && order.deliveryMethod || "").toLowerCase() === "retail_pickup";
    if(isPickup){
      const currentPickup = String(order && order.trackingCurrentStatus || "").trim() || "no_aplica_retiro_en_tienda";
      el.innerHTML = `
        <div><strong>Estado actual:</strong> ${currentPickup}</div>
        <div class="muted">Este pedido fue marcado como retiro en tienda. No requiere tracking logistico.</div>
      `;
      return;
    }

    const current = String(order && order.trackingCurrentStatus || "").trim()
      || String(order && order.shipping && order.shipping.currentTrackingStatus || "").trim()
      || "-";
    const events = Array.isArray(order && order.trackingEvents)
      ? order.trackingEvents
      : (Array.isArray(order && order.shipping && order.shipping.trackingEvents) ? order.shipping.trackingEvents : []);

    if(!events.length){
      el.innerHTML = `
        <div><strong>Estado actual:</strong> ${current}</div>
        <div class="muted">Sin eventos de tracking mock todavia.</div>
      `;
      return;
    }

    const rows = events.map((event)=>{
      const status = String(event && event.status || "-");
      const label = String(event && event.label || status || "-");
      const date = toDate(event && event.date);
      const detail = String(event && event.detail || "-");
      return `<li><strong>${status}</strong> - ${label} - ${date} - ${detail}</li>`;
    }).join("");

    el.innerHTML = `
      <div><strong>Estado actual:</strong> ${current}</div>
      <div><strong>Historial:</strong></div>
      <ol style="margin:8px 0 0 18px;">${rows}</ol>
    `;
  }

  function updateLabelLink(order){
    const btn = qs("#btnViewLabel");
    if(!btn) return;

    if(!order || !order.labelPath){
      btn.style.display = "none";
      btn.href = "#";
      return;
    }

    const url = new URL(`/api/admin/orders/${encodeURIComponent(order.id)}/label`, window.location.origin);
    const token = getAdminToken();
    if(token) url.searchParams.set("admin_token", token);
    btn.href = url.toString();
    btn.style.display = "inline-flex";
  }

  function updateButtons(order){
    const createBtn = qs("#btnCreateShipment");
    const labelBtn = qs("#btnGenerateLabel");
    const btnToInTransit = qs("#btnToInTransit");
    const btnToOutForDelivery = qs("#btnToOutForDelivery");
    const btnToDelivered = qs("#btnToDelivered");
    const shipmentSection = qs("#shipmentSection");
    const trackingActions = qs("#trackingActions");
    if(!createBtn || !labelBtn || !btnToInTransit || !btnToOutForDelivery || !btnToDelivered) return;

    const approved = String(order && order.paymentStatus || "") === "approved";
    const hasTracking = Boolean(order && order.trackingNumber);
    const isPickup = String(order && order.deliveryMethod || "").toLowerCase() === "retail_pickup";

    if(shipmentSection){
      shipmentSection.style.display = isPickup ? "none" : "block";
    }
    if(trackingActions){
      trackingActions.style.display = isPickup ? "none" : "flex";
    }

    createBtn.disabled = isPickup || !approved || hasTracking;
    labelBtn.disabled = isPickup || !hasTracking;

    const currentStatus = String(order && order.trackingCurrentStatus || "").trim();
    const currentIdx = TRACKING_FLOW.indexOf(currentStatus || "shipment_created");
    const canAdvance = hasTracking && !isPickup;

    btnToInTransit.disabled = !canAdvance || currentIdx >= TRACKING_FLOW.indexOf("in_transit");
    btnToOutForDelivery.disabled = !canAdvance || currentIdx >= TRACKING_FLOW.indexOf("out_for_delivery");
    btnToDelivered.disabled = !canAdvance || currentIdx >= TRACKING_FLOW.indexOf("delivered");
  }

  function renderOrder(order){
    currentOrder = order;

    const info = qs("#detailInfo");
    const summary = qs("#orderSummary");

    if(info){
      info.textContent = `Pedido ${order.id} | paymentStatus=${order.paymentStatus || "-"} | shippingStatus=${order.shippingStatus || "-"}`;
    }

    if(summary){
      const pickupLine = String(order && order.deliveryMethod || "").toLowerCase() === "retail_pickup"
        ? `<div><strong>Contacto retiro:</strong> ${order.pickupContactName || order.pickup_contact_name || order.customer && order.customer.name || order.shipping && order.shipping.nombre_apellido || "-"} / ${order.pickupContactPhone || order.pickup_contact_phone || order.customer && order.customer.phone || order.shipping && order.shipping.telefono || "-"}</div>`
        : "";
      summary.innerHTML = `
        <div><strong>Pedido:</strong> ${order.id || "-"}</div>
        <div><strong>Fecha:</strong> ${toDate(order.createdAt)}</div>
        <div><strong>Metodo entrega:</strong> ${deliveryLabel(order.deliveryMethod || order.metodo_entrega)}</div>
        <div><strong>Shipping cost:</strong> ${toMoney(order.shippingCost, order.currency)}</div>
        <div><strong>Payment status:</strong> ${order.paymentStatus || "-"}</div>
        <div><strong>Shipping status:</strong> ${order.shippingStatus || "-"}</div>
        <div><strong>Tracking:</strong> ${order.trackingNumber || "-"}</div>
        ${pickupLine}
      `;
    }

    renderCustomer(order);
    renderItems(order);
    renderTotals(order);
    renderShippingAddress(order);
    renderTracking(order);
    updateLabelLink(order);
    updateButtons(order);
  }

  async function loadOrder(){
    if(!panelUnlocked) return;

    if(!currentOrderId){
      setAlert("error", "No se detecto id de pedido en la URL.");
      return;
    }

    clearAlert();
    const info = qs("#detailInfo");
    if(info) info.textContent = "Cargando pedido...";

    try{
      const data = await apiRequest("GET", "/api/admin/orders/" + encodeURIComponent(currentOrderId));
      renderOrder(data.order);
    }catch(err){
      const message = describeAccessError(err);
      setAlert("error", message);
      if(info) info.textContent = "Error al cargar pedido.";
      if(message === "Token invalido"){
        panelUnlocked = false;
        setAccessState(false);
        setAccessInfo(message);
      }
    }
  }

  async function unlockPanel(){
    if(!currentOrderId){
      panelUnlocked = false;
      setAccessState(false);
      setAccessInfo("No se detecto id de pedido en la URL.");
      return;
    }

    const token = getAdminToken();
    if(!token){
      panelUnlocked = false;
      setAccessState(false);
      setAccessInfo("Ingresa token admin para desbloquear el panel.");
      return;
    }

    saveAdminToken(token);
    setAccessInfo("Validando token...");

    try{
      const data = await apiRequest("GET", "/api/admin/orders/" + encodeURIComponent(currentOrderId));
      panelUnlocked = true;
      setAccessState(true);
      clearAlert();
      renderOrder(data.order);
    }catch(err){
      panelUnlocked = false;
      setAccessState(false);
      setAccessInfo(describeAccessError(err));
    }
  }

  function setBusy(button, busyLabel){
    if(!button) return ()=>{};
    const prevLabel = button.textContent;
    button.disabled = true;
    button.textContent = busyLabel;
    return ()=>{
      button.disabled = false;
      button.textContent = prevLabel;
    };
  }

  async function onCreateShipment(){
    const btn = qs("#btnCreateShipment");
    const done = setBusy(btn, "Creando...");
    clearAlert();
    try{
      const data = await apiRequest("POST", `/api/admin/orders/${encodeURIComponent(currentOrderId)}/create-shipment`, { force: false });
      renderOrder(data.order);
      setAlert(data.shipment && data.shipment.success ? "success" : "error", (data.shipment && data.shipment.message) || "Accion ejecutada.");
    }catch(err){
      setAlert("error", err.message || "No se pudo crear envio.");
    }finally{
      done();
      updateButtons(currentOrder);
    }
  }

  async function onGenerateLabel(){
    const btn = qs("#btnGenerateLabel");
    const done = setBusy(btn, "Generando...");
    clearAlert();
    try{
      const data = await apiRequest("POST", `/api/admin/orders/${encodeURIComponent(currentOrderId)}/label`, { force: false });
      renderOrder(data.order);
      setAlert(data.label && data.label.success ? "success" : "error", (data.label && data.label.message) || "Accion ejecutada.");
    }catch(err){
      setAlert("error", err.message || "No se pudo generar etiqueta.");
    }finally{
      done();
      updateButtons(currentOrder);
    }
  }

  async function onAdvanceTracking(status){
    const buttonMap = {
      in_transit: qs("#btnToInTransit"),
      out_for_delivery: qs("#btnToOutForDelivery"),
      delivered: qs("#btnToDelivered"),
    };
    const btn = buttonMap[status];
    const done = setBusy(btn, "Actualizando...");
    clearAlert();
    try{
      const data = await apiRequest("POST", `/api/admin/orders/${encodeURIComponent(currentOrderId)}/mock-tracking`, { status });
      renderOrder(data.order);
      setAlert(data.tracking && data.tracking.success ? "success" : "error", (data.tracking && data.tracking.message) || "Tracking actualizado.");
    }catch(err){
      setAlert("error", err.message || "No se pudo avanzar tracking mock.");
    }finally{
      done();
      updateButtons(currentOrder);
    }
  }

  function bindActions(){
    qs("#unlockDetailPanel").addEventListener("click", unlockPanel);
    qs("#adminToken").addEventListener("keydown", (ev)=>{
      if(ev.key === "Enter"){
        ev.preventDefault();
        unlockPanel();
      }
    });

    qs("#btnReload").addEventListener("click", loadOrder);
    qs("#btnCreateShipment").addEventListener("click", onCreateShipment);
    qs("#btnGenerateLabel").addEventListener("click", onGenerateLabel);
    qs("#btnToInTransit").addEventListener("click", ()=> onAdvanceTracking("in_transit"));
    qs("#btnToOutForDelivery").addEventListener("click", ()=> onAdvanceTracking("out_for_delivery"));
    qs("#btnToDelivered").addEventListener("click", ()=> onAdvanceTracking("delivered"));
  }

  document.addEventListener("DOMContentLoaded", function(){
    currentOrderId = getOrderIdFromPath();
    initAdminToken();
    bindActions();
    setAccessState(false);

    if(getAdminToken()){
      unlockPanel();
    }else{
      setAccessInfo("Ingresa token admin para desbloquear el panel.");
    }
  });
})();







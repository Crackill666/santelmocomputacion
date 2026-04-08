(function(){
  const ADMIN_TOKEN_KEY = "stc_admin_token";
  let panelUnlocked = false;

  function qs(sel){ return document.querySelector(sel); }

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

  function getAdminToken(){
    const input = qs("#adminToken");
    return input ? String(input.value || "").trim() : "";
  }

  function persistAdminToken(value){
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

  function restoreAdminToken(){
    try{
      const sessionSaved = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
      const localSaved = window.localStorage.getItem(ADMIN_TOKEN_KEY);
      const saved = sessionSaved || localSaved || "";
      if(saved && qs("#adminToken")) qs("#adminToken").value = saved;
      if(saved) window.sessionStorage.setItem(ADMIN_TOKEN_KEY, saved);
    }catch(_err){
      // noop
    }
  }

  function setAccessState(unlocked){
    const gate = qs("#adminAccessGate");
    const panel = qs("#adminPanelContent");
    if(gate) gate.style.display = unlocked ? "none" : "block";
    if(panel) panel.style.display = unlocked ? "block" : "none";
  }

  function setAccessInfo(message){
    const info = qs("#adminAccessInfo");
    if(info) info.textContent = message;
  }

  async function fetchOrders(){
    const orderId = qs("#filterOrderId").value;
    const pago = qs("#filterPago").value;
    const adminToken = getAdminToken();

    const url = new URL(buildApiUrl("/api/admin/orders"), window.location.origin);
    if(orderId) url.searchParams.set("order_id", orderId);
    if(pago) url.searchParams.set("payment_status", pago);

    const headers = {};
    if(adminToken) headers["x-admin-token"] = adminToken;

    const res = await fetch(url.toString(), { headers });
    const data = await res.json().catch(()=> ({}));

    if(!res.ok || !data.ok){
      throw new Error(data.error || "No se pudieron cargar pedidos.");
    }

    return data.orders || [];
  }

  function fmtDate(value){
    if(!value) return "-";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("es-AR");
  }

  function fmtMoney(order){
    const amount = Number(order && order.total || 0);
    const currency = (order && order.currency) || "ARS";
    return `${currency} ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function fmtAmount(amount, currency){
    const n = Number(amount || 0);
    return `${currency || "ARS"} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function deliveryLabel(method){
    const raw = String(method || "").toLowerCase();
    if(raw === "retail_pickup") return "Retiro en tienda";
    if(raw === "correo_argentino") return "Correo Argentino";
    return method || "-";
  }

  function resolveBuyerName(order){
    const fromCustomer = String(order && order.customer && order.customer.name || "").trim();
    if(fromCustomer) return fromCustomer;

    const fromPickup = String(
      order && (
        order.pickupContactName
        || (order.pickupContact && order.pickupContact.name)
        || order.pickup_contact_name
        || (order.shipping && order.shipping.nombre_apellido)
      ) || ""
    ).trim();
    if(fromPickup) return fromPickup;

    return String(order && order.nombre_comprador || "-");
  }

  function toDisplayPayment(order){
    const status = (order && (order.payment?.status || order.paymentStatus || order.estado_pago)) || "-";
    const pendingReason = (order && (order.payment?.pendingReason || order.payment_pending_reason)) || "";
    const normalized = String(status).toLowerCase();

    let label = String(status);
    if(normalized === "pending" && String(pendingReason).trim()){
      label = `${status} (${pendingReason})`;
    }

    let cls = "payment-badge";
    if(normalized === "approved") cls += " payment-badge--approved";
    else if(normalized === "rejected") cls += " payment-badge--rejected";
    else if(normalized === "pending") cls += " payment-badge--pending";
    else cls += " payment-badge--neutral";

    const safeLabel = label
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

    return `<span class="${cls}">${safeLabel}</span>`;
  }

  function toDisplayShipping(order){
    return String(order && (order.shippingStatus || order.estado_envio) || "-");
  }

  function toDisplayTrackingMock(order){
    const direct = String(order && order.trackingCurrentStatus || "").trim();
    if(direct) return direct;
    const events = order && Array.isArray(order.trackingEvents) ? order.trackingEvents : [];
    if(events.length){
      const last = events[events.length - 1];
      return String(last && last.status || "-");
    }
    return "-";
  }

  function buildDetailHref(order){
    const orderId = String(order.id || order.id_pedido || "").trim();
    const url = new URL("/admin-order-detail.html", window.location.origin);
    url.searchParams.set("order_id", orderId);
    const token = getAdminToken();
    if(token) url.searchParams.set("admin_token", token);
    return url.toString();
  }

  function buildLabelHref(order){
    const hasLabel = Boolean(order && order.labelPath);
    if(!hasLabel) return "";
    const url = new URL(`/api/admin/orders/${encodeURIComponent(order.id || order.id_pedido)}/label`, window.location.origin);
    const token = getAdminToken();
    if(token) url.searchParams.set("admin_token", token);
    return url.toString();
  }

  function renderRows(orders){
    const body = qs("#ordersBody");
    if(!body) return;

    body.innerHTML = "";

    if(!orders.length){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="12" class="muted">No hay pedidos para los filtros seleccionados.</td>`;
      body.appendChild(tr);
      return;
    }

    orders.forEach((order)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${order.id || order.id_pedido || "-"}</td>
        <td>${fmtDate(order.createdAt || order.fecha)}</td>
        <td>${resolveBuyerName(order)}</td>
        <td>${deliveryLabel(order.deliveryMethod || order.metodo_entrega)}</td>
        <td>${fmtAmount(order.shippingCost, order.currency)}</td>
        <td>${fmtMoney(order)}</td>
        <td>${toDisplayPayment(order)}</td>
        <td>${toDisplayShipping(order)}</td>
        <td>${toDisplayTrackingMock(order)}</td>
        <td>${order.trackingNumber || "-"}</td>
        <td>${buildLabelHref(order) ? `<a class="btn tiny" href="${buildLabelHref(order)}" target="_blank" rel="noopener">Ver etiqueta</a>` : "-"}</td>
        <td><a class="btn tiny" href="${buildDetailHref(order)}">Ver</a></td>
      `;
      body.appendChild(tr);
    });
  }

  function describeError(err){
    const msg = String(err && err.message ? err.message : "").toLowerCase();

    if(msg.includes("no autorizado") || msg.includes("token admin")){
      return "Token invalido";
    }

    if(msg.includes("deshabilitado") || msg.includes("admin_panel_token")){
      return "Panel admin deshabilitado en backend: falta ADMIN_PANEL_TOKEN.";
    }

    return err && err.message ? err.message : "Error al cargar pedidos.";
  }

  async function unlockPanel(){
    const token = getAdminToken();
    if(!token){
      panelUnlocked = false;
      setAccessState(false);
      setAccessInfo("Ingresa token admin para desbloquear el panel.");
      return;
    }

    persistAdminToken(token);
    setAccessInfo("Validando token...");

    try{
      const orders = await fetchOrders();
      panelUnlocked = true;
      setAccessState(true);
      renderRows(orders);
      const info = qs("#adminInfo");
      if(info) info.textContent = `Total: ${orders.length} pedido(s)`;
    }catch(err){
      panelUnlocked = false;
      setAccessState(false);
      setAccessInfo(describeError(err));
    }
  }

  async function load(){
    if(!panelUnlocked) return;

    const info = qs("#adminInfo");
    const adminToken = getAdminToken();
    persistAdminToken(adminToken);

    try{
      info.textContent = "Cargando pedidos...";
      const orders = await fetchOrders();
      renderRows(orders);
      info.textContent = `Total: ${orders.length} pedido(s)`;
    }catch(err){
      const message = describeError(err);
      info.textContent = message;
      if(message === "Token invalido"){
        panelUnlocked = false;
        setAccessState(false);
        setAccessInfo(message);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    restoreAdminToken();
    setAccessState(false);

    qs("#filterOrderId").addEventListener("input", function(){
      window.clearTimeout(window.__stcAdminOrderTimer);
      window.__stcAdminOrderTimer = window.setTimeout(load, 260);
    });
    qs("#filterPago").addEventListener("change", load);
    qs("#reloadOrders").addEventListener("click", load);

    qs("#unlockAdminPanel").addEventListener("click", unlockPanel);
    qs("#adminToken").addEventListener("keydown", function(ev){
      if(ev.key === "Enter"){
        ev.preventDefault();
        unlockPanel();
      }
    });

    if(getAdminToken()){
      unlockPanel();
    }else{
      setAccessInfo("Ingresa token admin para desbloquear el panel.");
    }
  });
})();

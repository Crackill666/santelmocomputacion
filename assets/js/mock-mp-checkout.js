(function(){
  let isCompletingCheckout = false;
  let abandonmentNotified = false;

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

  function fmtMoney(price){
    if(!price) return "-";
    const amount = Number(price.amount || 0);
    const currency = price.currency || "ARS";
    return `${currency} ${amount.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function fmtAmount(amount, currency){
    const n = Number(amount || 0);
    return `${currency || "ARS"} ${n.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function deliveryLabel(method){
    const raw = String(method || "").toLowerCase();
    if(raw === "retail_pickup") return "Retiro en local";
    if(raw === "home_delivery" || raw === "correo_argentino") return "Envio a domicilio";
    if(!raw) return "-";
    return "Envio a domicilio";
  }

  function setNotice(message){
    const box = qs("#mockNotice");
    if(!box || !message) return;
    box.textContent = message;
    box.style.display = "block";
  }

  function setOrderInfo(order){
    const infoEl = qs("#mockInfo");
    const amountEl = qs("#mockAmount");
    if(!infoEl || !amountEl){
      return;
    }

    const productName = order && order.producto && order.producto.nombre
      ? order.producto.nombre
      : "Producto";
    const orderId = order && order.id_pedido ? order.id_pedido : "-";
    const price = order && order.precio ? order.precio : null;
    const subtotal = Number(order && order.subtotal || 0);
    const shipping = Number(order && order.shippingCost || 0);
    const total = Number(order && order.total || (price && price.amount) || 0);
    const currency = order && order.currency ? order.currency : (price && price.currency) || "ARS";

    infoEl.innerHTML = `
      <div><strong>Pedido:</strong> ${orderId}</div>
      <div><strong>Producto:</strong> ${productName}</div>
      <div><strong>Metodo entrega:</strong> ${deliveryLabel(order && order.deliveryMethod)}</div>
      <div><strong>Subtotal:</strong> ${fmtAmount(subtotal, currency)}</div>
      <div><strong>Shipping:</strong> ${fmtAmount(shipping, currency)}</div>
      <div><strong>Total:</strong> ${fmtAmount(total, currency)}</div>
    `;
    amountEl.textContent = fmtAmount(total, currency);
  }

  async function loadOrder(orderId, accessToken){
    const url = new URL(buildApiUrl(`/api/orders/${encodeURIComponent(orderId)}/summary`), window.location.origin);
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const data = await res.json().catch(()=> ({}));
    if(!res.ok || !data.ok){
      throw new Error(data.error || "No se pudo cargar el pedido.");
    }

    return data.order;
  }

  function goToResult(orderId, accessToken, status){
    const paymentId = `MOCKPAY-${Date.now()}`;
    const target = status === "approved" ? "/checkout-success.html" : "/checkout-failure.html";
    const url = new URL(target, window.location.origin);
    url.searchParams.set("order_id", orderId);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("payment_id", paymentId);
    url.searchParams.set("status", status);
    window.location.href = url.toString();
  }

  function consumeCheckoutNotice(){
    try{
      const value = window.sessionStorage.getItem("checkout_notice");
      if(value){
        window.sessionStorage.removeItem("checkout_notice");
      }
      return value || "";
    }catch(_err){
      return "";
    }
  }

  function notifyAbandoned(orderId, accessToken){
    if(abandonmentNotified) return;
    abandonmentNotified = true;

    const url = buildApiUrl("/api/checkout/confirm");
    const payload = {
      order_id: orderId,
      access_token: accessToken,
      status: "abandoned",
    };
    const body = JSON.stringify(payload);

    if(typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function"){
      try{
        const blob = new Blob([body], { type: "application/json" });
        const sent = navigator.sendBeacon(url, blob);
        if(sent){
          return;
        }
      }catch(_err){
      }
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(()=>{});
  }

  document.addEventListener("DOMContentLoaded", async function(){
    const params = new URLSearchParams(window.location.search || "");
    const orderId = params.get("order_id");
    const accessToken = params.get("access_token");

    const storedNotice = consumeCheckoutNotice();
    if(storedNotice){
      setNotice(storedNotice);
    }else if(params.get("source") === "real_fallback"){
      setNotice("Mercado Pago real no estuvo disponible. Seguimos en simulacion para no cortar la venta.");
    }

    if(!orderId || !accessToken){
      setNotice("Faltan parametros para simular el checkout.");
      return;
    }

    window.addEventListener("pagehide", function(){
      if(isCompletingCheckout || abandonmentNotified) return;
      notifyAbandoned(orderId, accessToken);
    });

    try{
      const order = await loadOrder(orderId, accessToken);
      setOrderInfo(order);
    }catch(err){
      setNotice(err.message || "No se pudo cargar el pedido.");
      return;
    }

    const approveBtn = qs("#approveBtn");
    const rejectBtn = qs("#rejectBtn");
    if(!approveBtn || !rejectBtn){
      return;
    }

    approveBtn.addEventListener("click", function(){
      isCompletingCheckout = true;
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      approveBtn.textContent = "Procesando...";
      goToResult(orderId, accessToken, "approved");
    });

    rejectBtn.addEventListener("click", function(){
      isCompletingCheckout = true;
      rejectBtn.disabled = true;
      approveBtn.disabled = true;
      rejectBtn.textContent = "Procesando...";
      goToResult(orderId, accessToken, "rejected");
    });
  });
})();

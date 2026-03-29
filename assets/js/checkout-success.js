(function(){
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  async function postJson(url, payload){
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(()=> ({}));
    if(!res.ok || !data.ok){
      throw new Error(data.error || "No se pudo procesar la solicitud.");
    }
    return data;
  }

  function setBoxAlert(selector, type, message){
    const box = qs(selector);
    if(!box) return;
    box.className = `alert-box ${type}`;
    box.textContent = message;
    box.style.display = "block";
  }

  function clearBoxAlert(selector){
    const box = qs(selector);
    if(!box) return;
    box.textContent = "";
    box.style.display = "none";
  }

  function setAlert(type, message){
    setBoxAlert("[data-alert]", type, message);
  }

  function setShippingAlert(type, message){
    setBoxAlert("[data-shipping-alert]", type, message);
  }

  function setPickupAlert(type, message){
    setBoxAlert("[data-pickup-alert]", type, message);
  }

  function clearShippingAlert(){
    clearBoxAlert("[data-shipping-alert]");
  }

  function clearPickupAlert(){
    clearBoxAlert("[data-pickup-alert]");
  }

  function setStatus(title, subtitle){
    const t = qs("[data-status-title]");
    const s = qs("[data-status-subtitle]");
    if(t) t.textContent = title;
    if(s) s.textContent = subtitle;
  }

  function fmtAmount(amount, currency){
    const n = Number(amount || 0);
    return `${currency || "ARS"} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function deliveryLabel(method){
    const raw = String(method || "").toLowerCase();
    if(raw === "retail_pickup") return "Retiro en local";
    if(raw === "home_delivery" || raw === "correo_argentino") return "Envio a domicilio";
    if(!raw) return "-";
    return "Envio a domicilio";
  }

  function resolveDeliveryType(order){
    return String(
      order && (
        order.deliveryType
        || (order.shipping && order.shipping.deliveryType)
        || ""
      )
    ).toLowerCase();
  }

  function deliveryTypeLabel(type){
    const raw = String(type || "").toLowerCase();
    if(raw === "retail_pickup") return "Retiro en local";
    return "Envio a domicilio";
  }

  function setShippingSubtitle(message){
    const el = qs("[data-shipping-subtitle]");
    if(el) el.textContent = message;
  }

  function isValidEmail(value){
    return EMAIL_RE.test(String(value || "").trim());
  }

  function resolvePickupConfig(){
    const cfg = window.STORE_CONFIG || {};
    const pickup = cfg.pickupShowroom || {};
    const whatsappNumber = String(pickup.whatsappNumber || cfg.whatsappNumber || "").replace(/\D+/g, "");
    const whatsappText = String(cfg.whatsappDefaultText || "Hola! Quiero coordinar retiro en local.");

    return {
      address: String(pickup.address || cfg.address || "-").trim() || "-",
      locality: String(pickup.locality || "-").trim() || "-",
      hours: String(pickup.hours || "A coordinar por WhatsApp").trim() || "A coordinar por WhatsApp",
      phone: String(cfg.phone || "-").trim() || "-",
      email: String(cfg.email || "-").trim() || "-",
      whatsappNumber,
      whatsappUrl: whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
        : "",
    };
  }

  function renderSummary(order){
    const box = qs("[data-order-summary]");
    if(!box || !order) return;

    const subtotal = Number(order.subtotal || 0);
    const shipping = Number(order.shippingCost || 0);
    const total = Number(order.total || (order.precio && order.precio.amount) || 0);
    const currency = order.currency || (order.precio && order.precio.currency) || "ARS";

    box.innerHTML = `
      <div><strong>Pedido:</strong> ${order.id_pedido}</div>
      <div><strong>Producto:</strong> ${order.producto && order.producto.nombre ? order.producto.nombre : "-"}</div>
      <div><strong>Metodo entrega:</strong> ${deliveryLabel(order.deliveryMethod || order.metodo_entrega)}</div>
      <div><strong>Subtotal:</strong> ${fmtAmount(subtotal, currency)}</div>
      <div><strong>Shipping:</strong> ${fmtAmount(shipping, currency)}</div>
      <div><strong>Total:</strong> ${fmtAmount(total, currency)}</div>
      <div><strong>Email:</strong> ${order.customer && order.customer.email ? order.customer.email : "-"}</div>
      <div><strong>Estado de pago:</strong> ${order.estado_pago}</div>
      <div><strong>Estado de envio:</strong> ${order.estado_envio}</div>
    `;
  }

  function fillShippingForm(order){
    if(!order || !order.shipping) return;
    const data = order.shipping;
    [
      "nombre_apellido",
      "telefono",
      "email",
      "calle",
      "numero",
      "piso_departamento",
      "localidad",
      "provincia",
      "codigo_postal",
      "observaciones",
    ].forEach(function(field){
      const input = qs(`[name='${field}']`);
      if(input && data[field]) input.value = data[field];
    });

    const emailInput = qs("[name='email']");
    if(emailInput && !emailInput.value && order.customer && order.customer.email){
      emailInput.value = order.customer.email;
    }
  }

  function fillPickupForm(order){
    const nameInput = qs("[name='pickup_contact_name']");
    const phoneInput = qs("[name='pickup_contact_phone']");
    const emailInput = qs("[name='pickup_contact_email']");
    if(nameInput){
      nameInput.value = order && (order.pickupContactName || (order.customer && order.customer.name) || "") || "";
    }
    if(phoneInput){
      phoneInput.value = order && (order.pickupContactPhone || (order.customer && order.customer.phone) || "") || "";
    }
    if(emailInput){
      emailInput.value = resolvePickupEmail(order);
    }
  }

  function resolvePickupEmail(order){
    return order && (
      order.pickupContactEmail
      || order.pickup_contact_email
      || order.pickupContact && order.pickupContact.email
      || order.customer && order.customer.email
      || ""
    ) || "";
  }

  function renderPickupCard(order){
    const orderIdEl = qs("[data-pickup-order-id]");
    if(orderIdEl){
      orderIdEl.textContent = `Pedido: ${order && order.id_pedido ? order.id_pedido : "-"}`;
    }

    const showroom = resolvePickupConfig();
    const box = qs("[data-pickup-showroom]");
    if(!box) return;

    const whatsappLine = showroom.whatsappUrl
      ? `<div><strong>WhatsApp:</strong> <a href="${showroom.whatsappUrl}" target="_blank" rel="noopener">${showroom.whatsappNumber}</a></div>`
      : `<div><strong>WhatsApp:</strong> -</div>`;

    box.innerHTML = `
      <div><strong>Presenta este numero al retirar:</strong> ${order && order.id_pedido ? order.id_pedido : "-"}</div>
      <div><strong>Direccion showroom:</strong> ${showroom.address}</div>
      <div><strong>Localidad:</strong> ${showroom.locality}</div>
      <div><strong>Horario:</strong> ${showroom.hours}</div>
      <div><strong>Telefono:</strong> ${showroom.phone}</div>
      ${whatsappLine}
      <div><strong>Email:</strong> ${showroom.email}</div>
    `;
  }

  function formToPayload(form){
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((value, key)=>{
      payload[key] = String(value || "").trim();
    });
    return payload;
  }

  function lockForm(form, submitBtn, label){
    if(!form) return;
    form.classList.add("is-locked");
    Array.from(form.elements).forEach(function(el){ el.disabled = true; });
    if(submitBtn && label){
      submitBtn.disabled = true;
      submitBtn.textContent = label;
    }
  }

  function validateShippingPayload(payload){
    const required = [
      ["nombre_apellido", "Nombre y apellido"],
      ["telefono", "Telefono"],
      ["email", "Email"],
      ["calle", "Calle"],
      ["numero", "Numero"],
      ["localidad", "Localidad"],
      ["provincia", "Provincia"],
      ["codigo_postal", "Codigo postal"],
    ];

    for(const [key, label] of required){
      if(!payload[key]){
        return `${label} es obligatorio.`;
      }
    }

    if(String(payload.nombre_apellido || "").length < 3){
      return "Nombre y apellido debe tener al menos 3 caracteres.";
    }
    if(String(payload.telefono || "").length < 6){
      return "Telefono invalido.";
    }
    if(String(payload.codigo_postal || "").length < 3){
      return "Codigo postal invalido.";
    }
    if(!isValidEmail(payload.email)){
      return "Email invalido.";
    }

    return null;
  }

  function validatePickupPayload(payload){
    if(!payload.pickup_contact_name){
      return "Nombre y apellido es obligatorio para retiro.";
    }
    if(!payload.pickup_contact_phone){
      return "Telefono es obligatorio para retiro.";
    }
    if(!payload.pickup_contact_email){
      return "Email es obligatorio para retiro.";
    }
    if(payload.pickup_contact_name.length < 3){
      return "Nombre y apellido invalido.";
    }
    if(payload.pickup_contact_phone.length < 6){
      return "Telefono invalido.";
    }
    if(!isValidEmail(payload.pickup_contact_email)){
      return "Email invalido.";
    }
    return null;
  }

  function resolveEmailState(response){
    if(!response || !response.email){
      return { known: false, sent: false, reason: "" };
    }

    const reason = String(response.email.reason || "").trim();
    if(reason === "legacy_confirmation_email_disabled" || reason === "already_submitted"){
      return { known: false, sent: false, reason };
    }

    return {
      known: true,
      sent: Boolean(response.email.sent),
      reason,
    };
  }

  function pickupSuccessMessage(emailState){
    if(emailState.known && emailState.sent){
      return {
        global: "Pedido confirmado. Te enviamos un email con los datos para retirar.",
        local: "Retiro confirmado. Revisa tu email para ver los datos de retiro.",
      };
    }

    return {
      global: "Pedido confirmado. Retiro confirmado.",
      local: "Retiro confirmado. Presenta tu numero de pedido al retirar.",
    };
  }

  function shippingSuccessMessage(emailState){
    if(emailState.known && emailState.sent){
      return {
        global: [
          "Pedido confirmado.",
          "Te enviamos un email con el resumen de tu compra.",
          "Te avisaremos cuando el envio sea generado.",
        ].join("\n"),
        local: "Datos de envio guardados. Te enviamos email con el resumen de compra.",
      };
    }

    return {
      global: "Pedido confirmado. Datos de envio guardados.",
      local: "Datos de envio guardados. Tu pedido quedo listo para despacho.",
    };
  }

  function setupShippingFlow(orderId, accessToken){
    const form = qs("#shippingForm");
    const submitBtn = qs("#shippingSubmit");
    if(!form || !submitBtn) return;

    form.addEventListener("submit", async function(ev){
      ev.preventDefault();
      clearShippingAlert();

      const payload = formToPayload(form);
      const validationError = validateShippingPayload(payload);
      if(validationError){
        setShippingAlert("error", validationError);
        const alertEl = qs("[data-shipping-alert]");
        if(alertEl) alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      submitBtn.disabled = true;
      const prev = submitBtn.textContent;
      submitBtn.textContent = "Guardando...";

      try{
        payload.access_token = accessToken;

        const response = await postJson(buildApiUrl(`/api/orders/${encodeURIComponent(orderId)}/shipping`), payload);
        renderSummary(response.order);

        if(response.already_submitted){
          setAlert("success", "Ya habiamos recibido tus datos de envio para este pedido.");
          setShippingAlert("success", "Ya habiamos recibido tus datos de envio para este pedido.");
          lockForm(form, submitBtn, "Envio ya guardado");
        }else{
          const emailState = resolveEmailState(response);
          const successText = shippingSuccessMessage(emailState);

          setAlert("success", successText.global);

          if(response.shipment && response.shipment.success){
            setShippingAlert("success", `${successText.local}\nTracking: ${response.shipment.tracking}`);
          }else{
            setShippingAlert("success", successText.local);
          }

          lockForm(form, submitBtn, "Envio guardado");
        }
      }catch(err){
        setAlert("error", err.message || "No se pudo guardar el envio.");
        setShippingAlert("error", err.message || "No se pudo guardar el envio.");
        const alertEl = qs("[data-shipping-alert]");
        if(alertEl) alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
        submitBtn.disabled = false;
        submitBtn.textContent = prev;
      }
    });
  }

  function setupPickupFlow(order, orderId, accessToken){
    const form = qs("#pickupForm");
    const submitBtn = qs("#pickupSubmit");
    if(!form || !submitBtn) return;

    fillPickupForm(order);

    const hasPickupData = Boolean(
      order && (
        order.pickupContactName
        || (order.pickupContact && order.pickupContact.name)
        || (order.customer && order.customer.name)
      ) && (
        order.pickupContactPhone
        || (order.pickupContact && order.pickupContact.phone)
        || (order.customer && order.customer.phone)
      ) && (
        resolvePickupEmail(order)
      )
    );
    const alreadySaved = Boolean(order && order.shippingSubmittedAt && hasPickupData);
    if(alreadySaved){
      setAlert("success", "Retiro en local confirmado. Presenta el numero de pedido al retirar.");
      setPickupAlert("success", "Tus datos de retiro ya estan confirmados.");
      lockForm(form, submitBtn, "Datos de retiro confirmados");
      return;
    }

    form.addEventListener("submit", async function(ev){
      ev.preventDefault();
      clearPickupAlert();

      const payload = formToPayload(form);
      const validationError = validatePickupPayload(payload);
      if(validationError){
        setPickupAlert("error", validationError);
        const alertEl = qs("[data-pickup-alert]");
        if(alertEl) alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      submitBtn.disabled = true;
      const prev = submitBtn.textContent;
      submitBtn.textContent = "Guardando...";

      try{
        const showroom = resolvePickupConfig();
        const response = await postJson(buildApiUrl(`/api/orders/${encodeURIComponent(orderId)}/pickup-contact`), {
          access_token: accessToken,
          pickup_contact_name: payload.pickup_contact_name,
          pickup_contact_phone: payload.pickup_contact_phone,
          pickup_contact_email: payload.pickup_contact_email,
          pickupContactEmail: payload.pickup_contact_email,
          nombre_apellido: payload.pickup_contact_name,
          telefono: payload.pickup_contact_phone,
          email: payload.pickup_contact_email,
          pickup_showroom_address: showroom.address,
          pickup_showroom_locality: showroom.locality,
          pickup_showroom_hours: showroom.hours,
        });

        renderSummary(response.order);
        fillPickupForm(response.order);

        const savedPickupEmail = resolvePickupEmail(response.order);
        if(!savedPickupEmail){
          throw new Error("No pudimos guardar el email de retiro. Volve a intentar.");
        }

        if(response.already_submitted){
          setAlert("success", "Los datos de retiro ya estaban confirmados para este pedido.");
          setPickupAlert("success", "Los datos de retiro ya estaban confirmados para este pedido.");
          lockForm(form, submitBtn, "Datos de retiro confirmados");
          return;
        }

        const emailState = resolveEmailState(response);
        const successText = pickupSuccessMessage(emailState);
        setAlert("success", successText.global);
        setPickupAlert("success", successText.local);
        lockForm(form, submitBtn, "Datos de retiro confirmados");
      }catch(err){
        setAlert("error", err.message || "No se pudo guardar el retiro.");
        setPickupAlert("error", err.message || "No se pudo guardar el retiro.");
        submitBtn.disabled = false;
        submitBtn.textContent = prev;
      }
    });
  }

  function setAgencyInfo(message){
    setBoxAlert("[data-agency-info]", "success", message);
  }

  function clearAgencyInfo(){
    clearBoxAlert("[data-agency-info]");
  }

  async function init(){
    const params = new URLSearchParams(window.location.search || "");
    const orderId = params.get("order_id");
    const accessToken = params.get("access_token");
    const paymentId = params.get("payment_id") || params.get("collection_id") || "";
    const status = params.get("status") || params.get("collection_status") || "approved";

    const shippingWrap = qs("[data-shipping-wrap]");
    const pickupWrap = qs("[data-pickup-wrap]");

    // Defensa temprana: evita submit nativo GET antes de que termine la validacion async.
    const earlyShippingForm = qs("#shippingForm");
    if(earlyShippingForm){
      earlyShippingForm.addEventListener("submit", function(ev){
        ev.preventDefault();
      });
    }

    if(!orderId){
      setAlert("error", "No se pudo validar esta compra. Falta informacion del pedido.");
      setStatus("Compra pendiente de validacion", "Volve a intentar desde el producto.");
      if(shippingWrap) shippingWrap.style.display = "none";
      if(pickupWrap) pickupWrap.style.display = "none";
      return;
    }

    let confirmed;
    try{
      confirmed = await postJson(buildApiUrl("/api/checkout/confirm"), {
        order_id: orderId,
        access_token: accessToken || null,
        payment_id: paymentId,
        status,
      });
    }catch(err){
      setAlert("error", err.message || "No pudimos confirmar el pago.");
      setStatus("Pago en revision", "Si ya pagaste, espera unos segundos y recarga la pagina.");
      if(shippingWrap) shippingWrap.style.display = "none";
      if(pickupWrap) pickupWrap.style.display = "none";
      return;
    }

    const order = confirmed.order;
    renderSummary(order);

    if(order.estado_pago !== "pago_aprobado"){
      setStatus("Pago no aprobado", "Tu pago no se acredito. Podes intentar nuevamente.");
      setAlert("error", "El pago no quedo aprobado, por eso no habilitamos datos de envio/retiro.");
      if(shippingWrap) shippingWrap.style.display = "none";
      if(pickupWrap) pickupWrap.style.display = "none";
      return;
    }

    const deliveryMethod = String(order.deliveryMethod || order.metodo_entrega || "").toLowerCase();

    if(deliveryMethod === "retail_pickup"){
      setStatus("Pago aprobado para retiro", "Confirma nombre, telefono y email de quien retira en local.");
      setAlert("success", "Tu pedido quedo confirmado para retiro en local.");

      if(shippingWrap) shippingWrap.style.display = "none";
      if(pickupWrap) pickupWrap.style.display = "block";

      renderPickupCard(order);
      setupPickupFlow(order, orderId, accessToken);
      return;
    }

    const deliveryType = resolveDeliveryType(order);
    const shippingForm = qs("#shippingForm");

    if(deliveryType === "agency"){
      setStatus("Pago aprobado", "Seleccionaste envio a domicilio.");
      setAlert("success", "Tu pago esta acreditado. Seleccionaste envio a domicilio.");

      if(pickupWrap) pickupWrap.style.display = "none";
      if(shippingWrap) shippingWrap.style.display = "block";

      setShippingSubtitle("Estamos preparando tu envio a domicilio.");
      setAgencyInfo("Estamos preparando esta modalidad de entrega.");
      if(shippingForm) shippingForm.style.display = "none";
      return;
    }

    setStatus("Pago aprobado", "Tu pago fue aprobado. Complet\u00E1 tus datos para recibir tu compra.");
    setAlert("success", "Tu pago esta acreditado. Completa el formulario de envio.");

    if(pickupWrap) pickupWrap.style.display = "none";
    if(shippingWrap) shippingWrap.style.display = "block";
    setShippingSubtitle("Complet\u00E1 estos datos para despachar tu compra. Te va a llevar menos de un minuto.");
    clearAgencyInfo();
    if(shippingForm) shippingForm.style.display = "block";

    fillShippingForm(order);
    setupShippingFlow(orderId, accessToken);
  }

  document.addEventListener("DOMContentLoaded", init);
})();







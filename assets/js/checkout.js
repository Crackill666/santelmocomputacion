(function(){
  const SHIPPING_HOME_DEFAULT = 10500;
  const SHIPPING_HOME_MOCHILAS = 18000;

  const DELIVERY_OPTIONS = {
    retail_pickup: {
      label: "Retiro en local",
      shippingCost: 0,
      deliveryMethod: "retail_pickup",
      deliveryType: "homeDelivery",
    },
    home_delivery: {
      label: "Envio a domicilio",
      shippingCost: SHIPPING_HOME_DEFAULT,
      deliveryMethod: "correo_argentino",
      deliveryType: "homeDelivery",
    },
  };

  function normalizeCategory(value){
    return String(value || "").trim().toLowerCase();
  }

  function isMochilasCategory(value){
    return normalizeCategory(value) === "mochilas";
  }

  function resolveHomeDeliveryShippingCost(category){
    return isMochilasCategory(category) ? SHIPPING_HOME_MOCHILAS : SHIPPING_HOME_DEFAULT;
  }

  function normalizeBase(value){
    return String(value || "").replace(/\/+$/, "");
  }

  function resolveConfiguredBase(){
    if(window.STORE_CONFIG && window.STORE_CONFIG.apiBaseUrl){
      return normalizeBase(window.STORE_CONFIG.apiBaseUrl);
    }
    return "";
  }

  function apiCandidates(path){
    const configured = resolveConfiguredBase();
    if(configured){
      return [`${configured}${path}`];
    }

    const host = String(window.location.hostname || "").toLowerCase();
    const port = String(window.location.port || "");
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    if(isLocalHost && port && port !== "3000"){
      return [
        `http://127.0.0.1:3000${path}`,
        `http://localhost:3000${path}`,
      ];
    }

    return [path];
  }

  async function postJsonWithFallback(path, payload){
    const urls = apiCandidates(path);
    let lastError = null;

    for(const url of urls){
      try{
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload || {}),
        });

        const data = await res.json().catch(()=> ({}));
        if(!res.ok || !data.ok){
          throw new Error(data.error || "No se pudo iniciar el checkout.");
        }

        return data;
      }catch(err){
        lastError = err;
      }
    }

    if(lastError && /failed to fetch/i.test(String(lastError.message || ""))){
      throw new Error("No se pudo conectar al backend. Ejecuta 'npm start' y abre http://localhost:3000/index.html");
    }

    throw lastError || new Error("No se pudo iniciar el checkout.");
  }

  function toNumber(value){
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function round2(value){
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function formatArs(value){
    const n = Number(value || 0);
    return `ARS ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function estimateArs(priceUsd){
    if(window.Currency && typeof window.Currency.getState === "function" && typeof window.Currency.usdToArs === "function"){
      const state = window.Currency.getState();
      if(state && state.rate){
        return Number(window.Currency.usdToArs(priceUsd));
      }
    }
    return 0;
  }

  function buildDeliveryModalCss(){
    return `
      .stc-checkout-backdrop{
        position: fixed;
        inset: 0;
        background: rgba(5,10,18,.72);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .stc-checkout-sheet{
        width: min(540px, 100%);
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 14px;
        background: linear-gradient(135deg, #0f1f1d, #1b1f36);
        color: #f6f7fb;
        padding: 16px;
        box-shadow: 0 20px 50px rgba(0,0,0,.45);
      }
      .stc-checkout-sheet h3{
        margin: 0 0 8px;
        font-size: 22px;
      }
      .stc-checkout-sheet p{
        margin: 0 0 12px;
        color: #c8d0df;
      }
      .stc-checkout-methods{
        display: grid;
        gap: 8px;
        margin-bottom: 14px;
      }
      .stc-checkout-method{
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 10px;
        padding: 10px 12px;
        background: rgba(255,255,255,.03);
      }
      .stc-checkout-method input{ accent-color: #22c17a; }
      .stc-checkout-method-copy{
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .stc-checkout-method-note{
        font-size: 12px;
        line-height: 1.35;
        color: #a9b8cf;
      }
      .stc-checkout-totals{
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 10px;
        padding: 10px 12px;
        background: rgba(0,0,0,.25);
        margin-bottom: 14px;
        font-size: 14px;
        line-height: 1.5;
      }
      .stc-checkout-actions{
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .stc-checkout-actions button{
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 10px;
        padding: 10px 14px;
        cursor: pointer;
        font-weight: 700;
      }
      .stc-btn-primary{
        background: linear-gradient(135deg, #22c17a, #2d9f64);
        color: #fff;
      }
      .stc-btn-ghost{
        background: rgba(255,255,255,.06);
        color: #f3f5f8;
      }
    `;
  }

  function ensureDeliveryModalCss(){
    if(document.getElementById("stc-checkout-delivery-css")) return;
    const style = document.createElement("style");
    style.id = "stc-checkout-delivery-css";
    style.textContent = buildDeliveryModalCss();
    document.head.appendChild(style);
  }

  function showDeliveryMethodModal({ productName, productCategory, subtotalArs }){
    ensureDeliveryModalCss();

    return new Promise((resolve)=>{
      const homeDeliveryShippingCost = resolveHomeDeliveryShippingCost(productCategory);

      const backdrop = document.createElement("div");
      backdrop.className = "stc-checkout-backdrop";

      const sheet = document.createElement("div");
      sheet.className = "stc-checkout-sheet";
      sheet.innerHTML = `
        <h3>Metodo de entrega</h3>
        <p>Producto: <strong>${String(productName || "Producto")}</strong></p>

        <div class="stc-checkout-methods">
          <label class="stc-checkout-method">
            <input type="radio" name="stc_delivery_method" value="retail_pickup" />
            <span>Retiro en local (shipping ARS 0,00)</span>
          </label>
          <label class="stc-checkout-method">
            <input type="radio" name="stc_delivery_method" value="home_delivery" checked />
            <span class="stc-checkout-method-copy">
              <span>Envio a domicilio (shipping ${formatArs(homeDeliveryShippingCost)})</span>
              <small class="stc-checkout-method-note">Entrega estimada de 3 a 5 días hábiles.</small>
            </span>
          </label>
        </div>

        <div class="stc-checkout-totals" data-stc-totals></div>

        <div class="stc-checkout-actions">
          <button type="button" class="stc-btn-primary" data-stc-accept>Continuar al pago</button>
          <button type="button" class="stc-btn-ghost" data-stc-cancel>Cancelar</button>
        </div>
      `;

      backdrop.appendChild(sheet);
      document.body.appendChild(backdrop);

      const totalsEl = sheet.querySelector("[data-stc-totals]");
      const radios = Array.from(sheet.querySelectorAll("input[name='stc_delivery_method']"));
      const acceptBtn = sheet.querySelector("[data-stc-accept]");
      const cancelBtn = sheet.querySelector("[data-stc-cancel]");

      function selectedMethodKey(){
        const checked = radios.find((r)=> r.checked);
        return checked ? checked.value : "home_delivery";
      }

      function selectedMethodOption(){
        const key = selectedMethodKey();
        const option = DELIVERY_OPTIONS[key] || DELIVERY_OPTIONS.home_delivery;
        const shippingCost = key === "home_delivery"
          ? homeDeliveryShippingCost
          : toNumber(option.shippingCost);
        return { ...option, shippingCost };
      }

      function renderTotals(){
        const option = selectedMethodOption();
        const shipping = toNumber(option.shippingCost);
        const total = round2(subtotalArs + shipping);
        totalsEl.innerHTML = `
          <div><strong>Subtotal:</strong> ${formatArs(subtotalArs)}</div>
          <div><strong>Shipping:</strong> ${formatArs(shipping)}</div>
          <div><strong>Total final:</strong> ${formatArs(total)}</div>
        `;
      }

      function close(result){
        backdrop.remove();
        resolve(result);
      }

      radios.forEach((radio)=> radio.addEventListener("change", renderTotals));
      acceptBtn.addEventListener("click", ()=>{
        const option = selectedMethodOption();
        const shipping = toNumber(option.shippingCost);
        const total = round2(subtotalArs + shipping);
        close({
          confirmed: true,
          method: option.deliveryMethod,
          deliveryType: option.deliveryType,
          shippingCost: shipping,
          total,
          subtotal: subtotalArs,
        });
      });
      cancelBtn.addEventListener("click", ()=> close({ confirmed: false }));
      backdrop.addEventListener("click", (ev)=>{
        if(ev.target === backdrop) close({ confirmed: false });
      });

      renderTotals();
    });
  }

  async function start(product, options){
    const opts = options || {};
    const btn = opts.button || null;

    if(!product){
      alert("No se pudo identificar el producto.");
      return;
    }

    const usd = toNumber(product.price_usd);
    let subtotalArs = round2(estimateArs(usd));
    if(subtotalArs <= 0){
      subtotalArs = round2(usd * 1400);
    }

    const prevLabel = btn ? btn.textContent : "";
    if(btn){
      btn.disabled = true;
      btn.textContent = "Preparando...";
    }

    try{
      const selection = await showDeliveryMethodModal({
        productName: product.name || product.nombre || "Producto",
        productCategory: product.category || product.categoria || "",
        subtotalArs,
      });

      if(!selection || !selection.confirmed){
        if(btn){
          btn.disabled = false;
          btn.textContent = prevLabel || "Comprar";
        }
        return;
      }

      const payload = {
        product_id: product.id || "",
        product_name: product.name || product.nombre || "Producto",
        category: product.category || product.categoria || "Producto",
        price_usd: usd,
        price_ars: subtotalArs,
        delivery_method: selection.method,
        delivery_type: selection.deliveryType,
        source: opts.source || "web",
      };

      if(btn){
        btn.textContent = "Redirigiendo...";
      }

      const data = await postJsonWithFallback("/api/checkout/create-preference", payload);
      if(data && data.fallback_from_real && data.message){
        try{
          window.sessionStorage.setItem("checkout_notice", data.message);
        }catch(_err){
          // noop
        }
      }
      window.location.href = data.checkout_url;
    }catch(err){
      if(btn){
        btn.disabled = false;
        btn.textContent = prevLabel || "Comprar";
      }
      alert(err.message || "No se pudo iniciar el pago. Intenta de nuevo.");
    }
  }

  window.Checkout = { start };
})();

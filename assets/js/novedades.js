(function(){
  const FEATURED_NAMES = [
    "Aspiradora Solpadora Aire Portatil Hogar Auto",
    "Auricular Inalambrico+Traductor Idiomas M113",
    "Cable Datos_Carga Soporte",
    "Smartwatch Tank M1",
    "Smartwatch Inteligente H59",
    "Cable Cargas_Datos Display",
    "Mini Teclado Plegable"
  ];
  let modal = null;

  function getModal(){
    if(!modal && window.UIModal && typeof window.UIModal.createModal === "function"){
      modal = window.UIModal.createModal();
    }
    return modal;
  }

  function normalizeName(v){
    return String(v || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function escapeHtml(v){
    if(window.Utils && typeof window.Utils.escapeHtml === "function"){
      return window.Utils.escapeHtml(v);
    }
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getStockText(stock){
    const n = Number(stock || 0);
    if(n <= 0) return "Sin stock";
    if(n <= 3) return "\u2714\uFE0F Disponible ahora";
    if(n <= 5) return "\u2714\uFE0F Disponible ahora";
    return "\u2714\uFE0F Disponible ahora";
  }

  function getSafeText(text, max){
    if(window.Utils && typeof window.Utils.safeText === "function"){
      return window.Utils.safeText(text, max);
    }
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    return raw.length > max ? raw.slice(0, max - 1).trim() + "..." : raw;
  }

  function trackLeadIfAvailable(){
    if(typeof window.fbq === "function"){
      window.fbq("track", "Lead");
    }
  }

  function fmtUsdFallback(n){
    const v = Number(n || 0);
    const s = (Number.isFinite(v) ? v : 0).toFixed(2).replace(".", ",");
    return "USD " + s;
  }

  function getUsdText(usdValue){
    if(window.Currency && typeof window.Currency.fmtUSD === "function"){
      return window.Currency.fmtUSD(usdValue);
    }
    return fmtUsdFallback(usdValue);
  }

  function buildBuyMessage(product){
    const usdValue = Number(product.price_usd || 0);
    const usd = getUsdText(usdValue);
    const state = (window.Currency && typeof window.Currency.getState === "function")
      ? window.Currency.getState()
      : null;
    const ars = (state && state.rate && window.Currency && typeof window.Currency.usdToArs === "function" && typeof window.Currency.fmtARS === "function")
      ? window.Currency.fmtARS(window.Currency.usdToArs(usdValue))
      : "ARS (no disponible)";
    return "Hola! Quiero comprar/consultar:\n" + (product.name || "Producto") + "\n" + usd + " - " + ars;
  }

  function mountPriceAndActions(article, product){
    const usdValue = Number(product.price_usd || 0);
    const arsEl = article.querySelector("[data-ars]");
    const noteEl = article.querySelector("[data-rate-note]");
    const buyBtn = article.querySelector("[data-buy]");
    const checkoutBtn = article.querySelector("[data-buy-future]");

    if(window.Currency && arsEl && noteEl){
      const updateArs = function(state){
        if(!state || !state.rate){
          arsEl.textContent = "$ARS -";
          noteEl.textContent = "Sin cotizacion (Binance).";
          return;
        }
        const arsNum = window.Currency.usdToArs(usdValue);
        arsEl.textContent = arsNum ? window.Currency.fmtARS(arsNum) : "$ARS -";
        noteEl.textContent = "Tipo de cambio: " + window.Currency.fmtARS(state.rate) + " - " + window.Currency.fmtTime(state.updatedAt);
      };
      updateArs(window.Currency.getState());
      window.Currency.subscribe(updateArs);
    }

    if(buyBtn){
      buyBtn.addEventListener("click", function(){
        trackLeadIfAvailable();
        const cfg = window.STORE_CONFIG || {};
        if(window.Utils && typeof window.Utils.buildWhatsAppUrl === "function"){
          const url = window.Utils.buildWhatsAppUrl({
            number: cfg.whatsappNumber,
            text: buildBuyMessage(product)
          });
          window.open(url, "_blank", "noopener,noreferrer");
        }
      });
    }

    if(checkoutBtn){
      checkoutBtn.addEventListener("click", function(e){
        e.preventDefault();
        if(window.Checkout && typeof window.Checkout.start === "function"){
          window.Checkout.start(product, { source: "novedades", button: checkoutBtn });
          return;
        }
        alert("Checkout no disponible por el momento.");
      });
    }
  }

  function renderProductDetail(product){
    const wrap = document.createElement("div");
    wrap.className = "product";

    const imgs0 = (product.images && product.images.length) ? product.images.slice(0, 3) : ["./assets/img/placeholder.jpg"];
    const imgs = imgs0.slice();
    while(imgs.length < 3) imgs.push(imgs[imgs.length - 1]);

    const usdValue = Number(product.price_usd || 0);
    const usdText = getUsdText(usdValue);

    wrap.innerHTML = `
      <div class="product-grid">
        <div class="product-gallery">
          <div class="product-main">
            <img alt="${escapeHtml(product.name || "Producto")}" loading="lazy" src="${imgs[0]}">
          </div>
          <div class="product-thumbs">
            ${imgs.map(function(src, i){
              return `<button class="thumb" type="button" data-idx="${i}" aria-label="Foto ${i + 1}">
                <img alt="" loading="lazy" src="${src}">
              </button>`;
            }).join("")}
          </div>
        </div>

        <div class="product-info">
          <div class="product-title">${escapeHtml(product.name || "Producto")}</div>
          <div class="chip-row chip-row-stack" style="margin-top:8px">
            <span class="chip">${getStockText(product.stock)}</span>
          </div>
          <div class="product-desc">${escapeHtml(product.description || "Sin descripcion").replace(/\n/g, "<br>")}</div>
          <div class="product-price">
            <div class="usd precio-usd">${usdText}</div>
            <div class="ars precio-ars" data-ars>$ARS -</div>
            <div class="rate-note" data-rate-note></div>
          </div>
          <div class="product-actions">
            <button class="btn whatsapp btn-consultar" type="button" data-buy>Consultar por WhatsApp</button>
            <button class="btn whatsapp btn-comprar" type="button" data-buy-future>Comprar ahora</button>
          </div>
          <div class="product-trust" aria-label="Beneficios de compra">
            <div><span class="trust-ico" aria-hidden="true">&#10003;</span><span>Compra 100% segura con Mercado Pago</span></div>
            <div><span class="trust-ico" aria-hidden="true">&#10003;</span><span>Envio a todo el pais o retiro en local</span></div>
            <div><span class="trust-ico" aria-hidden="true">&#10003;</span><span>Asesoramiento rapido por WhatsApp</span></div>
          </div>
          <div class="buy-note" style="margin-top:6px; font-size:12px; opacity:0.8;">
            Paga con Mercado Pago de forma segura
          </div>
        </div>
      </div>
    `;

    const mainImg = wrap.querySelector(".product-main img");
    wrap.querySelectorAll(".thumb").forEach(function(btn){
      btn.addEventListener("click", function(){
        const i = Number(btn.getAttribute("data-idx") || 0);
        mainImg.src = imgs[i] || imgs[0];
        wrap.querySelectorAll(".thumb").forEach(function(b){ b.classList.remove("active"); });
        btn.classList.add("active");
      });
    });

    const firstThumb = wrap.querySelector('.thumb[data-idx="0"]');
    if(firstThumb) firstThumb.classList.add("active");

    wrap.querySelectorAll("img").forEach(function(img){
      img.addEventListener("error", function(){ img.src = "./assets/img/placeholder.jpg"; });
    });

    mountPriceAndActions(wrap, product);
    return wrap;
  }

  function openProductDetail(product){
    const detailModal = getModal();
    if(!detailModal || !product) return;
    detailModal.setTitle(product.category ? product.category : "Producto", "");
    detailModal.setSearchVisible(false);
    detailModal.setBackVisible(false);
    detailModal.setBody(renderProductDetail(product));
    detailModal.open();
  }

  function bindWhatsAppFab(){
    const fab = document.querySelector("[data-fab-whatsapp]");
    if(!fab) return;
    fab.addEventListener("click", function(){
      trackLeadIfAvailable();
      const cfg = window.STORE_CONFIG || {};
      if(window.Utils && typeof window.Utils.buildWhatsAppUrl === "function"){
        const url = window.Utils.buildWhatsAppUrl({
          number: cfg.whatsappNumber,
          text: cfg.whatsappDefaultText || "Hola! Quiero hacer una consulta."
        });
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  }

  function mountRatePill(){
    if(!window.Currency) return;
    window.Currency.mountBadge({
      el: document.querySelector(".rate-pill"),
      textEl: document.querySelector("[data-rate-value]"),
      metaEl: null
    });
    window.Currency.startAutoRefresh({ intervalMs: 600000 });
  }

  function renderProduct(product){
    const card = document.createElement("article");
    card.className = "card";

    const name = escapeHtml(product.name || "Producto");
    const catName = product.category || "Producto";
    const category = escapeHtml(catName);
    const icon = (window.Utils && typeof window.Utils.iconForCategory === "function") ? window.Utils.iconForCategory(catName) : "";
    const description = getSafeText(product.description || "", 120);
    const stockText = getStockText(product.stock);
    const img0 = (product.images && product.images[0]) ? product.images[0] : "./assets/img/placeholder.jpg";
    const usdValue = Number(product.price_usd || 0);
    const usdText = getUsdText(usdValue);
    const state = (window.Currency && typeof window.Currency.getState === "function") ? window.Currency.getState() : null;
    const arsText = (state && state.rate && window.Currency && typeof window.Currency.usdToArs === "function" && typeof window.Currency.fmtARS === "function")
      ? window.Currency.fmtARS(window.Currency.usdToArs(usdValue))
      : "$ARS -";

    card.innerHTML = `
      <div class="card-media">
        <img alt="${name}" loading="lazy" src="${img0}">
      </div>

      <div class="card-content">
        <div class="card-title"><span class="mini-icon">${icon}</span><span class="t">${name}</span></div>

        <div class="chip-row">
          <span class="chip">${category}</span>
          <span class="chip">${stockText}</span>
        </div>

        <div class="card-desc">${escapeHtml(description)}</div>

        <div class="card-bottom">
          <div class="card-price">
            <div class="usd">${usdText}</div>
            <div class="ars">${arsText}</div>
          </div>
          <button class="btn tiny" type="button" data-view>Ver</button>
        </div>
      </div>
    `;

    const img = card.querySelector("img");
    if(img){
      img.addEventListener("error", function(){
        img.src = "./assets/img/placeholder.jpg";
      });
    }

    const viewBtn = card.querySelector("[data-view]");
    if(viewBtn){
      viewBtn.addEventListener("click", function(e){
        e.stopPropagation();
        openProductDetail(product);
      });
    }
    card.addEventListener("click", function(){ openProductDetail(product); });

    return card;
  }

  function renderNotFound(name){
    const article = document.createElement("article");
    article.className = "contact-item";
    article.innerHTML = `
      <div class="k">Producto no encontrado</div>
      <div class="v">${escapeHtml(name)}</div>
    `;
    return article;
  }

  async function renderFeaturedProducts(){
    const mount = document.querySelector("[data-novedades-list]");
    if(!mount) return;

    mount.innerHTML = "";

    try{
      if(!window.StoreData || typeof window.StoreData.loadProducts !== "function"){
        throw new Error("StoreData no disponible");
      }

      const data = await window.StoreData.loadProducts();
      const products = Array.isArray(data && data.products) ? data.products : [];

      const byName = new Map();
      products.forEach(function(p){
        byName.set(normalizeName(p && p.name), p);
      });

      FEATURED_NAMES.forEach(function(rawName){
        const p = byName.get(normalizeName(rawName));
        mount.appendChild(p ? renderProduct(p) : renderNotFound(rawName));
      });
    }catch(_err){
      const fallback = document.createElement("div");
      fallback.className = "contact-item";
      fallback.innerHTML = `
        <div class="k">No se pudo cargar novedades</div>
        <div class="v">Intenta recargar la pagina.</div>
      `;
      mount.appendChild(fallback);
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    bindWhatsAppFab();
    mountRatePill();
    if(window.Currency && typeof window.Currency.subscribe === "function"){
      window.Currency.subscribe(function(){
        renderFeaturedProducts();
      });
    }else{
      renderFeaturedProducts();
    }
  });
})();

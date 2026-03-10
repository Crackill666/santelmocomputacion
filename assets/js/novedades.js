(function(){
  const FEATURED_NAMES = [
    "Aspiradora Solpadora Aire Portatil Hogar Auto",
    "Auricular Inalambrico+Traductor Idiomas M113",
    "Auricular Inalambrico+ Traductor Idiomas YYK-Q65",
    "Teclado Gamer Redragon k630 Dragonbron"
  ];

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
    if(n <= 3) return "Stock: Bajo";
    if(n <= 5) return "Stock: Medio";
    return "Stock: Alto";
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
          window.open(url, "_blank", "noopener");
        }
      });
    }
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
        window.open(url, "_blank", "noopener");
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
    const article = document.createElement("article");
    article.className = "novedad-item";

    const name = escapeHtml(product.name || "Producto");
    const category = escapeHtml(product.category || "Producto");
    const description = escapeHtml(product.description || "Sin descripcion").replace(/\n/g, "<br>");
    const stockText = getStockText(product.stock);
    const img0 = (product.images && product.images[0]) ? product.images[0] : "./assets/img/placeholder.jpg";
    const usdValue = Number(product.price_usd || 0);
    const usdText = getUsdText(usdValue);

    article.innerHTML = `
      <div class="product-grid">
        <div class="product-gallery">
          <div class="product-main">
            <img alt="${name}" loading="lazy" src="${img0}">
          </div>
        </div>
        <div class="product-info">
          <div class="product-title">${name}</div>
          <div class="chip-row" style="margin-top:8px">
            <span class="chip">${category}</span>
            <span class="chip">${stockText}</span>
          </div>
          <div class="product-desc">${description}</div>
          <div class="product-price">
            <div class="usd">${usdText}</div>
            <div class="ars" data-ars>$ARS -</div>
            <div class="rate-note" data-rate-note></div>
          </div>
          <div class="product-actions">
            <button class="btn whatsapp" type="button" data-buy style="flex:1;">Comprar</button>
          </div>
        </div>
      </div>
    `;

    const img = article.querySelector("img");
    if(img){
      img.addEventListener("error", function(){
        img.src = "./assets/img/placeholder.jpg";
      });
    }

    mountPriceAndActions(article, product);

    return article;
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
    renderFeaturedProducts();
  });
})();

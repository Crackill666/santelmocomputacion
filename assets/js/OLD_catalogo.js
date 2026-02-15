(async function(){
  const { storeName, whatsappNumber } = window.STORE_CONFIG || {};

  // Currency badge
  window.Currency.startAutoRefresh({ intervalMs: 600000 });
  window.Currency.mountBadge({
    el: document.querySelector(".rate-pill"),
    textEl: document.querySelector("[data-rate-value]"),
    metaEl: null,
  });

  // WhatsApp FAB
  const fab = document.querySelector("[data-fab-whatsapp]");
  if(fab){
    fab.addEventListener("click", ()=>{
      const url = window.Utils.buildWhatsAppUrl({
        number: whatsappNumber,
        text: "Hola! Quiero hacer una consulta."
      });
      window.open(url, "_blank", "noopener");
    });
  }

  // Load data
  let data;
  try{
    data = await window.StoreData.loadProducts();
  }catch(e){
    console.error(e);
    const grid = document.querySelector("[data-catalog-grid]");
    if(grid) grid.textContent = "No se pudo cargar el catálogo.";
    return;
  }

  const productsRaw = Array.isArray(data.products) ? data.products : [];
  const categoriesRaw = Array.isArray(data.categories) ? data.categories : [];

  const categorySelect = document.querySelector("[data-filter-category]");
  const qInput = document.querySelector("[data-filter-q]");
  const sortSelect = document.querySelector("[data-filter-sort]");
  const grid = document.querySelector("[data-catalog-grid]");

  // ===== NORMALIZACIÓN DE CATEGORÍAS =====
  function normalizeCategory(name){
    const n = String(name || "").trim().toLowerCase();

    if(n === "almacenamiento" || n === "storage") return "Storage";

    return name;
  }

  const products = productsRaw.map(p => ({
    ...p,
    category: normalizeCategory(p.category)
  }));

  // ===== STOCK LABEL =====
  function getStockLabel(stock){
    const n = Number(stock || 0);
    if(!Number.isFinite(n) || n <= 0) return "Sin stock";
    if(n <= 2) return "Stock: Bajo";
    if(n <= 6) return "Stock: Medio";
    return "Stock: Alto";
  }

  // Modal
  const modal = (window.UIModal && window.UIModal.createModal)
    ? window.UIModal.createModal()
    : null;

  function openProductDetail(p){
    if(!modal || !p) return;
    modal.setTitle(p.category ? `${p.category}` : "Producto", "");
    modal.setSearchVisible(false);
    modal.setBackVisible(false);
    modal.setBody(renderProductDetail(p));
    modal.open();
  }

  function renderProductDetail(p){
    const wrap = document.createElement("div");
    wrap.className = "product";

    const imgs0 = (p.images && p.images.length)
      ? p.images.slice(0,3)
      : ["./assets/img/placeholder.jpg"];

    const imgs = imgs0.slice();
    while(imgs.length < 3) imgs.push(imgs[imgs.length-1]);

    const usd = window.Currency.fmtUSD(Number(p.price_usd||0));
    const stockLabel = getStockLabel(p.stock);

    wrap.innerHTML = `
      <div class="product-grid">
        <div class="product-gallery">
          <div class="product-main">
            <img alt="" loading="lazy" src="${imgs[0]}">
          </div>
          <div class="product-thumbs">
            ${imgs.map((src,i)=>`
              <button class="thumb" type="button" data-idx="${i}">
                <img alt="" loading="lazy" src="${src}">
              </button>
            `).join("")}
          </div>
        </div>

        <div class="product-info">
          <div class="product-title">
            ${window.Utils.escapeHtml(p.name || "Producto")}
          </div>

          <div class="chip-row" style="margin-top:8px">
            <span class="chip">${window.Utils.escapeHtml(p.category)}</span>
            <span class="chip">${usd}</span>
            <span class="chip">${stockLabel}</span>
          </div>

          <div class="product-desc">
            ${window.Utils.escapeHtml(p.description || "—").replace(/\\n/g, "<br>")}
          </div>

          <div class="product-price">
            <div class="usd">${usd}</div>
            <div class="ars" data-ars>$ARS —</div>
            <div class="rate-note" data-rate-note></div>
          </div>

          <div class="product-actions">
            <button class="btn whatsapp" type="button" data-wa>Comprar</button>
          </div>
        </div>
      </div>
    `;

    const mainImg = wrap.querySelector(".product-main img");
    wrap.querySelectorAll(".thumb").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const i = Number(btn.dataset.idx || 0);
        mainImg.src = imgs[i];
        wrap.querySelectorAll(".thumb").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    const arsEl = wrap.querySelector("[data-ars]");
    const noteEl = wrap.querySelector("[data-rate-note]");
    const updateArs = (s)=>{
      const a = (s && s.rate)
        ? window.Currency.usdToArs(Number(p.price_usd||0))
        : null;
      if(a){
        arsEl.textContent = window.Currency.fmtARS(a);
        if(noteEl) noteEl.textContent = "";
      } else {
        arsEl.textContent = "$ARS —";
        if(noteEl) noteEl.textContent = "Sin cotización (Binance).";
      }
    };
    updateArs(window.Currency.getState());
    window.Currency.subscribe(updateArs);

    wrap.querySelector("[data-wa]")?.addEventListener("click", (e)=>{
      e.preventDefault();
      const rate = window.Currency.getState().rate;
      const ars = rate
        ? window.Currency.fmtARS(window.Currency.usdToArs(Number(p.price_usd||0)))
        : "$ARS —";

      const msg = `Hola! Quiero comprar/consultar:\n${p.name}\n${usd} — ${ars}`;
      const url = window.Utils.buildWhatsAppUrl({
        number: whatsappNumber,
        text: msg
      });
      window.open(url, "_blank", "noopener");
    });

    return wrap;
  }

  function populateCategories(){
    if(!categorySelect) return;
    categorySelect.innerHTML = "";

    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "Todas";
    categorySelect.appendChild(optAll);

    const names = new Set();

    categoriesRaw.forEach(c=>{
      if(c?.name) names.add(normalizeCategory(c.name));
    });

    products.forEach(p=>{
      if(p?.category) names.add(normalizeCategory(p.category));
    });

    Array.from(names)
      .sort((a,b)=>a.localeCompare(b,"es"))
      .forEach(n=>{
        const o = document.createElement("option");
        o.value = n;
        o.textContent = n;
        categorySelect.appendChild(o);
      });
  }

  function sortProducts(list, mode){
    const arr = list.slice();
    if(mode === "precio_asc"){
      arr.sort((a,b)=>Number(a.price_usd||0)-Number(b.price_usd||0));
    } else if(mode === "precio_desc"){
      arr.sort((a,b)=>Number(b.price_usd||0)-Number(a.price_usd||0));
    } else if(mode === "stock"){
      arr.sort((a,b)=>Number(b.stock||0)-Number(a.stock||0));
    }
    return arr;
  }

  function renderCard(p){
    const card = document.createElement("article");
    card.className = "card";

    const img0 = p.images?.[0] || "./assets/img/placeholder.jpg";
    const stockLabel = getStockLabel(p.stock);

    card.innerHTML = `
      <div class="card-media">
        <img alt="" loading="lazy" src="${img0}">
      </div>

      <div class="card-content">
        <div class="card-title">
          <span class="t">${window.Utils.escapeHtml(p.name)}</span>
        </div>

        <div class="chip-row">
          <span class="chip">${window.Utils.escapeHtml(p.category)}</span>
          <span class="chip">${window.Currency.fmtUSD(Number(p.price_usd||0))}</span>
          <span class="chip">${stockLabel}</span>
        </div>

        <div class="card-desc">
          ${window.Utils.safeText(p.description || "", 120)}
        </div>

        <div class="card-bottom">
          <div class="card-price">
            ${window.Currency.fmtUSD(Number(p.price_usd||0))}
          </div>
          <button class="btn tiny" type="button" data-view>Ver</button>
        </div>
      </div>
    `;

    card.querySelector("[data-view]")?.addEventListener("click",(e)=>{
      e.stopPropagation();
      openProductDetail(p);
    });

    card.addEventListener("click", ()=> openProductDetail(p));

    return card;
  }

  function render(){
    if(!grid) return;

    const q = qInput?.value?.trim().toLowerCase() || "";
    const cat = categorySelect?.value || "";
    const sort = sortSelect?.value || "relevancia";

    let list = products.slice();

    if(cat){
      list = list.filter(p => normalizeCategory(p.category) === cat);
    }

    if(q){
      list = list.filter(p=>{
        const hay = (p.name+" "+p.description+" "+p.category).toLowerCase();
        return hay.includes(q);
      });
    }

    list = sortProducts(list, sort);

    grid.innerHTML = "";

    if(!list.length){
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No hay productos para mostrar.";
      grid.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(p=> frag.appendChild(renderCard(p)));
    grid.appendChild(frag);
  }

  populateCategories();

  [categorySelect, qInput, sortSelect].forEach(el=>{
    el?.addEventListener("input", render);
    el?.addEventListener("change", render);
  });

  render();
})();

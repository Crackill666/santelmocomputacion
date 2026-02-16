(function(){
  const { STORE_CONFIG } = window;
  const whatsappNumber = (STORE_CONFIG && STORE_CONFIG.whatsappNumber) ? STORE_CONFIG.whatsappNumber : "";

  function qs(sel, root=document){ return root.querySelector(sel); }

  const modal = window.UIModal.createModal();

  function stockLevelText(stock){
    const stockNum = Number(stock || 0);
    if(stockNum <= 0) return "Sin stock";
    if(stockNum <= 3) return "Stock: Bajo";
    if(stockNum <= 5) return "Stock: Medio";
    return "Stock: Alto";
  }


  let DATA = null;
  let currentCategoryId = null;

  function setBrand(){
    const el = document.querySelector("[data-brand-name]");
    if(el && STORE_CONFIG && STORE_CONFIG.storeName) el.textContent = STORE_CONFIG.storeName;
  }

  function setupHotspots(){
    const hs = window.HOTSPOTS || [];
    const stage = document.querySelector("[data-showroom-stage]");
    if(!stage) return;

    hs.forEach(h=>{
      const btn = document.createElement("button");
      btn.type="button";
      btn.className="hotspot";
      btn.style.left = h.x + "%";
      btn.style.top = h.y + "%";
      btn.style.width = h.w + "%";
      btn.style.height = h.h + "%";
      btn.setAttribute("data-hotspot", h.id);

      const title = getHotspotTitle(h.id);
      btn.setAttribute("data-title", title);

      // desktop hover focus
      btn.addEventListener("mouseenter", ()=> btn.classList.add("is-hover"));
      btn.addEventListener("mouseleave", ()=> btn.classList.remove("is-hover"));

      // tap/click
      btn.addEventListener("click", ()=>{
        openCategory(h.id);
      });

      stage.appendChild(btn);
    });
  }

  function getHotspotTitle(id){
    const map = {
      auriculares: "🎧 Auriculares",
      varios: "📦 Varios",
      gaming: "🖱️ Mouse/Teclado",
      mochilas: "🎒 Mochilas",
      storage: "💾 Storage",
      cables: "🔌 Cables",
      catalogo: "🗂️ Catálogo",
      contacto: "📩 Contacto",
    };
    return map[id] || id;
  }

  function norm(s){ return String(s||"").toLowerCase().trim().replace(/\s+/g," "); }

  function attachCategoryIds(data){
    const cats = (data && data.categories) ? data.categories : [];
    const map = new Map();
    for(const c of cats){
      if(c && c.id){
        map.set(norm(c.id), c.id);
        if(c.name) map.set(norm(c.name), c.id);
        if(c.productCategory) map.set(norm(c.productCategory), c.id);
      }
    }
    (data.products||[]).forEach(p=>{
      if(p.category_id) return;
      const key = norm(p.category);
      if(map.has(key)) p.category_id = map.get(key);
      else {
        for(const [k,id] of map.entries()){
          if(!k || !key) continue;
          if((key.includes(k) || k.includes(key)) && (key.length>=3 && k.length>=3)){
            p.category_id = id;
            break;
          }
        }
      }
    });
    return data;
  }

  function fetchData(){
    return window.StoreData.loadProducts().then(d=>attachCategoryIds(d));
  }

  function openCategory(hotspotId, presetQuery=""){
    if(!DATA) return;

    // direct navigation hotspots
    if(hotspotId === "catalogo"){
      window.location.href = "./catalogo.html";
      return;
    }
    if(hotspotId === "contacto"){
      window.location.href = "./contacto.html";
      return;
    }

    currentCategoryId = hotspotId;

    const cat = (DATA.categories||[]).find(c=>c.id===hotspotId) || { name: getHotspotTitle(hotspotId), subtitle: "" };

    modal.setTitle(cat.name || getHotspotTitle(hotspotId), cat.subtitle || "");
    modal.setBackVisible(false);
    modal.setSearchVisible(true);
    modal.clearSearch();

    const all = (DATA.products||[]).filter(p=>p.category_id===hotspotId);
    const render = (query)=>{
      const q = (query||"").trim().toLowerCase();
      const list = q ? all.filter(p => (p.name||"").toLowerCase().includes(q)) : all;
      modal.setBody(renderProductGrid(list, hotspotId));
    };

    modal.onSearch((v)=>render(v));

    modal.open();

    // apply preset query if any
    if(presetQuery){
      const inp = modal.els.search();
      inp.value = presetQuery;
      render(presetQuery);
    } else {
      render("");
    }
  }

  function renderProductGrid(list, hotspotId){
    const wrap = document.createElement("div");
    wrap.className = "grid";

    if(!list.length){
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML = `
        <div class="empty-title">No hay productos para mostrar</div>
        <div class="empty-sub">Probá con otra categoría o buscá por nombre.</div>
      `;
      wrap.appendChild(empty);
      return wrap;
    }

    list.forEach((p, idx)=>{
      wrap.appendChild(renderProductCard(p, hotspotId, idx));
    });

    return wrap;
  }

  function renderProductCard(p, hotspotId, idx){
    const card = document.createElement("div");
    card.className = "card card-product";

    const img0 = (p.images && p.images[0]) ? p.images[0] : "./assets/img/placeholder.jpg";
    const stockText = stockLevelText(p.stock);

    card.innerHTML = `
      <div class="card-media">
        <img alt="" loading="lazy" src="${img0}">
      </div>

      <div class="card-content">
        <div class="card-title"></div>

        <div class="chip-row">
          <span class="chip">${(p.category || getHotspotTitle(hotspotId))}</span>
          <span class="chip">${window.Currency.fmtUSD(Number(p.price_usd || 0))}</span>
          <span class="chip">${stockText}</span>
        </div>

        <div class="card-desc"></div>

        <div class="card-bottom">
          <div class="card-price">
            <div class="usd">${window.Currency.fmtUSD(Number(p.price_usd || 0))}</div>
            <div class="ars">$ARS —</div>
          </div>

          <button class="btn ghost btn-view" type="button" data-view>Ver</button>
        </div>
      </div>
    `;

    const _catName = (p.category || getHotspotTitle(hotspotId) || "Producto");
    const _icon = (window.Utils && window.Utils.iconForCategory) ? window.Utils.iconForCategory(_catName) : "";
    const _titleEl = card.querySelector(".card-title");
    _titleEl.innerHTML = `<span class="mini-icon">${_icon}</span><span class="t">${window.Utils.escapeHtml(p.name || "Producto")}</span>`;
    card.querySelector(".card-desc").textContent = window.Utils.safeText(p.description || "—", 140);

    const arsEl = card.querySelector(".ars");
    const updateArs = (rateState)=>{
      const a = rateState && rateState.rate ? window.Currency.usdToArs(Number(p.price_usd||0)) : null;
      arsEl.textContent = a ? window.Currency.fmtARS(a) : "$ARS —";
    };
    updateArs(window.Currency.getState());
    window.Currency.subscribe(updateArs);

    card.querySelector("[data-view]").addEventListener("click", (e)=>{
      e.stopPropagation();
      openProductDetail(p, hotspotId);
    });

    // allow tap anywhere on card on mobile
    card.addEventListener("click", ()=>{
      openProductDetail(p, hotspotId);
    });

    return card;
  }

  function openProductDetail(p, hotspotId){
    if(!p) return;

    const cat = (DATA.categories||[]).find(c=>c.id===hotspotId) || { name: getHotspotTitle(hotspotId), subtitle: "" };
    modal.setTitle(`${cat.name}`, cat.subtitle || "");
    modal.setBackVisible(true, ()=> openCategory(hotspotId, modal.els.search().value || ""));
    modal.setSearchVisible(true);

    // search in detail redirects back to filtered list (nice UX)
    modal.onSearch((q)=>{
      openCategory(hotspotId, q);
    });

    const node = renderProductDetail(p);
    modal.setBody(node);

    modal.open();
  }

  function renderProductDetail(p){
    const wrap = document.createElement("div");
    wrap.className = "product";

    const imgs = (p.images && p.images.length) ? p.images.slice(0,3) : ["./assets/img/placeholder.jpg"];
    while(imgs.length < 3) imgs.push(imgs[imgs.length-1]);

    const usd = window.Currency.fmtUSD(Number(p.price_usd||0));

    wrap.innerHTML = `
      <div class="product-grid">
        <div class="product-gallery">
          <div class="product-main">
            <img alt="" loading="lazy" src="${imgs[0]}">
          </div>
          <div class="product-thumbs">
            ${imgs.map((src,i)=>`<button class="thumb" type="button" data-idx="${i}" aria-label="Foto ${i+1}">
              <img alt="" loading="lazy" src="${src}">
            </button>`).join("")}
          </div>
        </div>

        <div class="product-info">
          <div class="product-title">${p.name || "Producto"}</div>

          <div class="chip-row" style="margin-top:8px">
            <span class="chip">${p.category || "Producto"}</span>
            <span class="chip">${usd}</span>
            <span class="chip">${stockLevelText(p.stock)}</span>
          </div>

          <div class="product-desc">${window.Utils.escapeHtml(p.description || "—").replace(/\n/g, "<br>")}</div>

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

    // gallery switching
    const mainImg = wrap.querySelector(".product-main img");
    wrap.querySelectorAll(".thumb").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const i = Number(btn.getAttribute("data-idx")||0);
        mainImg.src = imgs[i] || imgs[0];
        wrap.querySelectorAll(".thumb").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    // mark first active
    const firstThumb = wrap.querySelector('.thumb[data-idx="0"]');
    if(firstThumb) firstThumb.classList.add("active");

    // ARS update
    const arsEl = wrap.querySelector("[data-ars]");
    const noteEl = wrap.querySelector("[data-rate-note]");
    const updateArs = (s)=>{
      if(!s || !s.rate){
        arsEl.textContent = "$ARS —";
        noteEl.textContent = "No se pudo actualizar el tipo de cambio.";
        return;
      }
      const a = window.Currency.usdToArs(Number(p.price_usd||0));
      arsEl.textContent = a ? window.Currency.fmtARS(a) : "$ARS —";
      noteEl.textContent = `Tipo de cambio: ${window.Currency.fmtARS(s.rate)} • ${window.Currency.fmtTime(s.updatedAt)}`;
    };
    updateArs(window.Currency.getState());
    window.Currency.subscribe(updateArs);

    const msg = ()=>{
      const s = window.Currency.getState();
      const a = s && s.rate ? window.Currency.fmtARS(window.Currency.usdToArs(Number(p.price_usd||0))) : "ARS (no disponible)";
      return `Hola! Quiero comprar: ${p.name}\nPrecio: ${window.Currency.fmtUSD(Number(p.price_usd||0))}\nPrecio ARS: ${a}`;
    };

    wrap.querySelector("[data-wa]").addEventListener("click", ()=>{
      const url = window.Utils.buildWhatsAppUrl({ number: whatsappNumber, text: msg() });
      window.open(url, "_blank", "noopener");
    });

    return wrap;
  }

  async function init(){
    setBrand();

    // WhatsApp FAB
    const fab = document.querySelector("[data-fab-whatsapp]");
    if(fab){
      fab.addEventListener("click", ()=>{
        const url = window.Utils.buildWhatsAppUrl({
          number: whatsappNumber,
          text: (STORE_CONFIG && STORE_CONFIG.whatsappDefaultText) ? STORE_CONFIG.whatsappDefaultText : "Hola! Quiero hacer una consulta."
        });
        window.open(url, "_blank", "noopener");
      });
    }


    // load data
    try{
      DATA = await fetchData();
    }catch(_){
      const hint = document.querySelector("[data-showroom-hint]");
      if(hint) hint.textContent = "No se pudo cargar el catálogo. Verificá assets/data/products.json";
      return;
    }

    // currency badge
    window.Currency.mountBadge({
      el: document.querySelector(".rate-pill"),
      textEl: document.querySelector("[data-rate-value]"),
      metaEl: document.querySelector("[data-rate-sub]"),
    });
    window.Currency.startAutoRefresh({ intervalMs: 600_000 });

    // hotspots
    setupHotspots();

    // if user clicks the hint, open catalog
    const hintBtn = document.querySelector("[data-open-catalog]");
    if(hintBtn){
      hintBtn.addEventListener("click", ()=> window.location.href="./catalogo.html");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
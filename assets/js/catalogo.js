(async function(){
  const { storeName, whatsappNumber } = window.STORE_CONFIG || {};

  // Currency badge (compact)
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
      const url = window.Utils.buildWhatsAppUrl({ number: whatsappNumber, text: "Hola! Quiero hacer una consulta." });
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

  const products = Array.isArray(data.products) ? data.products : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];

  const categorySelect = document.querySelector("[data-filter-category]");
  const qInput = document.querySelector("[data-filter-q]");
  const sortSelect = document.querySelector("[data-filter-sort]");
  const grid = document.querySelector("[data-catalog-grid]");

  // Modal detalle
  const modal = (window.UIModal && window.UIModal.createModal) ? window.UIModal.createModal() : null;

  function stockLevelText(stock){
    const stockNum = Number(stock || 0);
    if(stockNum <= 0) return "Sin stock";
    if(stockNum <= 3) return "Stock: Bajo";
    if(stockNum <= 5) return "Stock: Medio";
    return "Stock: Alto";
  }


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

    const imgs0 = (p.images && p.images.length) ? p.images.slice(0,3) : ["./assets/img/placeholder.jpg"];
    const imgs = imgs0.slice();
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
          <div class="product-title">${window.Utils.escapeHtml(p.name || "Producto")}</div>

          <div class="chip-row" style="margin-top:8px">
            <span class="chip">${window.Utils.escapeHtml(p.category || "Producto")}</span>
            <span class="chip">${usd}</span>
            <span class="chip">${stockLevelText(p.stock)}</span>
          </div>

          <div class="product-desc">${window.Utils.escapeHtml(p.description || "—").replace(/\\n/g, "<br>")}</div>

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

    // thumbs
    const mainImg = wrap.querySelector(".product-main img");
    wrap.querySelectorAll(".thumb").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const i = Number(btn.getAttribute("data-idx")||0);
        mainImg.src = imgs[i] || imgs[0];
        wrap.querySelectorAll(".thumb").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    const firstThumb = wrap.querySelector('.thumb[data-idx="0"]');
    if(firstThumb) firstThumb.classList.add("active");

    // img fallback
    wrap.querySelectorAll("img").forEach(img=>{
      img.addEventListener("error", ()=>{ img.src="./assets/img/placeholder.jpg"; });
    });

    // ARS
    const arsEl = wrap.querySelector("[data-ars]");
    const noteEl = wrap.querySelector("[data-rate-note]");
    const updateArs = (s)=>{
      const a = (s && s.rate) ? window.Currency.usdToArs(Number(p.price_usd||0)) : null;
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

    // WhatsApp
    const waBtn = wrap.querySelector("[data-wa]");
    if(waBtn){
      waBtn.addEventListener("click", (e)=>{
        e.preventDefault();
        const rate = window.Currency.getState().rate;
        const ars = rate ? window.Currency.fmtARS(window.Currency.usdToArs(Number(p.price_usd||0))) : "$ARS —";
        const msg = `Hola! Quiero comprar/consultar:\n${p.name}\n${window.Currency.fmtUSD(Number(p.price_usd||0))} — ${ars}`;
        const url = window.Utils.buildWhatsAppUrl({ number: whatsappNumber, text: msg });
        window.open(url, "_blank", "noopener");
      });
    }

    return wrap;
  }

  function populateCategories(){
    window.SelectX && window.SelectX.init();
    if(!categorySelect) return;
    categorySelect.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "Todas";
    categorySelect.appendChild(optAll);

    const byName = new Map();
    for(const c of categories){
      if(c && c.name) byName.set(c.name, c);
    }
    // also include any category names from products
    const names = new Set(categories.map(c=>c && c.name).filter(Boolean));
    products.forEach(p=>{ if(p && p.category) names.add(p.category); });
    Array.from(names).sort((a,b)=>String(a).localeCompare(String(b), "es")).forEach(n=>{
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
    } else {
      // relevancia: mantiene orden del JSON
    }
    return arr;
  }

  function renderCard(p){
    const card = document.createElement("article");
    card.className = "card";

    const img0 = (p.images && p.images[0]) ? p.images[0] : "./assets/img/placeholder.jpg";
    
    const stockText = stockLevelText(p.stock);
const catName = (p.category || "Producto");
    const icon = (window.Utils && window.Utils.iconForCategory) ? window.Utils.iconForCategory(catName) : "";

    card.innerHTML = `
      <div class="card-media">
        <img alt="" loading="lazy" src="${img0}">
      </div>

      <div class="card-content">
        <div class="card-title"><span class="mini-icon">${icon}</span><span class="t">${window.Utils.escapeHtml(p.name || "Producto")}</span></div>

        <div class="chip-row">
          <span class="chip">${window.Utils.escapeHtml(catName)}</span>
          <span class="chip">${window.Currency.fmtUSD(Number(p.price_usd || 0))}</span>
          <span class="chip">${stockText}</span>
        </div>

        <div class="card-desc">${window.Utils.safeText(p.description || "", 120)}</div>

        <div class="card-bottom">
          <div class="card-price">${window.Currency.fmtUSD(Number(p.price_usd || 0))}</div>
          <button class="btn tiny" type="button" data-view>Ver</button>
        </div>
      </div>
    `;

    const img = card.querySelector("img");
    if(img){
      img.addEventListener("error", ()=>{ img.src="./assets/img/placeholder.jpg"; });
    }

    const viewBtn = card.querySelector("[data-view]");
    if(viewBtn){
      viewBtn.addEventListener("click", (e)=>{ e.stopPropagation(); openProductDetail(p); });
    }
    card.addEventListener("click", ()=> openProductDetail(p));
    return card;
  }

  function render(){
    if(!grid) return;
    const q = (qInput && qInput.value) ? qInput.value.trim().toLowerCase() : "";
    const cat = (categorySelect && categorySelect.value) ? categorySelect.value : "";
    const sort = (sortSelect && sortSelect.value) ? sortSelect.value : "relevancia";

    let list = products.slice();

    if(cat){
      list = list.filter(p => String(p.category||"") === String(cat));
    }
    if(q){
      list = list.filter(p=>{
        const hay = (String(p.name||"")+" "+String(p.description||"")+" "+String(p.category||"")).toLowerCase();
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
    if(!el) return;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  render();
})();
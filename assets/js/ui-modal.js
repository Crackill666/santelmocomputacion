(function(){
  function qs(sel, root=document){ return root.querySelector(sel); }

  function createModal(){
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-backdrop" data-close="1"></div>
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Productos">
        <div class="modal-header">
          <div class="modal-title">
            <h2 id="modalTitle">Productos</h2>
            <div class="meta" id="modalMeta">—</div>
          </div>

          <div class="modal-search" id="modalSearchWrap" aria-hidden="false">
            <span class="modal-search-ico">🔎</span>
            <input id="modalSearch" type="search" inputmode="search" placeholder="Buscar producto…" autocomplete="off" />
          </div>

          <div class="modal-actions">
            <button class="chip-btn" type="button" id="modalBack" aria-label="Volver" style="display:none">← Volver</button>
            <button class="icon-btn" type="button" aria-label="Cerrar" data-close="1">✕</button>
          </div>
        </div>
        <div class="modal-body" id="modalBody"></div>
      </div>
    `;
    document.body.appendChild(modal);

    function close(){
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }
    function open(){
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      // focus search by default (nice on desktop)
      const inp = qs("#modalSearch", modal);
      if(inp && qs("#modalSearchWrap", modal).style.display !== "none"){
        setTimeout(()=>inp.focus(), 60);
      }
    }

    modal.addEventListener("click", (e)=>{
      const t = e.target;
      if(t && t.getAttribute && t.getAttribute("data-close")==="1"){
        close();
      }
    });

    document.addEventListener("keydown",(e)=>{
      if(e.key==="Escape" && modal.classList.contains("open")) close();
    });

    return {
      modal,
      open,
      close,
      els: {
        title: ()=>qs("#modalTitle", modal),
        meta: ()=>qs("#modalMeta", modal),
        body: ()=>qs("#modalBody", modal),
        searchWrap: ()=>qs("#modalSearchWrap", modal),
        search: ()=>qs("#modalSearch", modal),
        back: ()=>qs("#modalBack", modal),
      },
      setTitle(title, meta=""){
        qs("#modalTitle", modal).textContent = title;
        qs("#modalMeta", modal).textContent = meta;
      },
      setBody(node){
        const body = qs("#modalBody", modal);
        body.innerHTML = "";
        body.appendChild(node);
      },
      setSearchVisible(visible){
        const wrap = qs("#modalSearchWrap", modal);
        wrap.style.display = visible ? "" : "none";
        wrap.setAttribute("aria-hidden", visible ? "false" : "true");
      },
      setBackVisible(visible, onClick){
        const back = qs("#modalBack", modal);
        back.style.display = visible ? "" : "none";
        back.onclick = (typeof onClick === "function") ? onClick : null;
      },
      onSearch(handler){
        const inp = qs("#modalSearch", modal);
        inp.oninput = ()=> handler(inp.value || "");
      },
      clearSearch(){
        const inp = qs("#modalSearch", modal);
        inp.value = "";
      }
    };
  }

  window.UIModal = { createModal };
})();
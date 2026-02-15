(function(){
  const STATE = {
    rate: null,
    updatedAt: null,
    error: null,
    listeners: new Set(),
    started: false,
    timer: null,
  };

  function fmtARS(n){
    try{
      const num = new Intl.NumberFormat("es-AR", { maximumFractionDigits:0 }).format(Number(n||0));
      return `$ARS ${num}`;
    }catch(e){
      return `$ARS ${Math.round(Number(n||0))}`;
    }
  }

  function fmtUSD(n){
    const v = Number(n||0);
    const s = (Number.isFinite(v) ? v : 0).toFixed(2);
    return `USD ${s}`;
  }

  function fmtTime(ts){
    if(!ts) return "";
    try{
      return new Date(ts).toLocaleString("es-AR", { hour12:false });
    }catch(_){
      return String(ts);
    }
  }

  function notify(){
    STATE.listeners.forEach(fn=>{
      try{ fn({ ...STATE }); }catch(_){}
    });
  }

  async function fetchRate(){
    // Binance public API (USDTARS)
    const url = "https://api.binance.com/api/v3/ticker/price?symbol=USDTARS";
    try{
      const res = await fetch(url, { cache: "no-store" });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      const rate = Number(json.price);
      if(!Number.isFinite(rate)) throw new Error("Bad rate");
      STATE.rate = rate;
      STATE.updatedAt = Date.now();
      STATE.error = null;
      notify();
      return rate;
    }catch(err){
      STATE.error = String(err && err.message ? err.message : err);
      // keep previous rate if any; UI will decide what to show
      notify();
      return null;
    }
  }

  function startAutoRefresh({ intervalMs = 60_000 } = {}){
    if(STATE.started) return;
    STATE.started = true;
    fetchRate();
    STATE.timer = setInterval(fetchRate, intervalMs);
  }

  function subscribe(fn){
    STATE.listeners.add(fn);
    fn({ ...STATE });
    return () => STATE.listeners.delete(fn);
  }

  function usdToArs(usd){
    if(!STATE.rate || !Number.isFinite(usd)) return null;
    return usd * STATE.rate;
  }

  function getState(){
    return { ...STATE };
  }

  function mountBadge({ el, textEl, metaEl }){
    if(!el) return;
    el.style.display = "";
    subscribe((s)=>{
      if(!s.rate){
        if(textEl) textEl.textContent = "USDT/ARS: —";
        if(metaEl) metaEl.textContent = s.error ? `No se pudo actualizar` : "";
        el.classList.add("is-error");
        return;
      }
      el.classList.remove("is-error");
      if(textEl) textEl.textContent = `USDT/ARS: ${fmtARS(s.rate).replace("$ARS", "$")}`;
      if(metaEl) metaEl.textContent = ""; el.title = `Actualizado: ${fmtTime(s.updatedAt)}`;
    });
  }

  window.Currency = { startAutoRefresh, subscribe, usdToArs, fmtARS, fmtUSD, fmtTime, getState, mountBadge };
})();
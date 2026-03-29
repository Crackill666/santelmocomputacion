(function(){
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

  async function fetchHealth(){
    const urls = apiCandidates("/api/health");
    let lastError = null;

    for(const url of urls){
      try{
        const res = await fetch(url, { method: "GET", cache: "no-store" });
        const data = await res.json().catch(()=> ({}));
        if(!res.ok || !data.ok){
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
      }catch(err){
        lastError = err;
      }
    }

    throw lastError || new Error("No se pudo consultar /api/health");
  }

  function setBadgeState(root, valueEl, mode, kind, title){
    if(!root || !valueEl) return;

    root.classList.remove("is-mock", "is-demo", "is-real", "is-offline");
    if(kind) root.classList.add(kind);
    if(title) root.title = title;

    valueEl.textContent = mode;
  }

  function warnWrongLocalUrl(){
    const host = String(window.location.hostname || "").toLowerCase();
    const port = String(window.location.port || "");
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    if(!isLocalHost || !port || port === "3000"){
      return;
    }

    const message = [
      "Prueba local detectada en puerto no recomendado.",
      "Usa esta URL para flujo completo:",
      "http://localhost:3000/catalogo.html",
      "",
      "No uses:",
      `${window.location.protocol}//${host}:${port}${window.location.pathname || "/"}`,
    ].join("\n");

    window.setTimeout(()=>{
      window.alert(message);
    }, 120);
  }

  async function mountRuntimeBadge(){
    const root = document.querySelector("[data-runtime-mode-badge]");
    const valueEl = document.querySelector("[data-runtime-mode-value]");
    if(!root || !valueEl) return;

    setBadgeState(root, valueEl, "CARGANDO...", null, "Consultando modo operativo");

    try{
      const health = await fetchHealth();
      const mode = String(health.runtime_mode || "MOCK").toUpperCase();
      const mp = health.mercado_pago || {};
      const detail = `MP ${String(mp.mode || "-").toUpperCase()} | fallback=${Boolean(mp.fallback_to_mock)} | test_force_mock=${Boolean(mp.test_token_force_mock)}`;

      if(mode === "REAL ESTRICTO"){
        setBadgeState(root, valueEl, mode, "is-real", detail);
        return;
      }

      if(mode === "DEMO-REAL"){
        setBadgeState(root, valueEl, mode, "is-demo", detail);
        return;
      }

      setBadgeState(root, valueEl, "MOCK", "is-mock", detail);
    }catch(err){
      setBadgeState(root, valueEl, "OFFLINE", "is-offline", String(err && err.message ? err.message : err));
    }
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    warnWrongLocalUrl();
    mountRuntimeBadge();
  });
})();

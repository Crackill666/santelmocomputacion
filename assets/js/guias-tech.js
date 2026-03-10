(function(){
  function trackLead(){
    if(typeof window.fbq === "function"){
      window.fbq("track", "Lead");
    }
  }

  function openWhatsApp(text){
    const cfg = window.STORE_CONFIG || {};
    if(!window.Utils || typeof window.Utils.buildWhatsAppUrl !== "function") return;
    const url = window.Utils.buildWhatsAppUrl({
      number: cfg.whatsappNumber,
      text: text || cfg.whatsappDefaultText || "Hola! Quiero hacer una consulta."
    });
    window.open(url, "_blank", "noopener");
  }

  function bindActions(){
    const viewBtn = document.querySelector("[data-guide-view]");
    if(viewBtn){
      viewBtn.addEventListener("click", function(e){
        e.preventDefault();
        trackLead();
        window.location.href = "./index.html?category=varios&product=aspiradora-solpadora-aire-portatil-hogar-auto";
      });
    }

    const fab = document.querySelector("[data-fab-whatsapp]");
    if(fab){
      fab.addEventListener("click", function(){
        trackLead();
        openWhatsApp();
      });
    }
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

  document.addEventListener("DOMContentLoaded", function(){
    bindActions();
    mountRatePill();
  });
})();

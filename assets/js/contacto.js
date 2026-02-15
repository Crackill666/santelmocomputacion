(function(){
  const cfg = window.STORE_CONFIG || {};
  const set = (sel, v)=>{
    const el = document.querySelector(sel);
    if(el) el.textContent = v || "—";
  };
  const setHref = (sel, href)=>{
    const el = document.querySelector(sel);
    if(el && href){
      el.href = href;
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    }
  };

  const brandName = document.querySelector("[data-brand-name]");
  if(brandName && cfg.storeName) brandName.textContent = cfg.storeName;

  set("[data-contact-address]", cfg.address);
  set("[data-contact-phone]", cfg.phone);
  set("[data-contact-email]", cfg.email);

  const phoneLink = document.querySelector("[data-contact-phone-link]");
  if(phoneLink && cfg.phone){
    phoneLink.href = "tel:" + String(cfg.phone).replace(/\s+/g,"");
  }
  const emailLink = document.querySelector("[data-contact-email-link]");
  if(emailLink && cfg.email){
    emailLink.href = "mailto:" + cfg.email;
  }

  if(cfg.googleMapsUrl) setHref("[data-contact-maps]", cfg.googleMapsUrl);
  if(cfg.instagramUrl) setHref("[data-contact-ig]", cfg.instagramUrl);

  const waBtn = document.querySelector("[data-contact-wa]");
  if(waBtn){
    waBtn.addEventListener("click", ()=>{
      const url = window.Utils.buildWhatsAppUrl({
        number: cfg.whatsappNumber,
        text: cfg.whatsappDefaultText || "Hola! Quiero hacer una consulta."
      });
      window.open(url, "_blank", "noopener");
    });
  }


  // Tipo de cambio (compacto en la barra)
  if(window.Currency){
    window.Currency.mountBadge({
      el: document.querySelector('.rate-pill'),
      textEl: document.querySelector('[data-rate-value]'),
      metaEl: null,
    });
    window.Currency.startAutoRefresh({ intervalMs: 600_000 });
  }

  const fab = document.querySelector("[data-fab-whatsapp]");
  if(fab){
    fab.addEventListener("click", ()=>{
      const url = window.Utils.buildWhatsAppUrl({
        number: cfg.whatsappNumber,
        text: cfg.whatsappDefaultText || "Hola! Quiero hacer una consulta."
      });
      window.open(url, "_blank", "noopener");
    });
  }
})();

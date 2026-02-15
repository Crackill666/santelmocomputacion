(function(){
  function encodeWhatsAppText(text){
    return encodeURIComponent(String(text||"").replace(/\s+/g," ").trim());
  }

  function buildWhatsAppUrl({ number, text }){
    const n = String(number||"").replace(/[^\d]/g,"");
    const base = n ? `https://wa.me/${n}` : "https://wa.me/";
    return `${base}?text=${encodeWhatsAppText(text||"")}`;
  }

  function safeText(s, max=220){
    const t = String(s||"").replace(/\s+/g," ").trim();
    if(t.length<=max) return t;
    return t.slice(0, Math.max(0, max-1)) + "…";
  }

  function escapeHtml(str){
    return String(str||"")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function toast(message){
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(()=> el.classList.add("show"));
    setTimeout(()=>{
      el.classList.remove("show");
      setTimeout(()=> el.remove(), 240);
    }, 1400);
  }

  
  function iconForCategory(name){
    const s = String(name||"").toLowerCase();
    // Minimal inline SVG icons (monochrome, inherit currentColor)
    const icons = {
      auriculares: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a8 8 0 0 0-8 8v7a3 3 0 0 0 3 3h2v-9H7a1 1 0 0 0-1 1v6a1 1 0 0 1-1-1v-7a7 7 0 1 1 14 0v7a1 1 0 0 1-1 1v-6a1 1 0 0 0-1-1h-2v9h2a3 3 0 0 0 3-3v-7a8 8 0 0 0-8-8Z"/></svg>`,
      gaming: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.5 14.5h-1v1a1 1 0 0 1-2 0v-1h-1a1 1 0 0 1 0-2h1v-1a1 1 0 1 1 2 0v1h1a1 1 0 0 1 0 2Zm9.2-2.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm-2.4 2.4a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM7 7h10a5 5 0 0 1 4.9 4l1 5a3 3 0 0 1-5.5 2l-1.2-2H7.8l-1.2 2A3 3 0 0 1 1.1 16l1-5A5 5 0 0 1 7 7Z"/></svg>`,
      storage: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4h6v2H9V8Zm0 4h6v2H9v-2Zm0 4h4v2H9v-2Z"/></svg>`,
      cables: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2a2 2 0 0 1 2 2v3h6V4a2 2 0 1 1 4 0v3a4 4 0 0 1-4 4h-1v2.5A5.5 5.5 0 0 1 8.5 19H8a4 4 0 1 1 0-8h4V9H9A4 4 0 0 1 5 5V4a2 2 0 0 1 2-2Zm1 11H8a2 2 0 1 0 0 4h.5a3.5 3.5 0 0 0 3.5-3.5V11H8Z"/></svg>`,
      mochilas: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a4 4 0 0 0-4 4v1H7a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h1v-5h8v5h1a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3h-1V7a4 4 0 0 0-4-4Zm-2 5V7a2 2 0 1 1 4 0v1h-4Zm-1 5h6v2H9v-2Z"/></svg>`,
      varios: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm10 0a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V5ZM4 15a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3Zm10 0a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-3Z"/></svg>`
    };
    // match by keyword
    if(s.includes("auricular")) return icons.auriculares;
    if(s.includes("gaming") || s.includes("mouse") || s.includes("teclado")) return icons.gaming;
    if(s.includes("storage") || s.includes("memoria") || s.includes("pendrive") || s.includes("disco") || s.includes("sd")) return icons.storage;
    if(s.includes("cable")) return icons.cables;
    if(s.includes("mochila")) return icons.mochilas;
    if(s.includes("vario")) return icons.varios;
    return icons.varios;
  }

  window.Utils = { buildWhatsAppUrl, safeText, escapeHtml, toast, iconForCategory };
})();
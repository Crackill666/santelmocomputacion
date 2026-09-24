(()=>{
  const STORAGE_KEY = "stc-home-notice-2026-09-24";

  function initHomeNotice(){
    const notice = document.querySelector("[data-home-notice]");
    const closeButton = notice?.querySelector("[data-home-notice-close]");
    if(!notice || !closeButton) return;

    try{
      if(sessionStorage.getItem(STORAGE_KEY) === "closed") return;
    }catch(_){
      // El aviso sigue funcionando aunque el navegador bloquee sessionStorage.
    }

    const previouslyFocused = document.activeElement;

    function closeNotice(){
      notice.hidden = true;
      document.body.classList.remove("home-notice-open");

      try{
        sessionStorage.setItem(STORAGE_KEY, "closed");
      }catch(_){
        // No es necesario persistir el cierre para poder seguir navegando.
      }

      document.removeEventListener("keydown", handleKeydown);
      if(previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    }

    function handleKeydown(event){
      if(event.key === "Escape") closeNotice();
      if(event.key === "Tab"){
        event.preventDefault();
        closeButton.focus();
      }
    }

    notice.hidden = false;
    document.body.classList.add("home-notice-open");
    closeButton.addEventListener("click", closeNotice, { once:true });
    document.addEventListener("keydown", handleKeydown);
    closeButton.focus();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initHomeNotice, { once:true });
  }else{
    initHomeNotice();
  }
})();

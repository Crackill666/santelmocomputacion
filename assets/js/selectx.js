/* assets/js/selectx.js
   SelectX — custom dropdown glassmorphism (mobile-first)
   - Mantiene el <select> real sincronizado
   - RECONSTRUYE opciones al abrir (ideal para selects que se llenan por JS)
   - Dispara 'change' para que catalogo.js siga funcionando sin tocarlo
*/
(function () {
  "use strict";

  const WRAP_CLASS = "selectx-wrap";
  const BTN_CLASS = "selectx-btn";
  const MENU_CLASS = "selectx-menu";
  const OPT_CLASS = "selectx-opt";
  const OPT_ACTIVE = "is-active";
  const OPEN_CLASS = "is-open";

  const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));

  function closeAll(exceptWrap = null) {
    qsa(document, `.${WRAP_CLASS}.${OPEN_CLASS}`).forEach(w => {
      if (exceptWrap && w === exceptWrap) return;
      w.classList.remove(OPEN_CLASS);
      const btn = w.querySelector(`.${BTN_CLASS}`);
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function isDisabled(select) {
    return select.disabled || select.hasAttribute("disabled");
  }

  function getSelectedOption(select) {
    return select.options[select.selectedIndex] || select.options[0];
  }

  function setButtonLabel(btn, select) {
    const opt = getSelectedOption(select);
    const label = opt ? (opt.textContent || "").trim() : "";
    btn.querySelector(".selectx-label").textContent = label || "Seleccionar";
  }

  function setActive(menu, value) {
    qsa(menu, `.${OPT_CLASS}`).forEach(el => {
      const is = el.getAttribute("data-value") === value;
      el.classList.toggle(OPT_ACTIVE, is);
      el.setAttribute("aria-selected", is ? "true" : "false");
    });
  }

  function scrollIntoViewIfNeeded(container, el) {
    if (!el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    if (eRect.top < cRect.top) container.scrollTop -= (cRect.top - eRect.top) + 8;
    else if (eRect.bottom > cRect.bottom) container.scrollTop += (eRect.bottom - cRect.bottom) + 8;
  }

  function buildMenuFromSelect(select, menu) {
    // reconstruye siempre (para categorías que se agregan por JS)
    menu.innerHTML = "";
    const opts = Array.from(select.options);

    opts.forEach((o, idx) => {
      const div = document.createElement("div");
      div.className = OPT_CLASS;
      div.setAttribute("role", "option");
      div.setAttribute("data-value", o.value);
      div.setAttribute("data-index", String(idx));
      div.textContent = (o.textContent || "").trim();
      div.setAttribute("aria-selected", "false");

      if (o.disabled) {
        div.setAttribute("aria-disabled", "true");
        div.classList.add("is-disabled");
      }
      menu.appendChild(div);
    });

    setActive(menu, select.value);
  }

  function enhanceSelect(select) {
    if (!select || select.dataset.selectx === "1") return;

    const parent = select.parentElement;
    if (!parent) return;

    select.dataset.selectx = "1";

    const wrap = document.createElement("div");
    wrap.className = WRAP_CLASS;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = BTN_CLASS;
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `
      <span class="selectx-label"></span>
      <span class="selectx-chev" aria-hidden="true">▾</span>
    `;

    const menu = document.createElement("div");
    menu.className = MENU_CLASS;
    menu.setAttribute("role", "listbox");
    menu.tabIndex = -1;

    // Hacemos el select invisible pero funcional
    select.classList.add("selectx-native");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    // Insertamos wrapper y movemos todo adentro
    parent.insertBefore(wrap, select);
    wrap.appendChild(select);
    wrap.appendChild(btn);
    wrap.appendChild(menu);

    // Estado inicial
    setButtonLabel(btn, select);
    buildMenuFromSelect(select, menu);

    if (isDisabled(select)) {
      btn.disabled = true;
      wrap.classList.add("is-disabled");
    }

    function open() {
      if (btn.disabled) return;
      closeAll(wrap);

      // 👇 clave: reconstruir al abrir para capturar categorías nuevas
      buildMenuFromSelect(select, menu);
      setButtonLabel(btn, select);

      wrap.classList.add(OPEN_CLASS);
      btn.setAttribute("aria-expanded", "true");

      const active = menu.querySelector(`.${OPT_CLASS}.${OPT_ACTIVE}`) || menu.querySelector(`.${OPT_CLASS}:not(.is-disabled)`);
      if (active) scrollIntoViewIfNeeded(menu, active);
    }

    function close() {
      wrap.classList.remove(OPEN_CLASS);
      btn.setAttribute("aria-expanded", "false");
    }

    function toggle() {
      if (wrap.classList.contains(OPEN_CLASS)) close();
      else open();
    }

    function selectValue(value) {
      if (select.value === value) return;
      select.value = value;

      setButtonLabel(btn, select);
      setActive(menu, select.value);

      // Dispara change para que catalogo.js renderice
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    menu.addEventListener("click", (e) => {
      const opt = e.target.closest(`.${OPT_CLASS}`);
      if (!opt || opt.classList.contains("is-disabled")) return;
      selectValue(opt.getAttribute("data-value"));
      close();
      btn.focus();
    });

    // Sync si alguien cambia el select por código
    select.addEventListener("change", () => {
      setButtonLabel(btn, select);
      // menu se actualiza en open(), pero esto mantiene activo si está abierto
      if (wrap.classList.contains(OPEN_CLASS)) setActive(menu, select.value);
    });

    // Close outside
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) close();
    });

    // Keyboard básico
    btn.addEventListener("keydown", (e) => {
      if (btn.disabled) return;
      const key = e.key;

      if (key === "ArrowDown" || key === "ArrowUp") {
        e.preventDefault();
        open();

        const items = qsa(menu, `.${OPT_CLASS}:not(.is-disabled)`);
        if (!items.length) return;

        let idx = items.findIndex(x => x.classList.contains(OPT_ACTIVE));
        if (idx < 0) idx = 0;
        idx += (key === "ArrowDown" ? 1 : -1);
        idx = Math.max(0, Math.min(items.length - 1, idx));

        const next = items[idx];
        setActive(menu, next.getAttribute("data-value"));
        scrollIntoViewIfNeeded(menu, next);
      } else if (key === "Enter" || key === " ") {
        e.preventDefault();
        toggle();
      } else if (key === "Escape") {
        e.preventDefault();
        close();
      }
    });

    menu.addEventListener("keydown", (e) => {
      const key = e.key;
      const items = qsa(menu, `.${OPT_CLASS}:not(.is-disabled)`);
      if (!items.length) return;

      let idx = items.findIndex(x => x.classList.contains(OPT_ACTIVE));
      if (idx < 0) idx = 0;

      if (key === "ArrowDown" || key === "ArrowUp") {
        e.preventDefault();
        idx += (key === "ArrowDown" ? 1 : -1);
        idx = Math.max(0, Math.min(items.length - 1, idx));
        const next = items[idx];
        setActive(menu, next.getAttribute("data-value"));
        scrollIntoViewIfNeeded(menu, next);
      } else if (key === "Enter") {
        e.preventDefault();
        const active = items[idx];
        if (active) selectValue(active.getAttribute("data-value"));
        close();
        btn.focus();
      } else if (key === "Escape") {
        e.preventDefault();
        close();
        btn.focus();
      }
    });

    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, { passive: true });
  }

  function init(scope = document) {
    // Tomamos todos los selects (incluye los que llenás luego)
    qsa(scope, "select").forEach(enhanceSelect);
  }

  window.SelectX = { init };
})();

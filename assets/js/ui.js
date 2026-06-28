/* =========================================================================
   Moloni POS — ui.js
   Helpers partilhados: formatação de moeda/peso, dev-nav, toggle idioma,
   toasts (com desfazer) e modais (com foco/Esc). Carregar por último.
   ========================================================================= */
window.POS = window.POS || {};

(function (POS) {
  "use strict";

  /* ---------- Formatação ---------- */
  var fmtCache = {};
  function moneyFmt() {
    var key = POS.lang;
    if (!fmtCache[key]) {
      fmtCache[key] = new Intl.NumberFormat(POS.lang === "pt" ? "pt-PT" : "en-IE", {
        style: "currency", currency: "EUR",
      });
    }
    return fmtCache[key];
  }
  POS.money = function (cents) { return moneyFmt().format((cents || 0) / 100); };
  POS.weight = function (kg) {
    return new Intl.NumberFormat(POS.lang === "pt" ? "pt-PT" : "en-IE", {
      minimumFractionDigits: 3, maximumFractionDigits: 3,
    }).format(kg) + " kg";
  };

  /* ---------- Tema / modo ---------- */
  var themeSubs = [];
  POS.THEMES = ["normal", "dark", "vivo", "clean"];
  POS.theme = (function () { try { return sessionStorage.getItem("pos_theme") || "normal"; } catch (e) { return "normal"; } })();
  POS.onThemeChange = function (fn) { if (typeof fn === "function") themeSubs.push(fn); };
  POS.setTheme = function (t) {
    if (POS.THEMES.indexOf(t) < 0) t = "normal";
    POS.theme = t;
    var r = document.documentElement;
    if (t === "normal") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t);
    try { sessionStorage.setItem("pos_theme", t); } catch (e) {}
    themeSubs.forEach(function (fn) { try { fn(t); } catch (e) {} });
  };
  (function () { var t = POS.theme; if (t && t !== "normal") document.documentElement.setAttribute("data-theme", t); })();

  /* ---------- Layout ---------- */
  var layoutSubs = [];
  POS.LAYOUTS = ["a", "b", "c"];
  POS.layout = (function () { try { return sessionStorage.getItem("pos_layout") || "a"; } catch (e) { return "a"; } })();
  POS.onLayoutChange = function (fn) { if (typeof fn === "function") layoutSubs.push(fn); };
  function reducedMotion() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches; }
  POS.setLayout = function (l) {
    if (POS.LAYOUTS.indexOf(l) < 0) l = "a";
    var apply = function () { POS.layout = l; document.documentElement.setAttribute("data-layout", l); };
    if (document.startViewTransition && !reducedMotion()) document.startViewTransition(apply); else apply();
    try { sessionStorage.setItem("pos_layout", l); } catch (e) {}
    layoutSubs.forEach(function (fn) { try { fn(l); } catch (e) {} });
  };
  (function () {
    var l = POS.layout; if (l && l !== "a") document.documentElement.setAttribute("data-layout", l);
    try { var w = sessionStorage.getItem("pos_ops_w"); if (w) document.documentElement.style.setProperty("--ops-w", w); } catch (e) {}
  })();

  /* ---------- dev-nav (andaime de protótipo — só com ?dev=1) ---------- */
  var NAV = [
    { key: "sale",     href: "sale.html",            label: "nav.sale" },
    { key: "register", href: "register-close.html",  label: "nav.register" },
    { key: "docs",     href: "docs.html",            label: "nav.docs" },
    { key: "tables",   href: "tables.html",          label: "nav.tables" },
  ];

  POS.mountDevNav = function (activeKey) {
    var dev = /[?&]dev=1/.test(location.search);
    try { if (localStorage.getItem("pos_dev") === "1") dev = true; } catch (e) {}
    if (!dev) return;
    var nav = document.createElement("nav");
    nav.className = "dev-nav";
    nav.setAttribute("aria-label", "Protótipo");
    nav.innerHTML =
      '<strong>POS · proto</strong>' +
      '<div class="dev-nav__links"></div>' +
      '<div class="dev-nav__lang" role="group" aria-label="Idioma">' +
        '<button type="button" data-lang="pt">PT</button>' +
        '<button type="button" data-lang="en">EN</button>' +
      '</div>';
    var links = nav.querySelector(".dev-nav__links");
    NAV.forEach(function (item) {
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = POS.s(item.label);
      a.dataset.navlabel = item.label;
      if (item.key === activeKey) a.setAttribute("aria-current", "page");
      links.appendChild(a);
    });
    nav.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === POS.lang));
      b.addEventListener("click", function () { POS.setLang(b.dataset.lang); });
    });
    document.body.insertBefore(nav, document.body.firstChild);

    POS.onLangChange(function () {
      links.querySelectorAll("a").forEach(function (a) { a.textContent = POS.s(a.dataset.navlabel); });
      nav.querySelectorAll("[data-lang]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.lang === POS.lang));
      });
    });
  };

  /* ---------- Toasts ---------- */
  function toastHost() {
    var host = document.querySelector(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    return host;
  }

  POS.toast = function (message, opts) {
    opts = opts || {};
    var host = toastHost();
    var el = document.createElement("div");
    el.className = "toast" + (opts.variant ? " toast--" + opts.variant : "");
    var label = document.createElement("span");
    label.textContent = message;
    el.appendChild(label);

    var timer;
    function close() {
      clearTimeout(timer);
      el.classList.add("is-leaving");
      el.addEventListener("animationend", function () { el.remove(); }, { once: true });
    }
    if (opts.action) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "toast__action";
      btn.textContent = opts.action.label;
      btn.addEventListener("click", function () { opts.action.onClick(); close(); });
      el.appendChild(btn);
    }
    host.appendChild(el);
    timer = setTimeout(close, opts.duration || 3200);
    return close;
  };

  /* ---------- Modal (foco + Esc + backdrop) ---------- */
  POS.openModal = function (contentNode, opts) {
    opts = opts || {};
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    var modal = document.createElement("div");
    modal.className = "modal" + (opts.className ? " " + opts.className : "");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    if (opts.label) modal.setAttribute("aria-label", opts.label);
    modal.appendChild(contentNode);
    backdrop.appendChild(modal);

    var bg = document.querySelector(".app") || document.querySelector("main");
    if (bg && !document.querySelector(".modal-backdrop")) { bg.setAttribute("inert", ""); bg.setAttribute("aria-hidden", "true"); }

    var lastFocus = document.activeElement;
    function close() {
      document.removeEventListener("keydown", onKey, true);
      backdrop.remove();
      if (bg && !document.querySelector(".modal-backdrop")) { bg.removeAttribute("inert"); bg.removeAttribute("aria-hidden"); }
      if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus();
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) {
      // noClose => diálogo persistente: sem Esc (e sem X, sem backdrop). Só Tab faz trap.
      if (e.key === "Escape" && opts.noClose !== true) { e.preventDefault(); close(); }
      if (e.key === "Tab") trapFocus(e, modal);
    }
    // Botão de fechar (X) — padrão em todos os diálogos. NÃO fechamos por toque fora
    // (num POS, um toque acidental não pode perder o que se está a fazer).
    if (opts.noClose !== true) {
      var xb = document.createElement("button");
      xb.className = "modal__close"; xb.type = "button";
      xb.setAttribute("aria-label", POS.s("act.close"));
      xb.innerHTML = POS.icon("x", { size: 20 });
      xb.addEventListener("click", close);
      modal.appendChild(xb);
    }
    // backdrop só fecha se explicitamente permitido (opts.dismissable === true)
    backdrop.addEventListener("mousedown", function (e) {
      if (e.target === backdrop && opts.dismissable === true) close();
    });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(backdrop);

    var focusable = modal.querySelector("[autofocus],input,select,textarea,button");
    if (focusable) focusable.focus();
    return close;
  };

  /* ---------- Drawer lateral (painéis: definições, listagens) ---------- */
  POS.openDrawer = function (contentNode, opts) {
    opts = opts || {};
    var backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop" + (opts.dimmed === false ? " is-clear" : "");
    var drawer = document.createElement("div");
    drawer.className = "drawer" + (opts.side === "left" ? " drawer--left" : "") + (opts.className ? " " + opts.className : "");
    drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-modal", "true");
    if (opts.label) drawer.setAttribute("aria-label", opts.label);
    drawer.appendChild(contentNode);
    backdrop.appendChild(drawer);

    var bg = document.querySelector(".app") || document.querySelector("main");
    if (bg && !document.querySelector(".drawer-backdrop,.modal-backdrop")) { bg.setAttribute("inert", ""); bg.setAttribute("aria-hidden", "true"); }
    var lastFocus = document.activeElement;
    function close() {
      document.removeEventListener("keydown", onKey, true);
      drawer.classList.add("is-leaving");
      drawer.addEventListener("animationend", function () {
        backdrop.remove();
        if (bg && !document.querySelector(".drawer-backdrop,.modal-backdrop")) { bg.removeAttribute("inert"); bg.removeAttribute("aria-hidden"); }
        if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus();
        if (opts.onClose) opts.onClose();
      }, { once: true });
    }
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); close(); } if (e.key === "Tab") trapFocus(e, drawer); }
    if (opts.noClose !== true) {
      var xb = document.createElement("button");
      xb.className = "modal__close"; xb.type = "button"; xb.setAttribute("aria-label", POS.s("act.close"));
      xb.innerHTML = POS.icon("x", { size: 20 }); xb.addEventListener("click", close); drawer.appendChild(xb);
    }
    backdrop.addEventListener("mousedown", function (e) { if (e.target === backdrop && opts.dismissable === true) close(); });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(backdrop);
    var f = drawer.querySelector("[autofocus],input,select,textarea,button"); if (f) f.focus();
    return close;
  };

  /* ---------- Keypad numérico reutilizável ---------- */
  POS.keypad = function (o) {
    o = o || {};
    var maxInt = o.maxInt || 6, maxDec = o.maxDec || 2;
    var buf = (o.initial != null && o.initial !== 0) ? String(o.initial) : "";
    var wrap = document.createElement("div"); wrap.className = "sheet";
    wrap.innerHTML =
      "<h3>" + (o.title || "") + "</h3>" + (o.sub ? "<div class='sheet__sub'>" + o.sub + "</div>" : "") +
      '<div class="kp-display"><span class="sheet__display" id="kpDisp"></span>' +
        '<button class="kp-clear" type="button" data-k="clear">' + POS.s("kp.clear") + "</button></div>" +
      '<div class="keypad" id="kpPad"></div>' +
      '<div class="sheet__foot"><button class="btn" data-k="cancel">' + POS.s("act.cancel") + "</button>" +
      '<button class="btn btn--primary" data-k="ok">' + (o.confirmLabel || POS.s("act.confirm")) + "</button></div>";
    var disp = wrap.querySelector("#kpDisp"), pad = wrap.querySelector("#kpPad");
    var dec = POS.lang === "pt" ? "," : ".";
    function draw() { disp.textContent = (buf === "" ? "0" : buf).replace(".", dec) + (o.suffix ? " " + o.suffix : ""); }
    function canAdd(next) {
      var parts = next.split("."); if (parts[0].replace("-", "").length > maxInt) return false;
      if (parts[1] != null && parts[1].length > maxDec) return false;
      return true;
    }
    ["1","2","3","4","5","6","7","8","9", o.decimal ? "dot" : "00", "0", "back"].forEach(function (k) {
      var b = document.createElement("button"); b.type = "button";
      if (k === "back") { b.className = "key-back"; b.setAttribute("aria-label", POS.s("kp.back")); b.innerHTML = POS.icon("backspace", { size: 24 }); }
      else if (k === "dot") b.textContent = dec;
      else b.textContent = k;
      b.addEventListener("click", function () {
        if (k === "back") buf = buf.slice(0, -1);
        else if (k === "dot") { if (buf.indexOf(".") < 0) buf = (buf || "0") + "."; }
        else { var next = buf + k; if (next === "00") return; if (canAdd(next)) buf = next; }
        draw();
      });
      pad.appendChild(b);
    });
    draw();
    var close = POS.openModal(wrap, { label: o.title });
    wrap.querySelector('[data-k="clear"]').addEventListener("click", function () { buf = ""; draw(); });
    wrap.querySelector('[data-k="cancel"]').addEventListener("click", close);
    wrap.querySelector('[data-k="ok"]').addEventListener("click", function () {
      var v = parseFloat(buf || "0"); close(); o.onConfirm(o.decimal ? v : Math.round(v));
    });
    return close;
  };

  /* ---------- Teclado QWERTY on-screen (touch) ---------- */
  POS.osk = (function () {
    var host = null, target = null, shift = false, floating = false;
    try { floating = sessionStorage.getItem("pos_osk_float") === "1"; } catch (e) {}
    var ROWS = [
      { keys: "1 2 3 4 5 6 7 8 9 0".split(" "), back: true },
      { keys: "q w e r t y u i o p".split(" ") },
      { keys: "a s d f g h j k l ç".split(" ") },
      { keys: "z x c v b n m , . -".split(" "), shift: true },
    ];
    function isText(el) { return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.type !== "checkbox" && el.type !== "radio"; }
    document.addEventListener("focusin", function (e) { if (isText(e.target)) { target = e.target; if (host) refreshCaps(); } });

    function build() {
      host = document.createElement("div");
      host.className = "osk" + (floating ? " osk--float" : "");
      host.setAttribute("role", "group");
      host.setAttribute("aria-label", POS.s("osk.title"));
      var bar = '<div class="osk__bar" id="oskBar">' +
        '<span class="osk__grip" aria-hidden="true">' + POS.icon("grip", { size: 18 }) + "</span>" +
        '<span class="osk__title"></span>' +
        '<button class="osk__tool" type="button" data-act="mode" aria-label="' + POS.s("osk.float") + '"></button>' +
        '<button class="osk__tool" type="button" data-act="close" aria-label="' + POS.s("osk.done") + '">' + POS.icon("x", { size: 18 }) + "</button>" +
      "</div>";
      var rowsHtml = ROWS.map(function (row) {
        var keys = row.keys.map(function (k) { return '<button class="osk__key" type="button" data-k="' + k + '">' + k + "</button>"; }).join("");
        if (row.back) keys += '<button class="osk__key osk__bksp" type="button" data-act="back" aria-label="' + POS.s("kp.back") + '"></button>';
        if (row.shift) keys = '<button class="osk__key osk__shift" type="button" data-act="shift" aria-pressed="false"></button>' + keys + '<button class="osk__key osk__shift" type="button" data-act="shift2" aria-label="Shift"></button>';
        return '<div class="osk__row">' + keys + "</div>";
      }).join("");
      host.innerHTML = bar + rowsHtml +
        '<div class="osk__row osk__row--space">' +
          '<button class="osk__key osk__wide" type="button" data-k="@">@</button>' +
          '<button class="osk__key osk__space" type="button" data-k=" ">' + POS.s("osk.space") + "</button>" +
          '<button class="osk__key osk__wide" type="button" data-k=".">.</button>' +
          '<button class="osk__key osk__done" type="button" data-act="close">' + POS.s("osk.done") + "</button>" +
        "</div>";
      host.addEventListener("mousedown", function (e) {
        var b = e.target.closest("button"); if (!b) return; e.preventDefault();
        var act = b.dataset.act;
        if (act === "back") return backspace();
        if (act === "close") return POS.osk.close();
        if (act === "mode") return setFloating(!floating);
        if (act === "shift" || act === "shift2") { shift = !shift; refreshCaps(); return; }
        if (b.dataset.k != null) { insert(shift ? b.dataset.k.toUpperCase() : b.dataset.k); if (shift) { shift = false; refreshCaps(); } }
      });
      host.querySelector(".osk__bksp").innerHTML = POS.icon("backspace", { size: 24 });
      host.querySelectorAll(".osk__shift").forEach(function (s) { s.innerHTML = POS.icon("shift", { size: 22, fill: true, stroke: 0 }); });
      document.body.appendChild(host);
      setupDrag();
      refreshMode();
    }
    function refreshMode() {
      host.classList.toggle("osk--float", floating);
      var tool = host.querySelector('[data-act="mode"]');
      tool.innerHTML = POS.icon(floating ? "dock" : "float", { size: 18 });
      tool.setAttribute("aria-label", POS.s(floating ? "osk.dock" : "osk.float"));
      if (floating) { // posição inicial centrada em baixo
        if (!host.style.left) { host.style.left = Math.max(8, (window.innerWidth - host.offsetWidth) / 2) + "px"; host.style.top = (window.innerHeight - host.offsetHeight - 24) + "px"; }
      } else { host.style.left = ""; host.style.top = ""; }
    }
    function setFloating(v) { floating = v; try { sessionStorage.setItem("pos_osk_float", v ? "1" : "0"); } catch (e) {} refreshMode(); }
    function setupDrag() {
      var bar = host.querySelector("#oskBar"), dragging = false, ox = 0, oy = 0;
      bar.addEventListener("pointerdown", function (e) {
        if (!floating || e.target.closest(".osk__tool")) return;
        dragging = true; ox = e.clientX - host.offsetLeft; oy = e.clientY - host.offsetTop;
        bar.setPointerCapture(e.pointerId); e.preventDefault();
      });
      bar.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var x = Math.min(Math.max(0, e.clientX - ox), window.innerWidth - host.offsetWidth);
        var y = Math.min(Math.max(0, e.clientY - oy), window.innerHeight - host.offsetHeight);
        host.style.left = x + "px"; host.style.top = y + "px";
      });
      bar.addEventListener("pointerup", function () { dragging = false; });
    }
    function refreshCaps() {
      if (!host) return;
      host.querySelectorAll(".osk__key[data-k]").forEach(function (b) {
        var k = b.dataset.k; if (k.length === 1 && k >= "a" && k <= "z" || k === "ç") b.textContent = shift ? k.toUpperCase() : k;
      });
      host.querySelectorAll('[data-act="shift"]').forEach(function (b) { b.setAttribute("aria-pressed", String(shift)); });
      host.classList.toggle("is-shift", shift);
    }
    function insert(ch) {
      var el = target; if (!el) return;
      var s = el.selectionStart, e = el.selectionEnd;
      if (s == null) { el.value += ch; }
      else { el.value = el.value.slice(0, s) + ch + el.value.slice(e); var p = s + ch.length; try { el.setSelectionRange(p, p); } catch (x) {} }
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function backspace() {
      var el = target; if (!el) return;
      var s = el.selectionStart, e = el.selectionEnd;
      if (s == null) { el.value = el.value.slice(0, -1); }
      else if (s !== e) { el.value = el.value.slice(0, s) + el.value.slice(e); try { el.setSelectionRange(s, s); } catch (x) {} }
      else if (s > 0) { el.value = el.value.slice(0, s - 1) + el.value.slice(s); try { el.setSelectionRange(s - 1, s - 1); } catch (x) {} }
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return {
      open: function () { if (!host) build(); host.classList.add("is-open"); document.body.classList.add("osk-open"); },
      close: function () { if (host) host.classList.remove("is-open"); document.body.classList.remove("osk-open"); },
      toggle: function () { if (host && host.classList.contains("is-open")) this.close(); else this.open(); },
      isOpen: function () { return !!host && host.classList.contains("is-open"); },
    };
  })();

  function trapFocus(e, container) {
    var nodes = container.querySelectorAll(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    if (!nodes.length) return;
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

})(window.POS);

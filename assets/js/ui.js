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

  /* ---------- dev-nav (andaime de protótipo) ---------- */
  var NAV = [
    { key: "sale",     href: "sale.html",            label: "nav.sale" },
    { key: "register", href: "register-close.html",  label: "nav.register" },
    { key: "docs",     href: "docs.html",            label: "nav.docs" },
    { key: "tables",   href: "tables.html",          label: "nav.tables" },
  ];

  POS.mountDevNav = function (activeKey) {
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
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab") trapFocus(e, modal);
    }
    backdrop.addEventListener("mousedown", function (e) {
      if (e.target === backdrop && opts.dismissable !== false) close();
    });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(backdrop);

    var focusable = modal.querySelector("[autofocus],button,input,select,textarea,[tabindex]");
    if (focusable) focusable.focus();
    return close;
  };

  /* ---------- Keypad numérico reutilizável ---------- */
  POS.keypad = function (o) {
    o = o || {};
    var maxInt = o.maxInt || 4, maxDec = o.maxDec || 3;
    var buf = (o.initial != null && o.initial !== 0) ? String(o.initial) : "";
    var wrap = document.createElement("div"); wrap.className = "sheet";
    wrap.innerHTML =
      "<h3>" + (o.title || "") + "</h3>" + (o.sub ? "<div class='sheet__sub'>" + o.sub + "</div>" : "") +
      '<div class="sheet__display" id="kpDisp"></div><div class="keypad" id="kpPad"></div>' +
      '<div class="sheet__foot"><button class="btn" data-k="cancel">' + POS.s("act.cancel") + "</button>" +
      '<button class="btn btn--primary" data-k="ok">' + (o.confirmLabel || POS.s("act.confirm")) + "</button></div>";
    var disp = wrap.querySelector("#kpDisp"), pad = wrap.querySelector("#kpPad");
    function draw() { disp.textContent = (buf === "" ? "0" : buf) + (o.suffix ? " " + o.suffix : ""); }
    function canAdd(next) {
      var parts = next.split("."); if (parts[0].replace("-", "").length > maxInt) return false;
      if (parts[1] != null && parts[1].length > maxDec) return false;
      return true;
    }
    ["1","2","3","4","5","6","7","8","9", o.decimal ? "." : "00", "0", "del"].forEach(function (k) {
      var b = document.createElement("button"); b.type = "button";
      if (k === "del") { b.className = "key-del"; b.setAttribute("aria-label", "Apagar"); b.innerHTML = POS.icon("x", { size: 22 }); }
      else b.textContent = k;
      b.addEventListener("click", function () {
        if (k === "del") buf = buf.slice(0, -1);
        else if (k === ".") { if (buf.indexOf(".") < 0) buf = (buf || "0") + "."; }
        else { var next = buf + k; if (next === "00") return; if (canAdd(next)) buf = next; }
        draw();
      });
      pad.appendChild(b);
    });
    draw();
    var close = POS.openModal(wrap, { label: o.title });
    wrap.querySelector('[data-k="cancel"]').addEventListener("click", close);
    wrap.querySelector('[data-k="ok"]').addEventListener("click", function () {
      var v = parseFloat(buf || "0"); close(); o.onConfirm(o.decimal ? v : Math.round(v));
    });
    return close;
  };

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

/* =========================================================================
   Moloni POS — cart.js
   Estado da VENDA ATUAL. Preços tax-inclusive (PVP, à portuguesa):
   o preço do produto já inclui IVA; o talão decompõe base + IVA por taxa.
   Tudo em cêntimos inteiros. Totais DERIVADOS das linhas (nunca duplicados).
   API: POS.cart.*  +  POS.onCartChange(fn)
   ========================================================================= */
window.POS = window.POS || {};

(function (POS) {
  "use strict";

  var subs = [];
  var seq = 1;

  var state = {
    lines: [],          // { key, productId, qty, unitPriceCents, weighable, discount:{type,value}|null }
    customerId: "final",
    docType: "receipt", // receipt | invoice
    discount: null,     // desconto GLOBAL do documento: {type:'pct'|'abs', value} (abs em cêntimos)
    saleNo: 1,
    payments: [],       // { method:'cash'|'card'|'mbway', amountCents, ts }
    attempts: [],       // tentativas de cartão recusadas/canceladas (preparado): { method, amountCents, result, ts }
  };

  /* ---- persistência ---- */
  function persist() {
    try { sessionStorage.setItem("pos_cart", JSON.stringify(state)); } catch (e) {}
  }
  (function restore() {
    try {
      var raw = sessionStorage.getItem("pos_cart");
      if (raw) {
        state = JSON.parse(raw);
        if (!Array.isArray(state.payments)) state.payments = [];
        if (!Array.isArray(state.attempts)) state.attempts = [];
        state.lines.forEach(function (l) { if (l.key >= seq) seq = l.key + 1; });
      }
    } catch (e) {}
  })();

  function emit() { persist(); subs.forEach(function (fn) { try { fn(state); } catch (e) {} }); }

  /* ---- cálculo de uma linha (valores tax-inclusive) ---- */
  function lineGross(line) {
    // qty pode ser unidades (int) ou kg (decimal) p/ pesáveis
    var raw = Math.round(line.unitPriceCents * line.qty);
    return raw;
  }
  function lineDiscountCents(line) {
    if (!line.discount) return 0;
    var gross = lineGross(line);
    if (line.discount.type === "pct") return Math.round(gross * line.discount.value / 100);
    return Math.min(gross, Math.round(line.discount.value)); // abs em cêntimos
  }
  function lineTotal(line) { return lineGross(line) - lineDiscountCents(line); }

  /* ---- API pública ---- */
  POS.cart = {
    get state() { return state; },
    get lines() { return state.lines; },
    get count() { return state.lines.length; },

    // nº de artigos (soma de quantidades; pesáveis contam como 1 linha)
    itemCount: function () {
      return state.lines.reduce(function (n, l) {
        return n + (l.weighable ? 1 : l.qty);
      }, 0);
    },

    lineGross: lineGross,
    lineDiscount: lineDiscountCents,
    lineTotal: lineTotal,

    add: function (productId, opts) {
      opts = opts || {};
      var p = POS.getProduct(productId);
      if (!p) return;
      // produtos normais agrupam na mesma linha; pesáveis/preço-aberto criam nova linha
      if (!p.weighable && !opts.forceNew) {
        var existing = state.lines.find(function (l) {
          return l.productId === productId && !l.discount && l.unitPriceCents === p.priceCents;
        });
        if (existing) { existing.qty += (opts.qty || 1); emit(); return existing.key; }
      }
      var line = {
        key: seq++,
        productId: productId,
        qty: opts.qty != null ? opts.qty : (p.weighable ? 1 : 1),
        unitPriceCents: opts.unitPriceCents != null ? opts.unitPriceCents : p.priceCents,
        weighable: !!p.weighable,
        discount: null,
      };
      state.lines.push(line);
      emit();
      return line.key;
    },

    setQty: function (key, qty) {
      var l = find(key); if (!l) return;
      l.qty = Math.max(l.weighable ? 0.001 : 1, qty);
      emit();
    },
    changeQty: function (key, delta) {
      var l = find(key); if (!l) return;
      var step = l.weighable ? 0.1 : 1;
      var next = l.qty + delta * step;
      if (next <= 0) { POS.cart.remove(key); return; }
      l.qty = l.weighable ? Math.round(next * 1000) / 1000 : next;
      emit();
    },

    setLineDiscount: function (key, discount) { // {type:'pct'|'abs', value} | null
      var l = find(key); if (!l) return;
      l.discount = discount;
      emit();
    },
    setLineUnitPrice: function (key, cents) { var l = find(key); if (!l) return; l.unitPriceCents = Math.max(0, Math.round(cents)); emit(); },
    editLine: function (key, d) { var l = find(key); if (!l) return; if (d.name != null) l.nameOverride = d.name || null; if (d.note != null) l.note = d.note || null; if (d.warehouse != null) l.warehouse = d.warehouse; emit(); },

    remove: function (key) {
      var i = state.lines.findIndex(function (l) { return l.key === key; });
      if (i < 0) return null;
      var removed = state.lines.splice(i, 1)[0];
      emit();
      return { line: removed, index: i };
    },
    restore: function (snapshot) {
      if (!snapshot || !snapshot.line) return;
      var i = Math.min(snapshot.index, state.lines.length);
      state.lines.splice(i, 0, snapshot.line);
      emit();
    },

    clear: function () { state.lines = []; state.discount = null; state.payments = []; state.attempts = []; emit(); },

    setCustomer: function (id) { state.customerId = id; emit(); },
    setDocType: function (t) { state.docType = t; emit(); },
    setDiscount: function (d) { state.discount = d; emit(); },         // desconto global do documento
    applyDiscountToAllLines: function (d) { state.lines.forEach(function (l) { l.discount = d ? { type: d.type, value: d.value } : null; }); emit(); },

    /* ---- pagamentos da venda atual (módulo puro, React-friendly) ----
       payments[] = lista de pagamentos CONFIRMADOS (split). Derivamos pago/falta/troco
       sempre do total atual (cart.totals().totalCents) — nunca duplicamos. */
    payments: function () { return state.payments.slice(); },
    addPayment: function (p) {
      if (!p || !p.method) return;
      var amt = Math.max(0, Math.round(p.amountCents || 0));
      state.payments.push({ method: p.method, amountCents: amt, ts: Date.now() });
      emit();
      return state.payments.length - 1;
    },
    removePayment: function (i) {
      if (i < 0 || i >= state.payments.length) return null;
      var removed = state.payments.splice(i, 1)[0];
      emit();
      return { payment: removed, index: i };
    },
    clearPayments: function () { state.payments = []; emit(); },
    paidCents: function () {
      return state.payments.reduce(function (s, p) { return s + p.amountCents; }, 0);
    },
    dueCents: function () {
      return Math.max(0, POS.cart.totals().totalCents - POS.cart.paidCents());
    },
    changeCents: function () {
      return Math.max(0, POS.cart.paidCents() - POS.cart.totals().totalCents);
    },
    // tentativas recusadas/canceladas de terminal (preparado para auditoria)
    recordAttempt: function (a) {
      if (!a || !a.method) return;
      state.attempts.push({ method: a.method, amountCents: Math.round(a.amountCents || 0), result: a.result || "declined", ts: Date.now() });
      emit();
    },
    attempts: function () { return state.attempts.slice(); },

    /* ---- emissão: regista venda imutável em pos_sales e limpa o estado ---- */
    commitSale: function (opts) {
      opts = opts || {};
      var t = POS.cart.totals();
      var term = POS.terminal();
      var cust = POS.cart.customer();
      var saleNo = nextSaleNo();
      var sale = {
        id: "S" + Date.now(),
        saleNo: saleNo,
        ts: Date.now(),
        operatorId: term.operatorId,
        operatorName: term.operatorName,
        terminalId: term.terminalId,
        seriesId: term.seriesId,
        syncState: "local",
        docType: state.docType,
        customerId: state.customerId,
        nif: cust && cust.nif ? cust.nif : null,
        lines: JSON.parse(JSON.stringify(state.lines)),
        totals: {
          totalCents: t.totalCents,
          taxCents: t.taxCents,
          subtotalCents: t.subtotalCents,
          discountCents: t.discountCents,
          taxBreakdown: JSON.parse(JSON.stringify(t.taxBreakdown)),
        },
        payments: JSON.parse(JSON.stringify(state.payments)),
        attempts: JSON.parse(JSON.stringify(state.attempts)),
        changeCents: POS.cart.changeCents(),
        receiptDest: opts.receiptDest || "none",
      };
      var list = readSales(); list.push(sale); writeSales(list);
      POS.cart.clear();
      return sale;
    },

    /* ---- snapshot / load ---- */
    snapshot: function () {
      return {
        lines: JSON.parse(JSON.stringify(state.lines)),
        customerId: state.customerId, docType: state.docType,
        discount: state.discount ? { type: state.discount.type, value: state.discount.value } : null,
        payments: JSON.parse(JSON.stringify(state.payments)),
        saleNo: state.saleNo, ts: Date.now(),
      };
    },
    load: function (snap) {
      if (!snap) return;
      state.lines = JSON.parse(JSON.stringify(snap.lines || []));
      state.customerId = snap.customerId || "final";
      state.docType = snap.docType || "receipt";
      state.discount = snap.discount || null;
      state.payments = Array.isArray(snap.payments) ? JSON.parse(JSON.stringify(snap.payments)) : [];
      state.attempts = [];
      state.lines.forEach(function (l) { if (l.key >= seq) seq = l.key + 1; });
      emit();
    },

    /* ---- suspender / recuperar (parked sales) ---- */
    park: function () {
      if (!state.lines.length) return null;
      var snap = POS.cart.snapshot(); snap.id = "pk" + snap.ts;
      var list = readParked(); list.push(snap); writeParked(list);
      state.lines = []; emit();
      return snap;
    },
    parkedList: function () { return readParked(); },
    recover: function (id) {
      var list = readParked();
      var i = list.findIndex(function (s) { return s.id === id; });
      if (i < 0) return;
      var snap = list[i];
      if (state.lines.length) { // não perder a venda atual
        var cur = POS.cart.snapshot(); cur.id = "pk" + Date.now(); list.push(cur);
      }
      list.splice(i, 1); writeParked(list);
      POS.cart.load(snap);
    },
    customer: function () { return POS.customers.find(function (c) { return c.id === state.customerId; }) || POS.customers[0]; },

    /* ---- totais derivados (tax-inclusive) ---- */
    totals: function () {
      var groups = {}; // rateKey -> { rate, gross }
      var totalGross = 0, totalDiscount = 0;
      state.lines.forEach(function (l) {
        var p = POS.getProduct(l.productId);
        var tax = POS.getTax(p.tax);
        var lt = lineTotal(l);
        totalGross += lt;
        totalDiscount += lineDiscountCents(l);
        var k = String(tax.rate);
        if (!groups[k]) groups[k] = { rate: tax.rate, gross: 0 };
        groups[k].gross += lt;
      });
      // desconto GLOBAL do documento (sobre o total já com descontos de linha)
      var globalDisc = 0;
      if (state.discount && totalGross > 0) {
        if (state.discount.type === "pct") globalDisc = Math.round(totalGross * Math.min(100, state.discount.value) / 100);
        else globalDisc = Math.min(totalGross, Math.round(state.discount.value)); // value em cêntimos
      }
      // distribui o desconto global proporcionalmente por cada escalão de IVA (resto na última)
      var keys = Object.keys(groups).sort(function (a, b) { return groups[b].rate - groups[a].rate; });
      var distributed = 0;
      var taxBreakdown = keys.map(function (k, i) {
        var g = groups[k];
        var gd = (i === keys.length - 1) ? (globalDisc - distributed) : Math.round(globalDisc * g.gross / totalGross);
        distributed += gd;
        var net = g.gross - gd;
        var base = Math.round(net / (1 + g.rate / 100));
        return { rate: g.rate, base: base, tax: net - base, gross: net };
      });

      var taxTotal = taxBreakdown.reduce(function (s, g) { return s + g.tax; }, 0);
      var total = totalGross - globalDisc;
      return {
        itemCount: POS.cart.itemCount(),
        discountCents: totalDiscount + globalDisc,
        globalDiscountCents: globalDisc,
        subtotalCents: total - taxTotal, // base tributável
        taxCents: taxTotal,
        totalCents: total,
        taxBreakdown: taxBreakdown,
      };
    },
  };

  function find(key) { return state.lines.find(function (l) { return l.key === key; }); }
  function readParked() { try { return JSON.parse(sessionStorage.getItem("pos_parked") || "[]"); } catch (e) { return []; } }
  function writeParked(list) { try { sessionStorage.setItem("pos_parked", JSON.stringify(list)); } catch (e) {} }

  /* ---- vendas emitidas (imutáveis) ---- */
  function readSales() { try { return JSON.parse(sessionStorage.getItem("pos_sales") || "[]"); } catch (e) { return []; } }
  function writeSales(list) { try { sessionStorage.setItem("pos_sales", JSON.stringify(list)); } catch (e) {} }
  function nextSaleNo() {
    var n = 1; try { n = parseInt(sessionStorage.getItem("pos_sale_seq") || "0", 10) + 1; } catch (e) {}
    try { sessionStorage.setItem("pos_sale_seq", String(n)); } catch (e) {}
    return n;
  }
  POS.sales = function () { return readSales(); };

  /* ---- Terminal / operador (default criado à 1ª leitura) ---- */
  var DEFAULT_TERMINAL = { terminalId: "T1", operatorId: "op1", operatorName: "Ana Sousa", seriesId: "FS 2026" };
  POS.terminal = function () {
    try {
      var raw = sessionStorage.getItem("pos_terminal");
      if (raw) { var t = JSON.parse(raw); return Object.assign({}, DEFAULT_TERMINAL, t); }
    } catch (e) {}
    try { sessionStorage.setItem("pos_terminal", JSON.stringify(DEFAULT_TERMINAL)); } catch (e) {}
    return Object.assign({}, DEFAULT_TERMINAL);
  };
  POS.setTerminal = function (patch) {
    var t = Object.assign(POS.terminal(), patch || {});
    try { sessionStorage.setItem("pos_terminal", JSON.stringify(t)); } catch (e) {}
    return t;
  };

  /* ---- Definição: mostrar resumo no fim da venda (toggle de terminal) ---- */
  POS.showSummary = function () { try { return sessionStorage.getItem("pos_show_summary") === "1"; } catch (e) { return false; } };
  POS.setShowSummary = function (v) { try { sessionStorage.setItem("pos_show_summary", v ? "1" : "0"); } catch (e) {} };

  /* ---- Último método de pagamento usado neste terminal ---- */
  POS.lastMethod = function () { try { return sessionStorage.getItem("pos_last_method") || "cash"; } catch (e) { return "cash"; } };
  POS.setLastMethod = function (m) { try { sessionStorage.setItem("pos_last_method", m); } catch (e) {} };

  POS.onCartChange = function (fn) { if (typeof fn === "function") subs.push(fn); };

})(window.POS);

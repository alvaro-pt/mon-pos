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
    saleNo: 1,
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

    clear: function () { state.lines = []; emit(); },

    setCustomer: function (id) { state.customerId = id; emit(); },
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
      var taxBreakdown = Object.keys(groups).map(function (k) {
        var g = groups[k];
        var base = Math.round(g.gross / (1 + g.rate / 100));
        return { rate: g.rate, base: base, tax: g.gross - base, gross: g.gross };
      }).sort(function (a, b) { return b.rate - a.rate; });

      var taxTotal = taxBreakdown.reduce(function (s, g) { return s + g.tax; }, 0);
      return {
        itemCount: POS.cart.itemCount(),
        discountCents: totalDiscount,
        subtotalCents: totalGross - taxTotal, // base tributável
        taxCents: taxTotal,
        totalCents: totalGross,
        taxBreakdown: taxBreakdown,
      };
    },
  };

  function find(key) { return state.lines.find(function (l) { return l.key === key; }); }

  POS.onCartChange = function (fn) { if (typeof fn === "function") subs.push(fn); };

})(window.POS);

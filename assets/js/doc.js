/* =========================================================================
   Moloni POS — doc.js
   Render do DOCUMENTO DE VENDA (talão 80mm / A4 / talão de oferta) + impressão.
   Reutilizado pela lista de Documentos e pelo fim da venda. Vanilla, sem deps.
   Lógica pura (string a partir do `sale`) — migra ~1:1 para React.
   ========================================================================= */
window.POS = window.POS || {};

(function (POS) {
  "use strict";

  var VAT_LETTER = { 23: "A", 13: "B", 6: "C", 0: "D" };

  function money(c) { return POS.money(c); }
  function s(k) { return POS.s(k); }
  function lineQty(l) { return l.weighable ? l.weight : l.qty; }
  function lineGross(l) {
    var g = Math.round(lineQty(l) * l.unitPriceCents);
    if (l.discount) {
      if (l.discount.type === "pct") g -= Math.round(g * Math.min(100, l.discount.value) / 100);
      else g -= Math.min(g, Math.round(l.discount.value));
    }
    return g;
  }
  function prodName(l) {
    var p = POS.getProduct ? POS.getProduct(l.productId) : null;
    return p ? POS.t(p.name) : (l.name ? POS.t(l.name) : "—");
  }
  function lineRate(l) {
    var p = POS.getProduct ? POS.getProduct(l.productId) : null;
    if (!p) return 0;
    var t = POS.getTax(p.tax); return t ? t.rate : 0;
  }
  function methodLabel(m) { var k = "pay.method." + m; var v = s(k); return v === k ? m : v; }
  // identificação universal: TIPO + espaço + SÉRIE/NÚMERO (série 2026 no protótipo)
  function docNo(sale) {
    var series = sale.seriesId || (POS.terminal ? POS.terminal().seriesId : "2026") || "2026";
    var num = sale.number != null ? sale.number : (sale.saleNo != null ? sale.saleNo : "—");
    return POS.docCode(sale.docType || sale.type) + " " + series + "/" + num;
  }
  // deriva totais/IVA a partir das linhas (para documentos sem `totals` pré-calculados)
  function computeTotals(lines) {
    var groups = {}, total = 0;
    lines.forEach(function (l) {
      var gross = lineGross(l); total += gross;
      var rate = lineRate(l); groups[rate] = groups[rate] || { rate: rate, gross: 0 };
      groups[rate].gross += gross;
    });
    var tb = Object.keys(groups).map(function (k) {
      var g = groups[k], base = Math.round(g.gross / (1 + g.rate / 100));
      return { rate: g.rate, base: base, tax: g.gross - base, gross: g.gross };
    }).sort(function (a, b) { return b.rate - a.rate; });
    return { totalCents: total, taxBreakdown: tb };
  }
  function atcud(sale) {   // código de validação simulado, determinístico a partir da série
    var str = (sale.seriesId || "FS") + "", h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    var code = (h.toString(36).toUpperCase() + "JFHA").slice(0, 4);
    return code + "-" + (sale.saleNo != null ? sale.saleNo : 0);
  }
  function custOf(sale) { return (POS.customers || []).find(function (c) { return c.id === sale.customerId; }) || (POS.customers || [])[0]; }

  // pseudo-QR determinístico (decorativo, "simulado") — 21×21 com finder patterns
  function qrSvg(seed, px) {
    px = px || 104; var N = 21, mod = px / N;
    var st = 0; for (var i = 0; i < seed.length; i++) st = (st * 131 + seed.charCodeAt(i)) >>> 0;
    function rnd() { st = (st * 1103515245 + 12345) & 0x7fffffff; return (st >> 17) & 1; }
    var g = []; for (var y = 0; y < N; y++) { g[y] = []; for (var x = 0; x < N; x++) g[y][x] = null; }
    function finder(r, c) {
      for (var yy = -1; yy <= 7; yy++) for (var xx = -1; xx <= 7; xx++) {
        var rr = r + yy, cc = c + xx; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        var on = (xx >= 0 && xx <= 6 && (yy === 0 || yy === 6)) || (yy >= 0 && yy <= 6 && (xx === 0 || xx === 6)) || (xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4);
        g[rr][cc] = on ? 1 : 0;
      }
    }
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    var rects = "";
    for (var y2 = 0; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) {
      var v = g[y2][x2]; if (v === null) v = rnd();
      if (v) rects += '<rect x="' + (x2 * mod).toFixed(2) + '" y="' + (y2 * mod).toFixed(2) + '" width="' + mod.toFixed(2) + '" height="' + mod.toFixed(2) + '"/>';
    }
    return '<svg class="doc-qr" width="' + px + '" height="' + px + '" viewBox="0 0 ' + px + ' ' + px + '" role="img" aria-label="QR code ' + s("doc.simulated") + '">' +
      '<rect width="' + px + '" height="' + px + '" fill="#fff"/><g fill="#111">' + rects + "</g></svg>";
  }

  /**
   * Constrói o HTML do documento de venda.
   * @param {object} sale  transação (pos_sales / pos_last_sale)
   * @param {{format?: "talao"|"a4"|"oferta"}} [opts]
   */
  POS.buildSaleDoc = function (sale, opts) {
    opts = opts || {}; var fmt = opts.format || "talao"; var gift = fmt === "oferta";
    var store = POS.store || {};
    var cust = custOf(sale);
    var showClient = !!(sale.nif || (cust && !cust.isDefault));
    var dt = new Date(sale.ts || Date.now()).toLocaleString(POS.lang === "pt" ? "pt-PT" : "en-IE",
      { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    var docType = sale.docType || sale.type || "simplified";
    var operatorName = sale.operatorName || (POS.terminal ? POS.terminal().operatorName : "");
    var terminalId = sale.terminalId || (POS.terminal ? POS.terminal().terminalId : "");
    var typeLabel = gift ? s("doc.giftTitle") : s("doc." + docType);

    var head =
      '<div class="doc-head">' +
        '<div class="doc-store">' + (store.name || "") + "</div>" +
        '<div class="doc-sub">' + s("doc.nif") + " " + (store.nif || "") + "</div>" +
        '<div class="doc-sub">' + (store.address || "") + (store.zip ? " · " + store.zip + " " + (store.city || "") : "") + "</div>" +
      "</div>" +
      '<div class="doc-meta">' +
        '<div class="doc-type">' + typeLabel + "</div>" +
        '<div class="doc-row"><span>' + docNo(sale) + "</span><span>" + dt + "</span></div>" +
        '<div class="doc-row"><span>' + s("set.operator") + ": " + (operatorName || "—") + "</span><span>" + s("z.terminal") + " " + (terminalId || "—") + "</span></div>" +
        (showClient ? '<div class="doc-row"><span>' + s("doc.client") + ": " + POS.t(cust.name) + "</span>" + (sale.nif ? "<span>" + s("doc.nif") + " " + sale.nif + "</span>" : "") + "</div>" : "") +
        (docType === "creditNote" && sale.relatedLabel ? '<div class="doc-row"><span>' + s("nc.origin") + ": " + sale.relatedLabel + "</span></div>" +
          (sale.reason ? '<div class="doc-row"><span>' + s("nc.reason") + ": " + sale.reason + "</span></div>" : "") : "") +
      "</div>";

    var lines = (sale.lines || []).map(function (l) {
      var letter = VAT_LETTER[lineRate(l)] || "";
      return "<tr>" +
        '<td class="doc-q">' + lineQty(l) + "×</td>" +
        '<td class="doc-d">' + prodName(l) + "</td>" +
        (gift ? "" : '<td class="doc-money doc-u">' + money(l.unitPriceCents) + "</td><td class=\"doc-letter\">" + letter + "</td><td class=\"doc-money doc-lt\">" + money(lineGross(l)) + "</td>") +
        "</tr>";
    }).join("");
    var linesTable = '<table class="doc-lines"><tbody>' + lines + "</tbody></table>";

    if (gift) {
      return '<div class="doc doc--oferta">' + head + linesTable +
        '<div class="doc-foot"><div class="doc-note">' + s("doc.giftTitle") + " · " + docNo(sale) + "</div></div></div>";
    }

    var totalsObj = sale.totals && sale.totals.taxBreakdown ? sale.totals : computeTotals(sale.lines || []);
    var tb = totalsObj.taxBreakdown || [];
    var vatRows = tb.map(function (g) {
      return "<tr><td>" + (VAT_LETTER[g.rate] || "") + "</td><td>" + g.rate + "%</td>" +
        '<td class="doc-money">' + money(g.base) + "</td><td class=\"doc-money\">" + money(g.tax) + "</td></tr>";
    }).join("");
    var vat = '<table class="doc-vat"><thead><tr><th>' + s("doc.vatLetter") + "</th><th>" + s("doc.taxRate") +
      "</th><th>" + s("doc.taxBase") + "</th><th>" + s("doc.taxAmount") + "</th></tr></thead><tbody>" + vatRows + "</tbody></table>";

    var totals = '<div class="doc-totals">' +
      '<div class="doc-row doc-total"><span>' + s("doc.total") + '</span><span class="doc-money">' + money(totalsObj.totalCents || 0) + "</span></div></div>";

    var payList = sale.payments || [{ method: "cash", amountCents: totalsObj.totalCents || 0 }];
    var pays = payList.map(function (p) {
      return '<div class="doc-row"><span>' + methodLabel(p.method) + '</span><span class="doc-money">' + money(p.amountCents) + "</span></div>";
    }).join("");
    if (sale.changeCents) pays += '<div class="doc-row"><span>' + s("doc.change") + '</span><span class="doc-money">' + money(sale.changeCents) + "</span></div>";

    var foot =
      '<div class="doc-cert">' +
        '<div class="doc-qrwrap">' + qrSvg(sale.id || docNo(sale), 104) + "</div>" +
        '<div class="doc-certtxt"><div>' + s("doc.atcud") + ": " + atcud(sale) + "</div>" +
          "<div>" + s("doc.certified") + " " + (store.certNumber || "") + " " + s("doc.simulated") + "</div></div>" +
      "</div>";

    return '<div class="doc doc--' + (fmt === "a4" ? "a4" : "talao") + '">' +
      head + linesTable + vat + totals +
      '<div class="doc-pays">' + pays + "</div>" + foot + "</div>";
  };

  POS.docTotals = function (lines) { return computeTotals(lines || []); };

  // Código AT do tipo de documento + cor do disco na listagem
  var DOC_CODE = {
    invoice: "FT", simplified: "FS", invoiceReceipt: "FR", receipt: "VD", recibo: "RE",
    creditNote: "NC", tableConsult: "CM", shipping: "GR", transport: "GT",
  };
  // cores via tokens semânticos → acompanham a skin (normal/dark/vivo/clean: pastel/vivo)
  var CODE_COLOR = {
    FT: "var(--brand-600)", FS: "var(--info-600)", FR: "var(--brand-400)", VD: "var(--ink-500)",
    RE: "var(--pay-600)", NC: "var(--danger-600)", CM: "var(--warn-600)", GR: "var(--info-600)", GT: "var(--brand-500)",
  };
  POS.docCode = function (type) { return DOC_CODE[type] || "DOC"; };
  POS.docLabel = function (doc) { return docNo(doc); };   // TIPO série/número (ex. FS 2026/1042)
  POS.canCreditNote = function (doc) { var t = doc.docType || doc.type; return t === "simplified" || t === "invoiceReceipt" || t === "invoice" || t === "receipt"; };
  // emite uma Nota de Crédito (documento novo, imutável) que referencia o original
  POS.emitCreditNote = function (doc, opts) {
    opts = opts || {};
    var ncCount = POS.documents.filter(function (d) { return (d.type || d.docType) === "creditNote"; }).length;
    var nc = {
      id: "nc" + Date.now(), type: "creditNote", number: ncCount + 1, seriesId: "2026",
      customerId: doc.customerId, nif: doc.nif,
      operatorName: (POS.terminal ? POS.terminal().operatorName : doc.operatorName),
      terminalId: doc.terminalId || (POS.terminal ? POS.terminal().terminalId : ""),
      certified: true, ts: Date.now(),
      lines: JSON.parse(JSON.stringify(doc.lines || [])),
      payments: doc.payments ? JSON.parse(JSON.stringify(doc.payments)) : null,
      relatedLabel: POS.docLabel(doc), relatedId: doc.id, reason: opts.reason || "",
    };
    POS.documents.unshift(nc);
    return nc;
  };
  POS.docCodeColor = function (type) { return CODE_COLOR[POS.docCode(type)] || "var(--ink-500)"; };

  /** Imprime o documento (isola via .doc-print + @media print). */
  POS.printDoc = function (sale, opts) {
    var host = document.querySelector(".doc-print"); if (host) host.remove();
    host = document.createElement("div"); host.className = "doc-print";
    host.innerHTML = POS.buildSaleDoc(sale, opts);
    document.body.appendChild(host);
    function cleanup() { if (host && host.parentNode) host.remove(); window.removeEventListener("afterprint", cleanup); }
    window.addEventListener("afterprint", cleanup);
    try { window.print(); } catch (e) {}
    setTimeout(cleanup, 1000);
  };

})(window.POS);

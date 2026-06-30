/* =========================================================================
   Moloni POS — data.js
   FONTE DE VERDADE: produtos, categorias, taxas de IVA, clientes.
   Dinheiro SEMPRE em cêntimos (inteiros). Nomes traduzíveis: {pt,en}.
   Namespace global: POS
   ========================================================================= */
window.POS = window.POS || {};

(function (POS) {
  "use strict";

  /* ---- Taxas de IVA (continente PT) ---- */
  POS.TAX = {
    normal:       { id: "normal",  rate: 23, label: { pt: "IVA 23%", en: "VAT 23%" } },
    intermediate: { id: "interm",  rate: 13, label: { pt: "IVA 13%", en: "VAT 13%" } },
    reduced:      { id: "reduced", rate: 6,  label: { pt: "IVA 6%",  en: "VAT 6%" } },
    exempt:       { id: "exempt",  rate: 0,  label: { pt: "Isento",  en: "Exempt" } },
  };

  /* ---- Categorias (famílias). icon = nome no set POS.icon ---- */
  POS.categories = [
    { id: "favorites", name: { pt: "Favoritos",  en: "Favorites" },    icon: "star",      color: "#f5a623", pinned: true },
    { id: "coffee",    name: { pt: "Café & Bar",  en: "Coffee & Bar" }, icon: "coffee",    color: "#a16a3c" },
    { id: "bakery",    name: { pt: "Padaria",     en: "Bakery" },       icon: "cookie",    color: "#d39a2a" },
    { id: "drinks",    name: { pt: "Bebidas",     en: "Drinks" },       icon: "soda",      color: "#2a86d3" },
    { id: "grocery",   name: { pt: "Mercearia",   en: "Grocery" },      icon: "basket",    color: "#6a59c4" },
    { id: "produce",   name: { pt: "Frutas & Leg.", en: "Produce" },    icon: "apple",     color: "#3fae54" },
    { id: "snacks",    name: { pt: "Snacks",      en: "Snacks" },       icon: "chocolate", color: "#c4593f" },
    { id: "home",      name: { pt: "Casa & Limp.", en: "Home" },        icon: "sparkles",  color: "#2aa8a8" },
  ];

  /* ---- Subfamílias (drill-down). Só algumas famílias as têm. ---- */
  POS.subcategories = {
    drinks: [
      { id: "d-soft",  parent: "drinks", name: { pt: "Refrigerantes & Sumos", en: "Soft drinks & Juice" }, icon: "soda", color: "#2a86d3" },
      { id: "d-water", parent: "drinks", name: { pt: "Águas",            en: "Water" },        icon: "soda", color: "#2a86d3" },
      { id: "d-alc",   parent: "drinks", name: { pt: "Vinhos & Cerveja", en: "Wine & Beer" },  icon: "soda", color: "#2a86d3" },
    ],
    grocery: [
      { id: "g-staples", parent: "grocery", name: { pt: "Básicos",  en: "Staples" }, icon: "basket", color: "#6a59c4" },
      { id: "g-fresh",   parent: "grocery", name: { pt: "Frescos",  en: "Fresh" },   icon: "basket", color: "#6a59c4" },
    ],
  };

  /* ---- Produtos (preços em cêntimos) ----
     campos: id, name{pt,en}, priceCents, tax(ref POS.TAX.*), cat, emoji,
             fav (favorito), barcode?, weighable? (preço por kg), open? (preço aberto) */
  POS.products = [
    // Café & Bar
    { id: "p-cafe",     name:{pt:"Café",            en:"Espresso"},        priceCents: 80,  tax:"normal",       cat:"coffee", emoji:"☕", fav:true,  barcode:"560001" },
    { id: "p-galao",    name:{pt:"Galão",           en:"Latte"},           priceCents: 140, tax:"normal",       cat:"coffee", emoji:"🥛", fav:true,  barcode:"560002" },
    { id: "p-cappu",    name:{pt:"Cappuccino",      en:"Cappuccino"},      priceCents: 175, tax:"normal",       cat:"coffee", emoji:"☕",            barcode:"560003" },
    { id: "p-cha",      name:{pt:"Chá",             en:"Tea"},             priceCents: 130, tax:"normal",       cat:"coffee", emoji:"🍵",            barcode:"560004" },
    { id: "p-imperial", name:{pt:"Imperial",        en:"Draft beer"},      priceCents: 150, tax:"normal",       cat:"coffee", emoji:"🍺",            barcode:"560005" },
    { id: "p-agua",     name:{pt:"Água 0,5L",       en:"Water 0.5L"},      priceCents: 90,  tax:"reduced",      cat:"coffee", emoji:"💧", fav:true,  barcode:"560006" },

    // Padaria
    { id: "p-pao",      name:{pt:"Pão (un.)",       en:"Bread roll"},      priceCents: 18,  tax:"reduced",      cat:"bakery", emoji:"🥖", fav:true,  barcode:"570001" },
    { id: "p-croiss",   name:{pt:"Croissant",       en:"Croissant"},       priceCents: 110, tax:"reduced",      cat:"bakery", emoji:"🥐", fav:true,  barcode:"570002" },
    { id: "p-bola",     name:{pt:"Bola de Berlim",  en:"Berlin doughnut"}, priceCents: 130, tax:"reduced",      cat:"bakery", emoji:"🍩",            barcode:"570003" },
    { id: "p-tosta",    name:{pt:"Tosta mista",     en:"Toastie"},         priceCents: 280, tax:"normal",       cat:"bakery", emoji:"🥪",            barcode:"570004" },
    { id: "p-bolo",     name:{pt:"Fatia de bolo",   en:"Cake slice"},      priceCents: 240, tax:"intermediate", cat:"bakery", emoji:"🍰",            barcode:"570005" },

    // Bebidas
    { id: "p-sumo",     name:{pt:"Sumo natural",    en:"Fresh juice"},     priceCents: 320, tax:"reduced",      cat:"drinks", emoji:"🧃",            barcode:"580001" },
    { id: "p-refri",    name:{pt:"Refrigerante",    en:"Soft drink"},      priceCents: 160, tax:"intermediate", cat:"drinks", emoji:"🥤", fav:true,  barcode:"580002" },
    { id: "p-agua15",   name:{pt:"Água 1,5L",       en:"Water 1.5L"},      priceCents: 120, tax:"reduced",      cat:"drinks", emoji:"💧",            barcode:"580003" },
    { id: "p-cerveja",  name:{pt:"Cerveja lata",    en:"Beer can"},        priceCents: 130, tax:"normal",       cat:"drinks", emoji:"🍺",            barcode:"580004" },
    { id: "p-vinho",    name:{pt:"Vinho (garrafa)", en:"Wine bottle"},     priceCents: 690, tax:"normal",       cat:"drinks", emoji:"🍷",            barcode:"580005" },

    // Mercearia
    { id: "p-leite",    name:{pt:"Leite 1L",        en:"Milk 1L"},         priceCents: 95,  tax:"reduced",      cat:"grocery", emoji:"🥛", fav:true, barcode:"590001" },
    { id: "p-ovos",     name:{pt:"Ovos (dúzia)",    en:"Eggs (dozen)"},    priceCents: 245, tax:"reduced",      cat:"grocery", emoji:"🥚",           barcode:"590002" },
    { id: "p-arroz",    name:{pt:"Arroz 1kg",       en:"Rice 1kg"},        priceCents: 130, tax:"reduced",      cat:"grocery", emoji:"🍚",           barcode:"590003" },
    { id: "p-massa",    name:{pt:"Massa 500g",      en:"Pasta 500g"},      priceCents: 99,  tax:"reduced",      cat:"grocery", emoji:"🍝",           barcode:"590004" },
    { id: "p-azeite",   name:{pt:"Azeite 0,75L",    en:"Olive oil 0.75L"}, priceCents: 620, tax:"reduced",      cat:"grocery", emoji:"🫒",           barcode:"590005" },
    { id: "p-acucar",   name:{pt:"Açúcar 1kg",      en:"Sugar 1kg"},       priceCents: 119, tax:"reduced",      cat:"grocery", emoji:"🧂",           barcode:"590006" },

    // Frutas & Legumes (pesáveis — preço por kg)
    { id: "p-banana",   name:{pt:"Banana",          en:"Banana"},          priceCents: 129, tax:"reduced",      cat:"produce", emoji:"🍌", weighable:true, fav:true, barcode:"591001" },
    { id: "p-maca",     name:{pt:"Maçã",            en:"Apple"},           priceCents: 169, tax:"reduced",      cat:"produce", emoji:"🍎", weighable:true, barcode:"591002" },
    { id: "p-tomate",   name:{pt:"Tomate",          en:"Tomato"},          priceCents: 199, tax:"reduced",      cat:"produce", emoji:"🍅", weighable:true, barcode:"591003" },
    { id: "p-batata",   name:{pt:"Batata",          en:"Potato"},          priceCents: 89,  tax:"reduced",      cat:"produce", emoji:"🥔", weighable:true, barcode:"591004" },
    { id: "p-laranja",  name:{pt:"Laranja",         en:"Orange"},          priceCents: 149, tax:"reduced",      cat:"produce", emoji:"🍊", weighable:true, barcode:"591005" },

    // Snacks
    { id: "p-choco",    name:{pt:"Chocolate",       en:"Chocolate bar"},   priceCents: 150, tax:"intermediate", cat:"snacks", emoji:"🍫", fav:true,  barcode:"592001" },
    { id: "p-batatas",  name:{pt:"Batatas fritas",  en:"Crisps"},          priceCents: 199, tax:"intermediate", cat:"snacks", emoji:"🍟",            barcode:"592002" },
    { id: "p-bolachas", name:{pt:"Bolachas",        en:"Biscuits"},        priceCents: 175, tax:"intermediate", cat:"snacks", emoji:"🍪",            barcode:"592003" },
    { id: "p-gelado",   name:{pt:"Gelado",          en:"Ice cream"},       priceCents: 250, tax:"intermediate", cat:"snacks", emoji:"🍦",            barcode:"592004" },

    // Casa & Limpeza
    { id: "p-deterg",   name:{pt:"Detergente",      en:"Detergent"},       priceCents: 399, tax:"normal",       cat:"home", emoji:"🧴",              barcode:"593001" },
    { id: "p-papel",    name:{pt:"Papel higiénico", en:"Toilet paper"},    priceCents: 320, tax:"normal",       cat:"home", emoji:"🧻",              barcode:"593002" },
    { id: "p-sacos",    name:{pt:"Saco (reutil.)",  en:"Reusable bag"},    priceCents: 50,  tax:"normal",       cat:"home", emoji:"🛍️",             barcode:"593003" },
    { id: "p-esponja",  name:{pt:"Esponjas",        en:"Sponges"},         priceCents: 199, tax:"normal",       cat:"home", emoji:"🧽",              barcode:"593004" },
  ];

  /* ---- Clientes ---- */
  POS.customers = [
    { id: "final", name: { pt: "Consumidor Final", en: "Final Consumer" }, nif: null, isDefault: true },
    { id: "c1", name: { pt: "Maria Silva", en: "Maria Silva" }, nif: "218456701" },
    { id: "c2", name: { pt: "João Pereira", en: "João Pereira" }, nif: "245983112" },
    { id: "c3", name: { pt: "Café Central, Lda", en: "Café Central, Lda" }, nif: "509871234" },
  ];

  /* ---- Emitente (loja) — dados para o documento fiscal ---- */
  POS.store = {
    name: "Mercearia Avenida",
    nif: "500 000 000",
    address: "Av. da República, 12",
    zip: "1050-191", city: "Lisboa",
    certNumber: "0000/AT",   // nº de certificação do programa (simulado)
  };

  /* ---- Multi-terminal segmentado por LOJA (consolidação de gestão) ----
     Cada terminal pertence a uma loja. O terminal atual é o T1 (Mercearia Avenida). */
  POS.stores = [
    { id: "s1", name: "Mercearia Avenida", nif: "500 000 000" },
    { id: "s2", name: "Padaria Central",   nif: "501 234 567" },
  ];
  POS.terminals = [
    { id: "T1", storeId: "s1", label: "#1" },
    { id: "T2", storeId: "s1", label: "#2" },
    { id: "T3", storeId: "s2", label: "#1" },
  ];
  POS.storeOfTerminal = function (tid) {
    var t = POS.terminals.find(function (x) { return x.id === tid; });
    return POS.stores.find(function (s) { return s.id === (t && t.storeId); }) || POS.stores[0];
  };
  // Vendas de OUTROS terminais (T2/T3) p/ demonstrar a consolidação — o T1 usa pos_sales real.
  var H = 1000 * 60 * 60;
  POS.demoSales = [
    { id: "d-t2-1", ts: Date.now() - 2 * H, terminalId: "T2", operatorName: "João Pereira",  docType: "simplified", totals: { totalCents: 1840 }, payments: [{ method: "card", amountCents: 1840 }] },
    { id: "d-t2-2", ts: Date.now() - 1 * H, terminalId: "T2", operatorName: "João Pereira",  docType: "simplified", totals: { totalCents: 760 },  payments: [{ method: "cash", amountCents: 760 }] },
    { id: "d-t2-3", ts: Date.now() - 30 * 60000, terminalId: "T2", operatorName: "Rita Marques", docType: "invoiceReceipt", totals: { totalCents: 4250 }, payments: [{ method: "mbway", amountCents: 4250 }] },
    { id: "d-t3-1", ts: Date.now() - 3 * H, terminalId: "T3", operatorName: "Carlos Dias",   docType: "simplified", totals: { totalCents: 990 },  payments: [{ method: "cash", amountCents: 990 }] },
    { id: "d-t3-2", ts: Date.now() - 90 * 60000, terminalId: "T3", operatorName: "Carlos Dias", docType: "simplified", totals: { totalCents: 2330 }, payments: [{ method: "card", amountCents: 2330 }] },
  ];

  /* ---- Operadores do terminal (roster; PIN simulado p/ protótipo) ---- */
  POS.operators = [
    { id: "op1", name: "Ana Sousa",     role: { pt: "Operadora",  en: "Operator" },   pin: "1234", tier: "operator" },
    { id: "op2", name: "João Pereira",  role: { pt: "Operador",   en: "Operator" },   pin: "2345", tier: "operator" },
    { id: "op3", name: "Rita Marques",  role: { pt: "Supervisora", en: "Supervisor" }, pin: "3456", tier: "supervisor" },
    { id: "op4", name: "Carlos Dias",   role: { pt: "Gerente",    en: "Manager" },    pin: "9999", tier: "manager" },
  ];

  /* ---- Mesas (RESERVADO p/ vertente restauração — desativado no retalho) ----
     O POS é retalho-only por agora. O modelo de mesa fica aqui, documentado e
     pronto a reativar quando a restauração entrar (mapa de mesas, dividir conta).
     Para reativar: descomentar e voltar a ligar a nav (rail/dev-nav) + i18n nav.tables.
  POS.tables = [
    { id: "m1", label: "1", zone: { pt: "Salão", en: "Hall" }, state: "free" },
    { id: "m2", label: "2", zone: { pt: "Salão", en: "Hall" }, state: "open" },
    { id: "m3", label: "3", zone: { pt: "Salão", en: "Hall" }, state: "free" },
    { id: "t1", label: "E1", zone: { pt: "Esplanada", en: "Terrace" }, state: "billing" },
    { id: "t2", label: "E2", zone: { pt: "Esplanada", en: "Terrace" }, state: "free" },
  ];
  */

  /* ---- Atribuição de subfamílias ---- */
  var SUB = {
    "p-sumo": "d-soft", "p-refri": "d-soft", "p-agua15": "d-water", "p-cerveja": "d-alc", "p-vinho": "d-alc",
    "p-leite": "g-fresh", "p-ovos": "g-fresh", "p-arroz": "g-staples", "p-massa": "g-staples",
    "p-azeite": "g-staples", "p-acucar": "g-staples",
  };

  /* ---- Descrições + variantes (produtos-chave) ---- */
  var DETAIL = {
    "p-cafe":   { desc: { pt: "Espresso encorpado, torra média.", en: "Full-bodied espresso, medium roast." },
                  variants: [{ name: { pt: "Tipo", en: "Type" }, options: ["Normal", "Descafeinado"] }] },
    "p-galao":  { desc: { pt: "Café com leite vaporizado, servido em copo.", en: "Coffee with steamed milk, in a glass." } },
    "p-croiss": { desc: { pt: "Croissant amanteigado, fresco do dia.", en: "Buttery croissant, fresh daily." },
                  variants: [{ name: { pt: "Recheio", en: "Filling" }, options: ["Simples", "Misto", "Chocolate"] }] },
    "p-refri":  { desc: { pt: "Refrigerante com gás.", en: "Carbonated soft drink." },
                  variants: [{ name: { pt: "Formato", en: "Format" }, options: ["Lata 33cl", "Garrafa 50cl"] }] },
    "p-banana": { desc: { pt: "Banana da Madeira, vendida a peso.", en: "Madeira banana, sold by weight." } },
    "p-vinho":  { desc: { pt: "Tinto regional, 75cl.", en: "Regional red wine, 75cl." } },
    "p-leite":  { desc: { pt: "Leite meio-gordo UHT, 1L.", en: "Semi-skimmed UHT milk, 1L." },
                  variants: [{ name: { pt: "Tipo", en: "Type" }, options: ["Meio-gordo", "Magro", "Gordo"] }] },
    "p-choco":  { desc: { pt: "Tablete de chocolate de leite.", en: "Milk chocolate bar." } },
  };

  /* ---- Enriquecimento (ref, stock, desc) ---- */
  POS.products.forEach(function (p, i) {
    if (SUB[p.id]) p.sub = SUB[p.id];
    if (p.ref == null) p.ref = "REF-" + (p.barcode || (1000 + i));
    if (p.stock == null) p.stock = [6, 24, 12, 40, 8, 30, 15, 50][i % 8] + (p.fav ? 10 : 0);
    var d = DETAIL[p.id];
    if (d) { p.desc = d.desc; if (d.variants) p.variants = d.variants; }
    if (!p.desc) {
      var c = POS.categories.find(function (cc) { return cc.id === p.cat; });
      p.desc = { pt: c.name.pt + " · " + p.name.pt, en: c.name.en + " · " + p.name.en };
    }
  });

  /* ---- Armazéns ---- */
  POS.warehouses = [
    { id: "G", name: { pt: "GLOBAL (G)", en: "GLOBAL (G)" } },
    { id: "L", name: { pt: "Loja (L)",   en: "Store (L)" } },
    { id: "A", name: { pt: "Armazém (A)", en: "Warehouse (A)" } },
  ];

  /* ---- Documentos (mock, para "Consultar documentos") ---- */
  POS.documents = [
    { id: "d1", type: "simplified", number: 1042, seriesId: "2026", customerId: "final", operatorName: "Ana Sousa", terminalId: "T1", certified: true, ts: Date.now() - 1000 * 60 * 8,
      lines: [ { productId: "p-galao", qty: 2, unitPriceCents: 150 }, { productId: "p-tosta", qty: 1, unitPriceCents: 260 }, { productId: "p-bolo", qty: 2, unitPriceCents: 350 }, { productId: "p-sumo", qty: 2, unitPriceCents: 300 } ],
      payments: [ { method: "card", amountCents: 1860 } ] },
    { id: "d2", type: "receipt", number: 318, seriesId: "2026", customerId: "c1", nif: "218456701", operatorName: "João Pereira", terminalId: "T1", certified: true, ts: Date.now() - 1000 * 60 * 26,
      lines: [ { productId: "p-cafe", qty: 2, unitPriceCents: 70 }, { productId: "p-croiss", qty: 1, unitPriceCents: 120 }, { productId: "p-pao", qty: 4, unitPriceCents: 70 } ],
      payments: [ { method: "cash", amountCents: 1000 } ], changeCents: 460 },
    { id: "d3", type: "invoiceReceipt", number: 77, seriesId: "2026", customerId: "c3", nif: "509871234", operatorName: "Rita Marques", terminalId: "T1", certified: true, ts: Date.now() - 1000 * 60 * 73,
      lines: [ { productId: "p-vinho", qty: 3, unitPriceCents: 1200 }, { productId: "p-cerveja", qty: 6, unitPriceCents: 150 }, { productId: "p-arroz", qty: 2, unitPriceCents: 600 }, { productId: "p-ovos", qty: 2, unitPriceCents: 600 } ],
      payments: [ { method: "card", amountCents: 6900 } ] },
    { id: "d4", type: "simplified", number: 1041, seriesId: "2026", customerId: "c2", nif: "245983112", operatorName: "Ana Sousa", terminalId: "T1", certified: true, ts: Date.now() - 1000 * 60 * 95,
      lines: [ { productId: "p-agua", qty: 2, unitPriceCents: 60 }, { productId: "p-refri", qty: 1, unitPriceCents: 200 } ],
      payments: [ { method: "mbway", amountCents: 320 } ] },
  ];

  /* ---- Lookups ---- */
  POS.getProduct = function (id) { return POS.products.find(function (p) { return p.id === id; }); };
  POS.getTax = function (key) { return POS.TAX[key] || POS.TAX.normal; };
  POS.getCategory = function (id) { return POS.categories.find(function (c) { return c.id === id; }); };
  POS.getSubcategories = function (catId) { return POS.subcategories[catId] || []; };
  POS.getSubcategory = function (subId) {
    var all = []; Object.keys(POS.subcategories).forEach(function (k) { all = all.concat(POS.subcategories[k]); });
    return all.find(function (s) { return s.id === subId; });
  };
  POS.hasSub = function (catId) { return !!(POS.subcategories[catId] && POS.subcategories[catId].length); };
  POS.productsByCategory = function (catId) {
    if (catId === "favorites") return POS.products.filter(function (p) { return p.fav; });
    return POS.products.filter(function (p) { return p.cat === catId; });
  };
  POS.productsBySubcategory = function (subId) {
    return POS.products.filter(function (p) { return p.sub === subId; });
  };

})(window.POS);

/* =========================================================================
   Moloni POS — i18n.js
   Strings PT/EN + gestão de idioma. PT é a língua primária.
   - POS.s('chave')      -> string da UI no idioma atual
   - POS.t({pt,en})      -> escolhe campo traduzível de um objeto de dados
   - POS.lang            -> 'pt' | 'en'
   - POS.setLang('en')   -> muda e notifica subscritores
   - POS.onLangChange(fn)-> regista subscritor
   ========================================================================= */
window.POS = window.POS || {};

(function (POS) {
  "use strict";

  var STRINGS = {
    // App / nav
    "app.name":        { pt: "Moloni POS",       en: "Moloni POS" },
    "nav.sale":        { pt: "Venda",            en: "Sell" },
    "nav.register":    { pt: "Caixa",            en: "Register" },
    "nav.docs":        { pt: "Docs",             en: "Docs" },
    "nav.tables":      { pt: "Mesas",            en: "Tables" },
    "nav.options":     { pt: "Opções",           en: "Options" },
    "nav.settings":    { pt: "Definições",       en: "Settings" },
    "header.store":    { pt: "Loja",             en: "Store" },
    "header.terminal": { pt: "Terminal",         en: "Terminal" },

    // Catálogo
    "cat.search":          { pt: "Procurar produto ou ler código…", en: "Search product or scan code…" },
    "cat.empty.title":     { pt: "Sem resultados",                  en: "No results" },
    "cat.empty.body":      { pt: "Tenta outra pesquisa ou categoria.", en: "Try another search or category." },
    "cat.weighable":       { pt: "/kg",                             en: "/kg" },

    // Talão / carrinho
    "cart.title":        { pt: "Venda atual",        en: "Current sale" },
    "cart.soldBy":       { pt: "Operador",           en: "Sold by" },
    "cart.doc":          { pt: "Documento",          en: "Document" },
    "cart.park":         { pt: "Suspender",          en: "Park" },
    "cart.retrieve":     { pt: "Recuperar",          en: "Retrieve" },
    "cart.more":         { pt: "Mais ações",         en: "More actions" },
    "cart.customer":     { pt: "Cliente",            en: "Customer" },
    "cart.empty.title":  { pt: "Talão vazio",        en: "Empty receipt" },
    "cart.empty.body":   { pt: "Toca num produto para começar a venda.", en: "Tap a product to start the sale." },
    "cart.qty":          { pt: "Qtd",                en: "Qty" },
    "cart.remove":       { pt: "Remover linha",      en: "Remove line" },
    "cart.removed":      { pt: "Linha removida",     en: "Line removed" },
    "cart.undo":         { pt: "Anular",             en: "Undo" },
    "cart.clear":        { pt: "Limpar venda",       en: "Clear sale" },
    "cart.cleared":      { pt: "Venda limpa",        en: "Sale cleared" },
    "cart.discountLine": { pt: "Desconto na linha",  en: "Line discount" },

    // Totais
    "tot.discount":  { pt: "Desconto",  en: "Discount" },
    "tot.tax":       { pt: "IVA",       en: "Tax" },
    "tot.subtotal":  { pt: "Subtotal",  en: "Subtotal" },
    "tot.total":     { pt: "Total",     en: "Total" },
    "tot.items":     { pt: "artigos",   en: "items" },
    "tot.item":      { pt: "artigo",    en: "item" },

    // Ações
    "act.pay":        { pt: "Pagar",     en: "Pay" },
    "act.addDisc":    { pt: "Adicionar desconto", en: "Add discount" },
    "act.cancel":     { pt: "Cancelar",  en: "Cancel" },
    "act.confirm":    { pt: "Confirmar", en: "Confirm" },
    "act.apply":      { pt: "Aplicar",   en: "Apply" },

    // Keypad / quantidade
    "kp.qtyFor":     { pt: "Quantidade",    en: "Quantity" },
    "kp.weightFor":  { pt: "Peso (kg)",     en: "Weight (kg)" },

    // Navegação de catálogo (breadcrumb / famílias)
    "header.mode.sales": { pt: "Vendas",    en: "Sales" },
    "cat.categories":  { pt: "Categorias",  en: "Categories" },
    "cat.families":    { pt: "Famílias",    en: "Families" },
    "cat.products":    { pt: "Artigos",     en: "Items" },
    "cat.back":        { pt: "Voltar",      en: "Back" },
    "cat.details":     { pt: "Ver detalhes", en: "View details" },

    // Dialog de detalhes do produto
    "pd.ref":       { pt: "Referência",  en: "Reference" },
    "pd.stock":     { pt: "Stock",       en: "Stock" },
    "pd.inStock":   { pt: "em stock",    en: "in stock" },
    "pd.outStock":  { pt: "Esgotado",    en: "Out of stock" },
    "pd.lowStock":  { pt: "Stock baixo", en: "Low stock" },
    "pd.priceVat":  { pt: "Preço c/ IVA", en: "Price incl. VAT" },
    "pd.priceNoVat":{ pt: "S/ IVA",      en: "Excl. VAT" },
    "pd.vat":       { pt: "IVA",         en: "VAT" },
    "pd.desc":      { pt: "Descrição",   en: "Description" },
    "pd.variants":  { pt: "Variantes",   en: "Variants" },
    "pd.add":       { pt: "Adicionar à venda", en: "Add to sale" },

    // Tipos de documento
    "doc.type":          { pt: "Tipo de documento",  en: "Document type" },
    "doc.simplified":    { pt: "Fatura simplificada", en: "Simplified invoice" },
    "doc.receipt":       { pt: "Talão de venda",      en: "Sales receipt" },
    "doc.invoiceReceipt":{ pt: "Fatura-recibo",       en: "Invoice-receipt" },

    // Ações (coluna central / barra inferior — estilo Moloni)
    "act.parkedSales":   { pt: "Vendas suspensas",      en: "Parked sales" },
    "act.movements":     { pt: "Movimentos de caixa",   en: "Cash movements" },
    "act.documents":     { pt: "Consultar documentos",  en: "Documents" },
    "act.searchClients": { pt: "Pesquisar clientes",    en: "Search clients" },
    "act.options":       { pt: "Opções",                en: "Options" },
    "act.close":         { pt: "Fechar",                en: "Close" },
    "act.suspend":       { pt: "Suspender",             en: "Park" },
    "cart.clearConfirm": { pt: "Limpar toda a venda?",  en: "Clear the whole sale?" },
    "cart.clearBody":    { pt: "Remove todos os artigos do talão. Não há como anular.", en: "Removes all items from the receipt. This can't be undone." },
    "cart.totalDue":     { pt: "Total a pagar",         en: "Total due" },
  };

  // Estado de idioma (persistente)
  POS.lang = (function () {
    try { return sessionStorage.getItem("pos_lang") || "pt"; } catch (e) { return "pt"; }
  })();

  var subs = [];

  POS.s = function (key) {
    var entry = STRINGS[key];
    if (!entry) return key;
    return entry[POS.lang] != null ? entry[POS.lang] : entry.pt;
  };

  POS.t = function (obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[POS.lang] != null ? obj[POS.lang] : obj.pt;
  };

  POS.onLangChange = function (fn) { if (typeof fn === "function") subs.push(fn); };

  POS.setLang = function (lang) {
    if (lang !== "pt" && lang !== "en") return;
    if (lang === POS.lang) return;
    POS.lang = lang;
    try { sessionStorage.setItem("pos_lang", lang); } catch (e) {}
    document.documentElement.lang = lang;
    subs.forEach(function (fn) { try { fn(lang); } catch (e) {} });
  };

  document.documentElement.lang = POS.lang;

})(window.POS);

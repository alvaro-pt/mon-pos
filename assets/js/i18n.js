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
    "set.appearance":  { pt: "Aspeto",           en: "Appearance" },
    "set.disposition": { pt: "Disposição",       en: "Layout" },
    "set.terminal":    { pt: "Terminal",         en: "Terminal" },
    "set.about":       { pt: "Sobre",            en: "About" },
    "set.store":       { pt: "Loja",             en: "Store" },
    "set.terminalNo":  { pt: "Terminal n.º",     en: "Terminal no." },
    "set.operator":    { pt: "Operador",         en: "Operator" },
    "set.version":     { pt: "Versão",           en: "Version" },
    "set.theme":       { pt: "Tema",             en: "Theme" },
    "set.layout":      { pt: "Esquema",          en: "Layout" },
    "set.language":    { pt: "Idioma",           en: "Language" },
    "layout.a":        { pt: "Clássico",         en: "Classic" },
    "layout.b":        { pt: "Talão à esquerda", en: "Receipt left" },
    "layout.c":        { pt: "Operações",        en: "Operations" },
    "theme.normal":    { pt: "Normal",           en: "Normal" },
    "theme.dark":      { pt: "Escuro",           en: "Dark" },
    "theme.vivo":      { pt: "Vivo",             en: "Vivid" },
    "theme.clean":     { pt: "Clean",            en: "Clean" },
    "header.store":    { pt: "Loja",             en: "Store" },
    "header.terminal": { pt: "Terminal",         en: "Terminal" },
    "user.role":          { pt: "Operadora · Terminal #1", en: "Operator · Terminal #1" },
    "user.profile":       { pt: "O meu perfil",          en: "My profile" },
    "user.switchOperator":{ pt: "Trocar de operador",    en: "Switch operator" },
    "user.fullscreen":    { pt: "Ecrã inteiro",          en: "Full screen" },
    "user.exitFullscreen":{ pt: "Sair de ecrã inteiro",  en: "Exit full screen" },
    "user.backToMoloni":  { pt: "Voltar ao Moloni",      en: "Back to Moloni" },
    "user.logout":        { pt: "Sair",                  en: "Log out" },
    "user.logoutConfirm": { pt: "Terminar sessão?",      en: "Log out?" },
    "user.logoutBody":    { pt: "As vendas suspensas mantêm-se guardadas.", en: "Parked sales stay saved." },
    "user.fsUnavailable": { pt: "Ecrã inteiro indisponível neste browser", en: "Full screen unavailable in this browser" },

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
    "disc.chooseTitle":  { pt: "Aplicar desconto à venda", en: "Apply discount to sale" },
    "disc.chooseSub":    { pt: "Escolha o tipo de desconto que pretende aplicar.", en: "Choose the type of discount to apply." },
    "disc.perArticle":   { pt: "Desconto por artigo", en: "Per-item discount" },
    "disc.global":       { pt: "Desconto global",     en: "Global discount" },
    "disc.globalTitle":  { pt: "Desconto global",     en: "Global discount" },
    "disc.globalSub":    { pt: "Define o desconto a aplicar ao total da venda.", en: "Set the discount on the sale total." },
    "disc.perArticleTitle": { pt: "Desconto por artigo", en: "Per-item discount" },
    "disc.perArticleSub":   { pt: "Aplica o desconto a todos os artigos do talão.", en: "Applies the discount to every item." },
    "disc.docValue":     { pt: "Valor sem descontos", en: "Value before discounts" },
    "disc.applied":      { pt: "Desconto aplicado",   en: "Discount applied" },
    "disc.removed":      { pt: "Desconto removido",   en: "Discount removed" },

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
    "kp.clear":      { pt: "Limpar",        en: "Clear" },
    "kp.back":       { pt: "Retroceder",    en: "Backspace" },
    "osk.space":     { pt: "espaço",        en: "space" },
    "osk.done":      { pt: "Fechar",        en: "Done" },
    "osk.title":     { pt: "Teclado",       en: "Keyboard" },
    "osk.float":     { pt: "Tornar flutuante", en: "Make floating" },
    "osk.dock":      { pt: "Ancorar em baixo", en: "Dock to bottom" },

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
    "cash.title":        { pt: "Movimentos de caixa",   en: "Cash movements" },
    "cash.open":         { pt: "Abertura de caixa",     en: "Open register" },
    "cash.close":        { pt: "Fecho de caixa",        en: "Close register" },
    "cash.in":           { pt: "Entrada de caixa",      en: "Cash in" },
    "cash.out":          { pt: "Saída de caixa",        en: "Cash out" },
    "cash.consult":      { pt: "Consultar movimentos do terminal", en: "View terminal movements" },
    "cash.value":        { pt: "Valor",                 en: "Amount" },
    "cash.notes":        { pt: "Observações",           en: "Notes" },
    "cash.save":         { pt: "Guardar e fechar",      en: "Save & close" },
    "cash.openHint":     { pt: "Valor inicial em caixa.", en: "Opening float in the drawer." },
    "cash.closeHint":    { pt: "Valor contado no fecho.", en: "Counted amount at close." },
    "cash.inHint":       { pt: "Registar um movimento de entrada de caixa.", en: "Record a cash-in movement." },
    "cash.outHint":      { pt: "Registar um movimento de saída de caixa.", en: "Record a cash-out movement." },
    "cash.opened":       { pt: "Caixa aberta",          en: "Register opened" },
    "cash.closed":       { pt: "Caixa fechada",         en: "Register closed" },
    "cash.saved":        { pt: "Movimento registado",   en: "Movement recorded" },
    "cash.statusOpen":   { pt: "Caixa aberta",          en: "Register open" },
    "cash.statusClosed": { pt: "Caixa fechada",         en: "Register closed" },
    "cash.balance":      { pt: "Saldo em caixa",        en: "Drawer balance" },
    "cash.noMov":        { pt: "Sem movimentos",        en: "No movements" },
    "cash.alreadyOpen":  { pt: "A caixa já está aberta", en: "Register is already open" },
    "cash.notOpen":      { pt: "A caixa não está aberta", en: "Register is not open" },
    "act.documents":     { pt: "Consultar documentos",  en: "Documents" },
    "act.searchClients": { pt: "Pesquisar clientes",    en: "Search clients" },
    "act.options":       { pt: "Opções",                en: "Options" },
    "art.options":       { pt: "Opções do artigo",      en: "Item options" },
    "art.qty":           { pt: "Quantidade",            en: "Quantity" },
    "art.edit":          { pt: "Editar",                en: "Edit" },
    "art.unitPrice":     { pt: "Preço unitário",        en: "Unit price" },
    "art.delete":        { pt: "Eliminar",              en: "Delete" },
    "art.back":          { pt: "Voltar",                en: "Back" },
    "edit.title":        { pt: "Editar artigo",         en: "Edit item" },
    "edit.sub":          { pt: "Define designação, resumo e armazém.", en: "Set name, summary and warehouse." },
    "edit.designation":  { pt: "Designação",            en: "Name" },
    "edit.summary":      { pt: "Resumo",                en: "Summary" },
    "edit.warehouse":    { pt: "Armazém",               en: "Warehouse" },
    "art.priceTitle":    { pt: "Preço unitário",        en: "Unit price" },
    "act.close":         { pt: "Fechar",                en: "Close" },
    "act.suspend":       { pt: "Suspender",             en: "Park" },
    "cart.clearConfirm": { pt: "Limpar toda a venda?",  en: "Clear the whole sale?" },
    "cart.clearBody":    { pt: "Remove todos os artigos do talão. Não há como anular.", en: "Removes all items from the receipt. This can't be undone." },
    "cart.totalDue":     { pt: "Total a pagar",         en: "Total due" },
    "tot.taxBreakdown":  { pt: "IVA discriminado",      en: "VAT breakdown" },
    "act.back":          { pt: "Voltar",                en: "Back" },

    // Cliente / NIF
    "cust.search":       { pt: "Procurar cliente ou NIF…", en: "Search customer or VAT no.…" },
    "cust.invoiceNif":   { pt: "Faturar com NIF",       en: "Invoice with VAT no." },
    "cust.nifPlaceholder": { pt: "Introduzir NIF",      en: "Enter VAT number" },
    "cust.use":          { pt: "Usar",                  en: "Use" },
    "cust.noResults":    { pt: "Sem clientes",          en: "No customers" },
    "cust.invoiceNifShort": { pt: "Faturar",            en: "Invoice" },
    "cust.moreFields":   { pt: "Mais campos do cliente", en: "More customer fields" },
    "cust.new":          { pt: "Novo cliente",          en: "New customer" },
    "cust.nif":          { pt: "NIF",                   en: "VAT no." },
    "cust.name":         { pt: "Nome",                  en: "Name" },
    "cust.address":      { pt: "Morada",                en: "Address" },
    "cust.zip":          { pt: "Código postal",         en: "Postal code" },
    "cust.city":         { pt: "Localidade",            en: "City" },
    "cust.country":      { pt: "País",                  en: "Country" },
    "cust.phone":        { pt: "Telefone",              en: "Phone" },
    "cust.save":         { pt: "Guardar cliente",       en: "Save customer" },
    "cust.saved":        { pt: "Cliente guardado",      en: "Customer saved" },
    "cust.nameRequired": { pt: "Indique o nome do cliente", en: "Customer name is required" },

    // Vendas suspensas
    "park.title":        { pt: "Vendas suspensas",      en: "Parked sales" },
    "park.empty":        { pt: "Não há vendas suspensas", en: "No parked sales" },
    "park.parked":       { pt: "Venda suspensa",        en: "Sale parked" },
    "park.recover":      { pt: "Recuperar",             en: "Recover" },

    // Pagamento
    "pay.title":        { pt: "Pagamento",          en: "Payment" },
    "pay.method.cash":  { pt: "Dinheiro",           en: "Cash" },
    "pay.method.card":  { pt: "Cartão",             en: "Card" },
    "pay.method.mbway": { pt: "MB WAY",             en: "MB WAY" },
    "pay.received":     { pt: "Valor recebido",     en: "Amount received" },
    "pay.change":       { pt: "Troco",              en: "Change" },
    "pay.exact":        { pt: "Valor exato",        en: "Exact" },
    "pay.enterAmount":  { pt: "Inserir valor",      en: "Enter amount" },
    "pay.summary":      { pt: "Resumo da venda",    en: "Sale summary" },
    "pay.complete":     { pt: "Finalizar pagamento", en: "Complete payment" },
    "pay.done":         { pt: "Pagamento concluído", en: "Payment complete" },
    "pay.insufficient": { pt: "Valor recebido insuficiente", en: "Insufficient amount" },
    "pay.cardWaiting":  { pt: "A aguardar terminal…", en: "Waiting for terminal…" },
    "pay.mbwayWaiting": { pt: "A aguardar confirmação MB WAY…", en: "Waiting for MB WAY…" },
    "pay.approved":     { pt: "Aprovado",           en: "Approved" },
    "pay.cert":         { pt: "Processado por programa certificado", en: "Processed by certified software" },
    "pay.newSale":      { pt: "Nova venda",         en: "New sale" },
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

# CLAUDE.md — Moloni POS (protótipo)

> Protótipo navegável de um **POS (Ponto de Venda) de excelência** para o ecossistema Moloni.
> Stack deliberadamente simples: **HTML/CSS/JS vanilla, sem build, sem frameworks, sem dependências.**
> O valor deste protótipo é validar **layouts, comportamentos e UX** ao nível de produto real — não é produção.

Este ficheiro é a fonte de verdade para qualquer pessoa (ou agente) que trabalhe no projeto. Lê-o antes de mexer.

> **Manutenção deste ficheiro:** manter **sempre < 40k caracteres**; sempre que uma alteração mude **lógica ou regras**, atualizar aqui.

## Como testar

É **HTML estático puro** — abre `index.html` (ou `sale.html`) com **duplo-clique** (`file://`). Funciona offline: JS, carrinho, navegação e `sessionStorage`.
- **Único senão:** o Chrome/Edge podem bloquear as fontes locais em `file://` (cai no fallback `system-ui` — nada parte). O **Firefox** carrega-as bem.
- Para garantir a fonte: usa Firefox **ou** serve em localhost: `python -m http.server 8000` → `http://localhost:8000`.
- Otimizado para **tablet landscape** (~1100–1280px).

---

## 1. Visão de produto

Estamos a desenhar o **ecrã onde um operador de caixa passa o dia inteiro**. Num POS, a métrica que importa não é "quantas features" — é **quantos toques e quantos segundos** para fechar uma venda, e quão difícil é errar. Tudo neste protótipo serve essa tese:

- **Velocidade é a feature.** O caixa repete a mesma operação centenas de vezes por dia. Poupar um toque por venda é poupar horas por mês. Cada decisão de UX defende-se em "isto torna a venda mais rápida ou mais segura?".
- **À prova de pressa.** O utilizador está de pé, com fila à frente, luz variável, por vezes a olhar para o cliente e não para o ecrã. O ecrã tem de ser legível num relance e tolerante a toques imprecisos ("fat finger").
- **Erros são caros e públicos.** Anular uma linha, cancelar uma venda ou cobrar mal acontece à frente do cliente. Ações destrutivas pedem confirmação; sempre que possível há **desfazer** em vez de diálogo.
- **Confiança fiscal.** É um POS português. O documento que sai (talão/fatura) tem de parecer legalmente credível — IVA correto, NIF, ATCUD/QR. Ver secção 6.

### Vertical: híbrido (retalho-first)
O produto serve **retalho** como base e tem a **restauração preparada na arquitetura** (não escondida atrás de feature flags improvisadas). Arrancamos pelo retalho — grelha de produtos, pesquisa, código de barras, checkout rápido — e o modelo de dados/UI deixa lugar para mesas, modificadores e divisão de conta sem reescrever o ecrã de venda.

### Dispositivo-alvo: tablet landscape
Otimizamos primeiro para **tablet em landscape (~1024–1280px, touch)** — o standard da indústria. Desktop touch (balcão) é um upgrade de espaço (3 colunas), mobile é um modo comprimido. Não partimos de mobile; partimos do tablet e degradamos com cuidado.

---

## 2. Princípios de craft (POS)

Estes princípios mandam sobre preferências estéticas. Quando houver conflito, ganha a usabilidade do caixa.

### Toque e ergonomia
- **Alvos grandes:** botões de ação primária e tiles de produto ≥ **56px** de altura (mín. absoluto 44px). Espaçamento generoso entre alvos — o dedo é gordo e a fila tem pressa.
- **Sem dependência de hover.** Hover é bónus de desktop; nada de funcional vive só no hover. O estado primário tem de ser legível e acionável por toque.
- **Zonas de alcance.** Ações frequentes (adicionar, pagar, quantidade) ficam onde o polegar chega; ações raras/perigosas (anular venda) ficam afastadas e protegidas.

### Layout de venda (duas zonas + barra de total)
- **Catálogo** à esquerda/centro (categorias + grelha de produtos + pesquisa).
- **Talão (cart)** à direita: linhas da venda, sempre visível, com a linha selecionada destacada.
- **Total sempre presente e grande**, com o CTA de **Pagar** ancorado e impossível de não ver.
- O **keypad numérico** entra em cena para quantidade, peso, preço aberto e desconto — modal ou painel, nunca esconde o total.

### Visual e legibilidade
- **Glanceability:** o olho encontra o total, o próximo passo e o estado da venda em <1s. Hierarquia por tamanho/peso/cor ao serviço da prioridade.
- **Alto contraste, fontes grandes.** Texto operacional nunca cinzento-sobre-cinzento. Números (preços, totais, quantidades) com tabular-nums para não "saltarem".
- **Sistema, não improviso:** usa os tokens CSS de `base.css`. Falta um token? Propõe adicioná-lo, não faças hardcode disperso.
- **Tipografia:** **Red Hat Display** (ficheiros `.woff2` em `assets/fonts/`, carregados via `@font-face` em `base.css`). Pesos disponíveis: 300/400/500/600/700/800/900 (+ itálicos). Usa peso forte e `tabular-nums` nos números (preços, totais, quantidades).
- **Estados completos** em cada elemento interativo: default, hover (bónus), **focus-visible**, active/pressed, disabled, loading, selected, empty.

### Interação e motion
- **Feedback imediato e físico.** Cada toque reage: o tile "afunda", a linha entra no talão, o total anima. Nada de ações silenciosas. **Nunca `alert()`/`confirm()` como UI de produto** — usa toasts, inline UI e modais próprios.
- **Microinterações curtas** (120–220ms, easing natural) ao serviço da ação, nunca decorativas. Respeita `prefers-reduced-motion`.
- **Desfazer > confirmar.** Anular uma linha mostra um toast "Linha removida · Anular" durante alguns segundos em vez de um diálogo bloqueante. Confirmação reserva-se para o irreversível (cancelar venda inteira, fecho de caixa).

### Acessibilidade (não é opcional, mesmo em protótipo)
- HTML semântico: `<button>` para ações, `<a>` para navegação. Nada de `<div onclick>`.
- `:focus-visible` sempre presente; navegável por teclado (Tab/Enter/Esc) — muitos balcões têm teclado físico. `aria-label` em controlos só-ícone; `aria-hidden` em SVG decorativo.
- Contraste WCAG AA mínimo (texto normal 4.5:1; texto grande 3:1). Modais/drawers gerem o foco.

---

## 3. Arquitetura do protótipo

Mesmo prisma do protótipo de pricing de onde herdámos os agentes: **páginas standalone, estado em `sessionStorage`, lógica partilhada em `assets/js/`, zero build.**

```
index.html            Launcher (redireciona para sale.html) + hub da dev-nav
sale.html             Ecrã de venda (catálogo + talão + keypad)   ← coração do POS
payment.html          Fluxo de pagamento (método, troco, recibo)
...                   tables.html, register-close.html, returns.html (roadmap, secção 5)
assets/
  css/
    base.css          Design tokens (cores, espaços, tipografia, sombras) + reset + componentes partilhados
    sale.css          CSS dedicado do ecrã de venda
  fonts/              Red Hat Display (.woff2)
  js/
    data.js           FONTE DE VERDADE: produtos, categorias+subfamílias, IVA, mesas, clientes, operadores (POS.operators), emitente (POS.store), lojas+terminais (POS.stores/POS.terminals/POS.demoSales), documentos. Namespace global POS.
    i18n.js           Strings PT/EN. Toda a UI tem chave PT e EN.
    icons.js          Set de ícones SVG inline (estilo Lucide). POS.icon('nome', {size}). SEM emojis na UI.
    ui.js             dev-nav, idioma, toasts, POS.money, POS.keypad (numérico; opção mask p/ PIN), POS.osk (QWERTY on-screen), modais (foco + inert).
    cart.js           Estado da venda + POS.cash (estado da caixa) + POS.policy/opPrefs (governança) + POS.appendSale + POS.report (consolidação multi-terminal) + persistência + commitSale.
    doc.js            Render do DOCUMENTO de venda (POS.buildSaleDoc: talão/A4/oferta) + POS.printDoc + POS.emitCreditNote (NC como transação negativa) + ATCUD/QR simulados. Lógica pura.
```

> **Tema visual: Grafite & Índigo.** Chrome escuro (topbar/rail) em grafite (`--shell-*`); acento de marca índigo-violeta (`--brand-*`). Verde **sóbrio** (`--pay-*`) reservado ao Pagar/sucesso — não usar como "positivo genérico". Destrutivos irreversíveis (cancelar/limpar venda, confirmar eliminação) a **vermelho sólido + texto branco** (`.btn--danger-solid`); ações que só abrem confirmação ou têm desfazer ficam subtis. Cor de família = **tinta suave** (`color-mix`), não saturada. Tokens em `base.css` — não mudar a paleta por hardcode.
> **Modos/temas:** 4 temas via `:root[data-theme="dark|vivo|clean"]` em `base.css` (Normal = `:root` base). Trocar com `POS.setTheme()` (persiste `pos_theme`; snippet anti-flash no `<head>`). Tintas de família usam `--tint-base`/`--tint-ink` (não `white`) para não partir no dark. Controlos: botão Aspeto no topo + item Definições do rail (`openAppearance`). Idioma migrou da dev-nav para o topo; **dev-nav só com `?dev=1`**.
> **Layouts:** 3 esquemas via `:root[data-layout="a|b|c"]` + `grid-template-areas` no `.app` (A clássico, B talão à esquerda, C com coluna de **operações**). Trocar com `POS.setLayout()` (View Transitions p/ swipe; persiste `pos_layout`). Coluna de operações redimensionável (`--ops-w`, `pos_ops_w`). Mudar layout/tema **não** reescreve a lógica — só classes/atributos no root.
> **Diálogos (regra POS):** **não fecham por toque fora.** `POS.openModal` (centrado) e `POS.openDrawer` (lateral) injetam sempre um **X** no topo e fecham por X/Esc; backdrop só fecha com `dismissable:true`. Padrão: confirmação/keypad/detalhes → modal; **definições e listagens → drawer** (`dimmed:false` deixa ver a app mudar atrás). **Definições** = ecrã in-place (substitui catálogo+talão; swipe só no conteúdo, rail/topbar fixos) com **tabs** (Aspeto: tema+disposição+idioma / Terminal / Sobre). Exceção à regra: **menus de navegação ancorados** (ex. dropdown do utilizador no topo) fecham por clique-fora/Esc, pois não são diálogos de venda. Topo direito: Lock fica ícone solto; perfil/trocar operador/ecrã inteiro/sair vivem no dropdown do utilizador.
> **Animação:** ao adicionar artigo, um "ghost" voa para o talão (`flyToCart`, respeita `prefers-reduced-motion`).
> **Iconografia:** **só SVG via `POS.icon()`** — nunca emojis na UI (denunciam um POS datado). Famílias têm `icon` (nome do set); produtos herdam o ícone da família. Teclados: `POS.keypad` (numérico, vírgula/Limpar/Retroceder) e `POS.osk` (QWERTY on-screen, ancorado ou flutuante arrastável).
> **Navegação do catálogo:** por **família com breadcrumb** (Categorias › Família › Subfamília), estilo Moloni real. Raiz mostra tiles de família; famílias com subfamílias fazem drill-down; Favoritos é família fixa. Pesquisa (nome/ref/código) sobrepõe-se; código exato ou match único + Enter adiciona logo.

### Convenções (segue-as à risca)
- Cada `.html` é **standalone**: `<script>` inline no fim para a lógica da página; CSS dedicado em `assets/css/`; `base.css` é partilhado.
- **Namespace global `POS`** (em `data.js`). Para mudar produtos/preços/IVA, edita `data.js`, **nunca** no HTML.
- **i18n obrigatório:** toda a string visível passa por `POS.s('chave')` (UI) ou `POS.t({pt,en})` (dados). Nada de texto hardcoded que não traduz. PT é a língua primária.
- **Moeda e números:** formata **sempre** via helper (`POS.money(cents)`), nunca concatenando `€` à mão. Trabalha em **cêntimos (inteiros)** internamente para evitar erros de vírgula flutuante; só formata na fronteira de apresentação.
- **Estado partilhado via `sessionStorage`:** `pos_lang` (`pt`/`en`), `pos_cart` (venda atual), `pos_payment` (payload para o ecrã de pagamento). Chaves com prefixo `pos_`. **Exceção persistente (`localStorage`):** `pos_sales` (transações imutáveis), `pos_cash_<terminalId>` (estado da caixa), `pos_store_policy` (política da loja, `POS.policy`) e `pos_op_prefs_<id>` (preferências do operador) — transcendem a sessão (ver §5.1 e §5.2).
- **Governança (§5.2):** níveis Plataforma > Gerente > Terminal > Operador. `POS.policy` (fonte única da política da loja) + `tier` no roster (`operator`/`supervisor`/`manager`) + `POS.policy.can(opId, ação)`. Definições trancadas mostram cadeado "Controlado pelo gerente"; **Modo Gerência** (tab Definições) abre com PIN de gerente. Idioma/tema viajam com o operador (`POS.opPrefs`). **As permissões MORDEM no fluxo** via `requirePermission(ação, onGranted)`/`requireTier`: desconto > `discountMaxPct`, emitir NC, sangria/entrada (`cashInOut`) e anular venda com artigos (`voidSale`) pedem **PIN de supervisor/gerente** na hora (passa direto se o operador já tiver tier). **Falta (decisão):** a NC ainda não é transação em `pos_sales` (não entra no Z nem na reconciliação de caixa) — ver §6.
- **Documentos = fonte fundida:** a lista de Documentos lê `POS.sales()` (vendas reais emitidas) **+** `POS.documents` (histórico seed + NCs), recentes em cima. Vendas concluídas aparecem logo.
- **Padrão de render:** cada página tem `render()` que injeta HTML nos contentores e re-renderiza em `POS.onLangChange` (e em mudanças do carrinho via `POS.onCartChange`). Segue este padrão; não espalhes manipulação de DOM avulsa.
- **`dev-nav`** no topo é andaime de protótipo (atalho entre ecrãs para a demo). Mantém-na funcional ao adicionar páginas; é ignorada na avaliação de UX do *produto*.
- **Não duplicar** nav, toasts, formatação, gestão de modal — reutiliza os helpers de `ui.js`.

---

## 4. Modelo de dados (resumo)

Definido em `data.js`, namespace `POS`. Princípios:

- **Produto:** `id`, `name {pt,en}`, `priceCents`, `tax` (chave em `POS.TAX`), `cat` (família), `sub` (subfamília, opcional), `color`/`icon`, `barcode`/`ref`, `stock`, `desc {pt,en}`, `fav`, `weighable` (preço/kg). `variants` (opcional: tamanho/cor) e `modifiers` (restauração) preparados. Enriquecimento (ref/stock/desc default) no fim de `data.js`.
- **Categoria (família):** `id`, `name {pt,en}`, `icon` (nome do set), `color`, `pinned`. **Subfamílias** em `POS.subcategories[catId]` (drill-down). Lookups: `productsByCategory`, `productsBySubcategory`, `hasSub`, `getSubcategories`.
- **Linha de venda (cart):** ref ao produto + `qty`/`weight`, `unitPriceCents` (editável), `discount {type:'pct'|'abs', value}`. Subtotal e IVA derivam-se. Estado tem `docType` (`receipt`/`simplified`/`invoiceReceipt`).
- **Cliente:** `Consumidor Final` por defeito; opção de NIF/nome.
- **Operador:** roster em `POS.operators` (`id`, `name`, `role {pt,en}`, `pin`). O operador ativo vive em `pos_terminal` (`operatorId`/`operatorName`); trocar regista `handover` na caixa (ver §5.1).
- **Mesa** (preparado, restauração): `id`, `zona`, `estado` (livre/aberta/a-pagar), venda associada.

Regra de ouro: **derivar, não duplicar.** Totais, IVA e troco calculam-se a partir das linhas; nunca se guardam dois sítios que possam divergir.

---

## 5. Roadmap de ecrãs e fluxos

Ordem de construção (cada um navegável e demo-ready antes do seguinte):

1. **Ecrã de venda** (`sale.html`) — ✅ v2: navegação por família (breadcrumb), tiles cor+ícone, dialog de detalhes (stock/IVA/variantes), talão com tipo de doc, keypad, descontos por linha, cliente, ações.
2. **Pagamento** (`payment.html`) — ✅ v3 (funil do PM): cartões de método (default = último usado), **`payments[]`** com dividido por progressive disclosure, estados de cartão (aguardar→aprovado/recusado-retry/cancelar), validação inline, **Fase 3 opcional** ("Mostrar resumo no fim da venda" — resumo+destinos email/PDF/talão venda/troca, ou segue limpo com passo de troco). `commitSale()` grava transação imutável em `pos_sales` (payments/operador/terminal/troco/IVA) antes de `clear()`. **Sem NIF tardio** (doc imutável após emissão). A enriquecer: dividido UI completo, quick-cash nota+moeda, pagamento parkável, paperless real.
3. **Documento de venda (talão/recibo)** — ✅ Onda A. Na lista de **Documentos**, tocar abre **preview no drawer** com blocos colapsáveis (Clientes · Artigos · Impostos · Pagamentos · Resumo) + ações **E-mail · Imprimir PDF (A4) · Talão de troca (oferta) · Talão de venda (80mm)**. Render partilhado `POS.buildSaleDoc` (talão/A4/oferta) com ATCUD/QR simulados. No fim da venda, o talão sai **direto** (toast) se a definição "Imprimir talão automaticamente" estiver ligada (Definições › Terminal). **Converter para NC** disponível no preview (ver item 6). NOTA: não há "ecrã de recibo" no funil — o documento sai da venda; preview/reimpressão vivem em Documentos.
4. **Mesas** (`tables.html`) — mapa de mesas, abrir/transferir/dividir conta (ativa a vertente restauração).
5. **Estado da caixa (máquina de estados)** — ✅ v1 + **resumo Z no fecho**. Fonte única `POS.cash` (`cart.js`), **persistente por terminal** em `localStorage` (`pos_cash_<terminalId>`). Ver regras dedicadas em **§5.1**. Falta: ecrã dedicado `register-close.html`, multi-TPA, histórico de turnos, permissões por perfil. Cliente: modal com pesquisa + formulário expansível (nome/NIF/morada/CP/localidade/país/telefone), com teclado on-screen.
6. **Devoluções / nota de crédito** — ✅ v2 (Onda B): no preview de um documento convertível (FT/FS/FR/VD), **Converter para NC** (gated por `creditNote` — pede PIN de supervisor se preciso) pede **motivo** (chips + nota) e emite uma **NC** (`POS.emitCreditNote`) — **transação imutável em `pos_sales`** que referencia o original (`relatedLabel`/`reason`), código AT **NC**, série 2026. **Valores negativos:** desconta no Z e na caixa e **devolve numerário** (reembolso em dinheiro → `payments:[{cash, −total}]`). Aparece na lista de Documentos (com total negativo) e é imprimível. **Falta:** seleção de linhas (devolução parcial).
7. **Consolidação multi-terminal por loja** — ✅ v1 (gestão): `POS.stores` + `POS.terminals` (cada terminal pertence a uma loja) + `POS.report.consolidated()` que funde vendas reais (`pos_sales`, deste terminal) com `POS.demoSales` (outros terminais) e agrega **por loja → terminal → método/operador** (total, nº vendas, ticket médio). Vista em **Modo Gerência** (`openConsolidation`). **Falta:** fecho do dia consolidado da loja; venda suspensa entre terminais; propagação de preços.

Fluxo nuclear da demo: `index → sale → payment → recibo` (e regresso a `sale` para nova venda).

### 5.1 Regras do estado da caixa (porteiro do POS)

- **Dois estados por terminal:** `fechada` (default ao arrancar / sem registo) e `aberta`. **Sem auto-fecho** ao recarregar/fechar o browser — uma caixa aberta continua aberta (a sessão do browser ≠ turno). Por isso o estado e as vendas vivem em **`localStorage`** (não session).
- **Fecho é definitivo:** depois de fechada, não há reabertura nem "cliente retardatário" — uma venda nova exige abrir um novo turno (decisão do PM: não há venda fora de turno).
- **Bloqueio do terminal (lock):** o cadeado no topo (`lockTerminal`) abre um ecrã cheio que desfoca o fundo, identifica o Moloni POS e pede **PIN** (pad próprio, mascarado) para desbloquear com o mesmo operador ou **trocar de operador** ao desbloquear. Persiste em `pos_locked`.
- **Vender exige caixa aberta.** Bloqueia-se **no ponto de venda**, não com um muro à entrada. **Bloqueado:** adicionar artigo, ir para pagamento (`Pagar` fica `disabled`), recuperar venda suspensa. **Permitido com caixa fechada:** navegar/pesquisar catálogo, ver detalhes, consultar documentos/vendas, consultar movimentos (resumo+detalhado), abrir a caixa, Definições/idioma/tema.
- **Saída a 1 toque:** catálogo mostra banner persistente "Caixa fechada → Abrir caixa"; tentar vender dá toast com ação "Abrir caixa". Ícone "Caixa" no rail reflete o estado (**fechada = badge `×` com forma+`aria-label`**, não só cor). Prompt de arranque é **dispensável** (X/Esc, "Agora não"), 1× por sessão.
- **Abrir = inserir fundo de caixa.** Entradas (`in`)/saídas (`out`) exigem caixa aberta. Valores invulgares (> 2000 €) pedem confirmação suave.
- **Fecho é CEGO:** o operador insere primeiro o **dinheiro contado** (+ total TPA reportado); só depois se **revela** o esperado e a **divergência**. O contado entra por **contagem por denominação** (notas/moedas com stepper + soma automática, `denomCounter`); a repartição fica em `snap.countedBreakdown`. `Esperado em numerário = fundo + vendas em dinheiro líquidas (recebido−troco) + entradas − saídas`. Cartão/MBWay **não** entram no numerário → vão para o **esperado em cartão** (divergência de TPA **separada** da de dinheiro). Divergência: falta=perigo, sobra=aviso (**nunca verde**), certo=neutro; ≠0 **não** impede fechar. Confirmação é **irreversível** (`btn--danger-solid` + anti-duplo-toque).
- **Movimentos:** modal com **6 cards** (Abrir · Fechar · Entrada · Saída · Consultar Resumo · Consultar Detalhado). Detalhado = recentes em cima, **paginado 10/25/50** (default 25) + **pesquisa** (tipo/nota/operador/valor), em drawer. "Turno" = desde o último `open`.
- **Operador é atributo do turno, terminal é a unidade.** Trocar de operador (`switchOperator`, roster em `POS.operators` com PIN simulado) **não fecha a caixa** — regista um movimento `handover` e carimba as vendas/movimentos seguintes com o novo operador (`POS.terminal().operatorName`). O topo (avatar+nome) reflete o operador atual (`renderUser`).
- **No-sale / abrir gaveta** (`nosale`) e **handover**: movimentos com `amount 0` que ficam no rasto mas **não afetam o saldo** (só `in`/`out` afetam o esperado). No-sale exige caixa aberta (botão "Abrir gaveta").
- **Abertura:** sugere o **último fundo** usado (`lastFund`, confirmável a 1 toque) e aceita **contagem por denominação** também na abertura.
- **Divergência elevada** (dinheiro ou cartão > 10 €) no fecho **exige justificação** (nota obrigatória) antes de confirmar.
- **Resumo Z (mini-Z):** o passo de revisão do fecho mostra o **documento Z do turno** (`POS.cash.zReport()`): nº vendas, total bruto, recebido por método, troco, movimentos e **IVA discriminado por taxa** + reconciliação dinheiro/cartão. Tem **Imprimir Z** (talão 80mm via `@media print`, elemento `.z-print`). O Z é **congelado no snapshot** do movimento `close` (`snap.z`) e **reimprimível** a partir da lista detalhada ("Ver resumo Z").

---

## 6. Contexto fiscal português (o que tem de "parecer certo")

Não implementamos certificação real, mas o protótipo tem de **transmitir confiança fiscal**:

- **Taxas de IVA (continente):** Normal **23%**, Intermédia **13%**, Reduzida **6%**, Isento **0%**. (Madeira/Açores têm taxas próprias — fora do âmbito inicial, mas o modelo de `taxRate` não deve assumir só continente.)
- **IVA discriminado** no talão por taxa (base, IVA, total por escalão).
- **Cliente:** `Consumidor Final` por defeito; possibilidade de **NIF + nome** quando o cliente quer fatura com contribuinte.
- **Tipos de documento** (visual): Talão de venda / Fatura Simplificada / Fatura-Recibo / Nota de Crédito.
- **Marcas de certificação** (simuladas no recibo): **ATCUD**, **QR code**, indicação "Processado por programa certificado".
- **Arredondamento:** trabalha em cêntimos; arredonda só na apresentação. IVA calculado de forma consistente para o total bater certo.
- **Documento imutável após emissão (PT):** depois de emitido, um documento **não pode ser alterado** — nem o NIF/cliente. Não existe "NIF tardio". O NIF é capturado **antes** de emitir (cliente da venda); corrigir = **anular o documento e emitir um novo**. O fecho regista a transação em `pos_sales` (imutável).
- **Nota de crédito = transação negativa:** corrigir/devolver faz-se emitindo uma **NC** (não se mexe no original). A NC é gravada em `pos_sales` com **totais e pagamentos negativos** → desconta no Z e no esperado da caixa e **devolve numerário** (reembolso em dinheiro). Sinal negativo visível na lista/preview/talão.

---

## 7. Fluxo de trabalho

1. **Antes de mexer:** lê o ecrã-alvo, o seu CSS/JS, os tokens em `base.css`, os dados em `data.js` e as strings em `i18n.js`.
2. **Implementa** seguindo as convenções — código que se lê como o que já existe.
3. **Garante:** PT + EN; moeda via helper; estado do carrinho coerente ao navegar; `render()` re-renderiza em mudança de idioma e de carrinho.
4. **Verifica estados:** default/hover/focus/active/disabled/loading/selected/**empty** e **responsivo** (tablet landscape primeiro, depois desktop largo e mobile comprimido).
5. **Serve e valida:** `python -m http.server` (ou equivalente) e confirma o comportamento. Reporta o que confirmaste e o que não deu para verificar.
6. **Resume no fim:** o que mudaste, ficheiros tocados, decisões de design e o que recomendas a seguir.

### Agentes
- **`ui-prototyper`** — constrói/refina ecrãs e craft visual.
- **`ux-reviewer`** — audita usabilidade/acessibilidade/fluxos antes de uma demo (não escreve código).
- **`pos-product-manager`** / **`pos-operator`** / **`pos-store-manager`** — personas para validar produto, ótica de balcão e ótica de gestão.

### Auditorias (tracking obrigatório)
Sempre que se faça uma **auditoria** (global ou focada) com os agentes, **regista o resultado** num ficheiro em `.claude/agents/auditorias/` (nome `AAAA-MM-DD-<âmbito>.md`). O ficheiro organiza os achados **por agente** e **por grau de importância** (🔴 crítico / 🟠 alta / 🟡 média) e mantém o **estado de cada um** (✅ resolvido · ⏳ deferido · ↪️ decisão tomada), para haver tracking ao longo do tempo. Ao corrigir achados em rondas seguintes, **atualiza o estado** no respetivo ficheiro (não criar duplicados para a mesma auditoria). Termina sempre com a lista de **pendentes priorizados**.

---

## 8. Migração futura para React (princípio permanente)

O objetivo final é **migrar toda a lógica deste protótipo para um projeto React**. Constrói **sempre** com este princípio de base, para a migração ser o mais direta possível:

- **Lógica separada da apresentação.** Mantém regras de negócio, cálculos e dados em módulos puros (`data.js`, `cart.js`, helpers de `ui.js`) desacoplados do DOM — migram quase copy-paste para `utils`/hooks/store. Evita enterrar lógica dentro de manipulação de DOM.
- **Cada ecrã = componente isolado** com inputs/outputs claros. Pensa cada página como um componente com estado próprio e dependências explícitas (não globais escondidas).
- **Estado partilhado bem identificado e centralizado.** Hoje vive em `sessionStorage` + pub/sub (`POS.onCartChange`/`onLangChange`/`onThemeChange`/`onLayoutChange`). Chaves (sessão salvo nota): `pos_lang`, `pos_theme`, `pos_layout`, `pos_ops_w`, `pos_cart` (inclui `payments[]`), `pos_parked`, `pos_terminal` (terminalId/operador/série), `pos_show_summary`, `pos_last_method`; **persistentes (`localStorage`):** `pos_sales` (transações imutáveis) + `pos_cash_<terminalId>` (estado da caixa: `{open, openTs, movements[]}`, API `POS.cash`). Em React → `useState`/`useContext`/store (Zustand/Redux); o pub/sub atual mapeia 1:1 para subscrição de store.
- **Render reativo previsível.** O padrão `render()` + subscritores mapeia para re-render por estado em React. Mantém render idempotente a partir do estado (sem mutações dispersas de DOM).
- **O que migra fácil:** CSS ~1:1 (→ CSS modules/styled/Tailwind, conforme o destino); lógica pura (copy-paste); HTML→JSX (`class`→`className`). **O que muda de paradigma:** estado (sessionStorage+render → hooks/store), navegação entre páginas (→ React Router), i18n (`POS.s`/`POS.t` → `react-i18next` com as mesmas chaves — por isso mantém as chaves limpas e estáveis).
- **Stack de destino:** a confirmar (Next.js / Vite+React / CRA; estado; styling; i18n). Quando definido, orientar decisões aqui para minimizar atrito.

## 9. O que NÃO fazer

- **Não** introduzir frameworks/libs/bundlers — o valor é ser vanilla e standalone.
- **Não** hardcode de texto visível fora do i18n, nem de preços/IVA fora de `data.js`.
- **Não** usar floats para dinheiro — cêntimos inteiros, formatar só na apresentação.
- **Não** usar `alert()`/`confirm()`/`prompt()` como UX de produto — usa toasts, inline UI e modais próprios.
- **Não** duplicar nav/toasts/formatação/modais — reutiliza `ui.js`.
- **Não** deixar ações sem feedback, CTAs para `#`, ou dead-ends por assinalar.
- **Não** sacrificar a velocidade/segurança do caixa por estética. No POS, a usabilidade ganha.

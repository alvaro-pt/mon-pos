# Auditoria global — 2026-06-29

**Âmbito:** estado completo do protótipo após governança v1 (caixa, documentos/NC, ecrã de bloqueio, troca de operador, governança, master-detail).
**Agentes:** pos-product-manager · ux-reviewer · ui-prototyper (craft/código) · pos-operator · pos-store-manager.
**Legenda estado:** ✅ resolvido · ⏳ deferido (decisão/maior) · ↪️ decisão tomada.

---

## CONSENSO (vários agentes)
- 🔴 **Governança não "mordia"** (gestão, operador, produto): `POS.policy.can`/`discountMaxPct` definidos mas nunca aplicados no fluxo. → ✅ `requirePermission`/`requireTier` com PIN de supervisor em desconto>teto, NC, sangria/entrada, anular venda.
- 🔴 **Documentos não mostravam vendas reais** (produto, gestão): lista lia só o seed. → ✅ lista funde `POS.sales()` + seed.
- 🔴 **NC não era transação** (produto, gestão): emitia para memória, não entrava no Z/caixa. → ✅ NC negativa em `pos_sales` (desconta caixa, devolve numerário, sinal negativo no Z). ↪️ decisão do PM: NC devolve numerário + sinal negativo.

## pos-product-manager
- 🔴 C1 vendas reais não aparecem em Documentos → ✅
- 🔴 C2 NC grava em memória, sem efeito fiscal/Z → ✅ (transação negativa em pos_sales)
- 🔴 C3 governança configurável mas não aplicada → ✅ (gate requirePermission)
- 🔴 C4 `voidSale` órfão (sem fluxo) → ✅ ligado ao "anular venda com artigos" (confirmClear)
- 🟠 A5 NC herda pagamentos do original (sinal) → ✅ reembolso em numerário negativo
- 🟠 A6 `applyOpPrefs` não corre no unlock-com-troca → ✅
- 🟠 A7 documentos sem `totals` materializados contribuem 0 no Z → ✅ NC grava `totals`; (seed sem totals usa derivação — aceitável)
- 🟡 M10 operador hardcoded no talão → ✅ · M11 `DOC_PREFIX` vs `docCode` → ✅ (docCode único) · M13 lista sem pesquisa → ✅ (já tinha pesquisa/paginação)

## ux-reviewer
- 🔴 C1 ecrã de bloqueio não isola o fundo (foco/SR passam por baixo) → ✅ `inert`+`aria-hidden` no `.app` + foco no pad
- 🔴 C2 `pos_locked` em sessionStorage (contornável por aba) → ✅ passou a `localStorage`
- 🔴 C3 modais empilhados: Esc em cascata → ✅ só o modal do topo responde a Esc/Tab
- 🟠 A1 strings hardcoded ("NIF inválido", aria-labels topbar) → ✅ "NIF inválido" i18n; (aria-labels topbar ⏳)
- 🟠 A2 operador no talão não acompanha troca → ✅
- 🟠 A3 switch só por cor; A4 lista master-detail sem aria-current/anúncio; A5 foco no painel de cartão (payment) → ⏳ (a11y, próxima ronda)
- 🟡 M1 dropdown doc sem Esc · M2 cores de confirmação · M4 keypad sem teclado físico · M5 NIF inline · M6 contraste clean · M7 toasts assertive → ⏳

## ui-prototyper (craft/código)
- 🔴 C1 `€ NaN` em pesáveis (lia `l.weight`) → ✅ `l.qty`
- 🔴 C2 swatches do tema `vivo` desatualizados → ✅ teal+coral
- 🟠 A1 lógica de "line gross" triplicada · A2 `methodLabel` ×3 · A5 `discountKeypad` reinventa keypad · A6 lookup de cliente ×8 → ⏳ (desduplicação; helpers puros p/ React)
- 🟠 A3 código de doc inconsistente (TL vs VD) → ✅ `POS.docCode` único
- 🟠 A4 PIN-pad triplicado (lock/switch/manager/auth) → ⏳ (extrair `POS.pinPad`)
- 🟠 A7 operador/loja hardcoded no talão/topbar → ✅
- 🟡 M1 modularizar `sale.html` (~1900 linhas → cash-ui/docs-ui/lock-ui) → ⏳ · M2 tokens hardcoded soltos → ⏳ · M4 NC mutava memória → ✅ (agora pos_sales)

## pos-operator
- 🔴 1 teto de desconto falso → ✅ (gate PIN) · 2 anular/sangria sem permissão → ✅
- 🔴 3 NIF tardio sem saída curta → ⏳ (lembrete pré-fecho + "corrigir cliente" a 1 toque)
- 🟠 4 cancelar venda = modal (vs desfazer) · 5 "Recebido" escondido no pagamento · 6 dois caminhos de troca de operador · 7 Cancelar no denomCounter apaga contagem → ⏳
- 🟡 8 toasts repetidos com caixa fechada · 9 motivo NC "NIF" · 10 micro-etiqueta no Pagar disabled → ⏳

## pos-store-manager
- 🔴 1 permissões não mordem → ✅ · 2 trilho de auditoria de ações sensíveis → ⏳ (`pos_audit`) · 3 NC fora do Z → ✅
- 🟠 consolidação da loja (todos os terminais) → ✅ **multi-terminal segmentado por loja** (`POS.stores`/`POS.terminals`/`POS.report.consolidated`; vista em Modo Gerência: loja → terminais → método/operador) ↪️ decisão: segmentar por loja · fecho do dia da loja → ⏳
- 🟡 venda suspensa entre terminais · propagação de preços → ⏳ (preparar na arquitetura)

---

## Pendentes priorizados (próximas rondas)
1. ✅ ~~Consolidação multi-terminal segmentada por loja~~ — feito (2026-06-29).
2. **Trilho de auditoria** (`pos_audit`) de ações sensíveis (desconto autorizado, NC, void, sangria, no-sale, handover). ← próximo
3. **Fecho do dia da loja** (consolidar fechos Z dos terminais da loja).
4. **Fluxo de NIF tardio** (lembrete pré-fecho + corrigir-cliente a 1 toque).
5. **Desduplicação + modularização** (`POS.pinPad`, helpers de linha/método/cliente, extrair cash-ui/docs-ui/lock-ui).
6. **A11y** (aria-current na master-detail, switch não só por cor, contraste tema clean, toasts assertive).

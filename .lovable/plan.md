## Diagnóstico (o que encontrei no seu banco)

Verifiquei seus itens reais no banco e identifiquei 3 grupos de problemas:

### 1. Datas antigas ainda existem
A migração anterior (`datesFixed_v2`) só corrige parcelas **não pagas**. Parcelas marcadas como "pagas" ficaram com data de **27/10/2023** (ex.: Bem-casados, Buffet, Local do Evento, Montagem do altar). Isso bagunça gráficos, histórico e o "primeiro pagamento".

Além disso o item **"Local"** ainda tem parcela 2 não paga em **22/06/2024** — sinal de que a migração rodou antes desse item existir e o flag de `localStorage` impediu nova execução.

### 2. Inconsistências entre valor total, valor pago e parcelas
| Item | Valor Total | Soma Parcelas | Valor Pago | Problema |
|---|---|---|---|---|
| Pastor da Cerimônia | R$ 500 | R$ 900 | R$ 0 | Parcela maior que o total |
| Mesas para o evento | R$ 572,50 | R$ 400 | R$ 360 | Parcela menor que o total |
| Caixa dos padrinhos | R$ 250 | R$ 250 | R$ 150 | Pago > 0 mas parcela única não marcada |
| Fotógrafo | R$ 1.400 | R$ 1.400 | R$ 699 | 5 parcelas empilhadas em 25/08/2026 |

### 3. Salvamento — está OK, mas pouco claro
- **AICommandBar** e toggle de status: salvam direto no banco ✅
- **EditItemDialog**: só salva ao clicar "Salvar" (não é autosave)
- Nenhum feedback visual de "salvando..." → você não sabe se foi gravado

---

## Plano de correção

### Passo 1 — Migração de datas v3 (definitiva)
Criar `src/lib/fixWrongDates.ts` v3 (flag `datesFixed_v3`) que:
- Reexecuta para **todos os usuários** (novo flag)
- Corrige parcelas **pagas E não pagas** com data anterior a **01/01/2025**
- Para parcelas pagas antigas: mantém o dia, move para o mês atual de 2025/2026 mais coerente com a ordem da parcela
- Para parcelas não pagas antigas: distribui mês a mês a partir do próximo mês, sem ultrapassar 29/08/2026
- Evita empilhar várias parcelas no mesmo dia (espalha em meses sequenciais)

### Passo 2 — Validador automático de consistência
Criar `src/lib/validateItem.ts` chamado dentro de `WeddingContext.fetchData`:
- Se `soma(parcelas) ≠ valorTotal`: re-balanceia automaticamente proporcionalmente OU mostra aviso
- Se `valorPago > 0` mas nenhuma parcela `pago=true`: marca as parcelas mais antigas como pagas até bater
- Se `valorPago` diverge da soma das parcelas pagas: recalcula `valorPago` a partir das parcelas (fonte da verdade)
- Aplica correção silenciosa e mostra um toast "Corrigi N itens com dados inconsistentes"

### Passo 3 — Tornar salvamento visível
Em `EditItemDialog.tsx` e nos toggles de parcela/status:
- Substituir botão "Salvar" por **autosave com debounce de 600ms** ao mudar campos
- Mostrar indicador discreto no canto do diálogo: `⋯ Salvando` → `✓ Salvo` → desaparece após 1.5s
- Mantém botão "Fechar" em vez de "Salvar/Cancelar"
- Aplicar mesmo indicador no rodapé da página de Itens quando um toggle inline grava

### Passo 4 — Página "Revisão" rápida (opcional, dentro de Finanças)
Adicionar card "Itens com dados inconsistentes" no `FinancialClosingPanel`:
- Lista itens onde soma de parcelas ≠ valor total
- Botão "Corrigir automaticamente" por linha
- Some quando tudo estiver consistente

### Passo 5 — Reforçar prompt da IA
Em `parse-wedding-input/index.ts` adicionar regras:
- "A soma das parcelas DEVE ser exatamente igual a valorTotal"
- "Não empilhe parcelas no mesmo mês — distribua mensalmente"
- "Se valorPago > 0, marque as primeiras parcelas como pago=true até totalizar valorPago"

---

## Detalhes técnicos
- **Arquivos novos**: `src/lib/fixWrongDates.ts` (v3, sobrescreve), `src/lib/validateItem.ts`, `src/hooks/useAutosave.ts`
- **Editados**: `WeddingContext.tsx`, `EditItemDialog.tsx`, `FinancialClosingPanel.tsx`, `Items.tsx` (toggle indicator), `supabase/functions/parse-wedding-input/index.ts`
- **Sem mudanças de schema** no banco — tudo é correção de dados em runtime + lógica de UI
- **Sem mudanças visuais** além do indicador "Salvando/Salvo"

## Pergunta antes de implementar
Os valores divergentes (ex.: Pastor R$500 vs parcela R$900) — você quer que eu:
**(A)** ajuste automaticamente o `valorTotal` para bater com a soma das parcelas, **(B)** ajuste as parcelas proporcionalmente para bater com o `valorTotal`, ou **(C)** apenas mostre o aviso e deixe você corrigir manualmente?

Vou aguardar sua resposta antes de implementar — ou se preferir, escolho **(C)** como padrão seguro.

## Bug-fix pass: dates, calculations, AI prompt

### 1. AI date generation (Bug #1)
**`supabase/functions/parse-wedding-input/index.ts`**
- Convert `SYSTEM_PROMPT` from a const to a function `buildSystemPrompt(today, weddingDate)` that interpolates the values at call time.
- Inside `serve(...)` compute `const today = new Date().toISOString().split('T')[0]` and read `weddingDate` (default `"2026-08-29"`; will accept from body if frontend passes it later).
- Prepend the CONTEXTO IMPORTANTE block exactly as specified.
- **`src/components/AICommandBar.tsx`**: pass `weddingDate: config.dataCasamento` in the invoke body so the edge function uses the real wedding date when available.

### 2. One-time data migration (Bug #2)
New file **`src/lib/fixWrongDates.ts`** exporting `fixWrongDates(configId)`:
- Guard: `if (localStorage.getItem('datesFixed_v2')) return;`
- Fetch all `wedding_items` for the given `config_id`.
- For each item, walk `parcelas`; for any unpaid parcela whose `dataVencimento < today`, recompute: keep original day-of-month, shift to 2026, starting from `today.month + 1` and incrementing one month per corrected parcela in order. Cap at 2026-08-29 (clamp month if exceeded).
- Skip parcelas with `pago === true`.
- Persist via `supabase.from('wedding_items').update({ parcelas }).eq('id', item.id)` only for changed items.
- Set `localStorage.setItem('datesFixed_v2', 'true')` and `console.log("Migration complete: X parcelas corrected across Y items")`.

Wire into **`src/contexts/WeddingContext.tsx`** `fetchData` right after `configId` is resolved, then call `refetch` once if anything changed.

### 3. Next installment filter (Bug #3)
**`src/lib/finance.ts`** — update `nextParcela()`:
- Filter `!p.pago && parseISO(p.dataVencimento) >= startOfDay(new Date())`.
- Sort ascending, take first.
**`src/pages/Index.tsx`** — when `stats.nextP` is null, render "Nenhuma parcela futura cadastrada"; remove the overdue branch (no more negative days). The `nextPOverdue` styling/logic is deleted.

### 4. Overdue alert sanity check (Bug #4)
**`src/components/InstallmentAlert.tsx`**:
- Compute `totalParcelas = allParcelas(items).length` and `overdueCount = overdue.length`.
- If `totalParcelas > 0 && overdueCount / totalParcelas > 0.5`, render a single warning: "⚠️ Detectamos possíveis datas incorretas. Verifique seus prazos."
- Otherwise, also filter the displayed overdue list to only those whose `dataVencimento` is within the last 90 days (`differenceInDays(today, d) <= 90`).

### 5. Monthly chart window (Bug #5)
**`src/lib/finance.ts`** — `monthlyExpense()` accepts an optional `weddingDate` and filters parcelas to `!p.pago && d >= today && d <= weddingDate`.
**`src/components/MonthlyExpenseChart.tsx`** — pass `config.dataCasamento` (via `useWedding`) to `monthlyExpense`; show empty state "Adicione prazos aos seus itens para ver a previsão mensal" when there is no data (compact mode included).

### 6. Percentage / dual ring (Bug #6)
**`src/components/ProgressRing.tsx`** — extend to accept optional `secondaryProgress` and `secondaryLabel`:
- Render a second concentric circle inside the existing one (smaller radius, same stroke width, muted color track + accent stroke).
- Center label becomes `"{primary}% concluído"` on top line and `"{secondary}% pago"` below.
**`src/pages/Index.tsx`** — compute `financialPct` from `totalGasto / totalPrevisto` and pass both to `<ProgressRing progress={stats.progress} secondaryProgress={financialPct} />`.

### 7. Timeline filter & Histórico section (Bug #7)
**`src/pages/Timeline.tsx`**:
- Split events into `future` (date >= today OR not done/paid items that are still relevant going forward) and `historico` (`done === true` OR date < today AND paid/concluded).
- Render future grouped by month (existing UI), expanded.
- Render a single collapsible "Histórico" section at the bottom (using existing `Accordion` from `@/components/ui/accordion`), collapsed by default, containing past paid/concluded events styled green with ✅.
- Keep the wedding day pinned event as-is.

### 8. Global date helpers (Bug #8)
New file **`src/lib/date.ts`** exporting `formatBR(dateStr)` and `daysUntil(dateStr)` exactly per spec (anchored at noon to avoid TZ shift).

Replace usages:
- `src/pages/Index.tsx`: `differenceInDays(parseISO(config.dataCasamento), new Date())` → `daysUntil(config.dataCasamento)`; all `format(parseISO(...), "dd/MM/yyyy")` → `formatBR(...)` (keep `"dd 'de' MMMM, yyyy"` long-form intact since spec only targets the plain numeric format).
- `src/pages/Timeline.tsx`: `format(parseISO(ev.date), "dd/MM/yyyy")` → `formatBR(ev.date)`.
- `src/components/InstallmentAlert.tsx`: replace the inline `differenceInDays(parseISO(...), startOfDay(new Date()))` with `daysUntil(p.dataVencimento)`.

No UI design, layout, or copy changes beyond the strings explicitly specified above.

### Out of scope (not touched)
Items page, Finances page panels other than what `monthlyExpense` already feeds, achievements, edge function for `ai-suggestions`, auth, RLS — none of these have date-bug code paths beyond the helpers above.

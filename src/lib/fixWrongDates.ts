import { supabase } from "@/integrations/supabase/client";
import { Parcela } from "@/types/wedding";

const FLAG = "datesFixed_v3";
const WEDDING_CAP = "2026-08-29";
const MIN_VALID_DATE = "2025-01-01";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function buildDate(year: number, month1to12: number, day: number): string {
  const lastDay = new Date(year, month1to12, 0).getDate();
  const d = Math.min(day, lastDay);
  return `${year}-${pad(month1to12)}-${pad(d)}`;
}

function addMonths(year: number, month1to12: number, delta: number) {
  const base = new Date(year, month1to12 - 1 + delta, 1);
  return { year: base.getFullYear(), month: base.getMonth() + 1 };
}

/**
 * One-time migration v3: fixes ALL parcelas with dates < 2025-01-01,
 * both paid and unpaid. Avoids stacking multiple parcelas on the same month.
 */
export async function fixWrongDates(configId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(FLAG)) return false;

  try {
    const { data: rows, error } = await supabase
      .from("wedding_items")
      .select("id, parcelas")
      .eq("config_id", configId);

    if (error || !rows) {
      console.error("fixWrongDates v3 fetch error", error);
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cap = new Date(WEDDING_CAP + "T12:00:00");

    let correctedParcelas = 0;
    let touchedItems = 0;
    const updates: { id: string; parcelas: Parcela[] }[] = [];

    for (const row of rows) {
      const parcelas = ((row.parcelas as unknown) as Parcela[]) || [];
      if (!Array.isArray(parcelas) || parcelas.length === 0) continue;

      let changed = false;
      // Track months already used in this item to avoid stacking
      const usedMonths = new Set<string>();
      parcelas.forEach(p => {
        if (p.dataVencimento && p.dataVencimento >= MIN_VALID_DATE) {
          usedMonths.add(p.dataVencimento.substring(0, 7));
        }
      });

      // offsets for unpaid (future) and paid (past) shifting
      let futureOffset = 1;
      let pastOffset = -1;

      const newParcelas: Parcela[] = parcelas.map((p) => {
        if (!p.dataVencimento) return p;
        if (p.dataVencimento >= MIN_VALID_DATE) return p;

        const origDay = parseInt(p.dataVencimento.split("-")[2] || "1", 10);

        if (p.pago) {
          // Place paid parcela in a past month of 2025, not stacking
          while (true) {
            const { year, month } = addMonths(today.getFullYear(), today.getMonth() + 1, pastOffset);
            pastOffset -= 1;
            // don't go before 2025-01
            if (year < 2025) {
              const newDate = buildDate(2025, 1, origDay);
              changed = true;
              correctedParcelas += 1;
              return { ...p, dataVencimento: newDate };
            }
            const key = `${year}-${pad(month)}`;
            if (!usedMonths.has(key)) {
              usedMonths.add(key);
              const newDate = buildDate(year, month, origDay);
              changed = true;
              correctedParcelas += 1;
              return { ...p, dataVencimento: newDate };
            }
          }
        } else {
          // Place unpaid parcela in a future month, not stacking, not after cap
          while (true) {
            const { year, month } = addMonths(today.getFullYear(), today.getMonth() + 1, futureOffset);
            futureOffset += 1;
            const candidate = new Date(`${buildDate(year, month, 1)}T12:00:00`);
            if (candidate > cap) {
              const newDate = buildDate(cap.getFullYear(), cap.getMonth() + 1, Math.min(origDay, cap.getDate()));
              changed = true;
              correctedParcelas += 1;
              return { ...p, dataVencimento: newDate };
            }
            const key = `${year}-${pad(month)}`;
            if (!usedMonths.has(key)) {
              usedMonths.add(key);
              const newDate = buildDate(year, month, origDay);
              changed = true;
              correctedParcelas += 1;
              return { ...p, dataVencimento: newDate };
            }
          }
        }
      });

      if (changed) {
        touchedItems += 1;
        updates.push({ id: row.id, parcelas: newParcelas });
      }
    }

    for (const u of updates) {
      const { error: upErr } = await supabase
        .from("wedding_items")
        .update({ parcelas: u.parcelas as never })
        .eq("id", u.id);
      if (upErr) console.error("fixWrongDates v3 update error", u.id, upErr);
    }

    localStorage.setItem(FLAG, "true");
    console.log(`Migration v3 complete: ${correctedParcelas} parcelas corrected across ${touchedItems} items`);
    return touchedItems > 0;
  } catch (e) {
    console.error("fixWrongDates v3 failed", e);
    return false;
  }
}

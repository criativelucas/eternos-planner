import { supabase } from "@/integrations/supabase/client";
import { Parcela } from "@/types/wedding";

const FLAG = "datesFixed_v2";
const WEDDING_CAP = "2026-08-29";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function buildDate(year: number, month1to12: number, day: number): string {
  // clamp day to last day of month
  const lastDay = new Date(year, month1to12, 0).getDate();
  const d = Math.min(day, lastDay);
  return `${year}-${pad(month1to12)}-${pad(d)}`;
}

export async function fixWrongDates(configId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(FLAG)) return false;

  try {
    const { data: rows, error } = await supabase
      .from("wedding_items")
      .select("id, parcelas")
      .eq("config_id", configId);

    if (error || !rows) {
      console.error("fixWrongDates fetch error", error);
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const cap = new Date(WEDDING_CAP + "T12:00:00");

    let correctedParcelas = 0;
    let touchedItems = 0;
    const updates: { id: string; parcelas: Parcela[] }[] = [];

    for (const row of rows) {
      const parcelas = ((row.parcelas as unknown) as Parcela[]) || [];
      if (!Array.isArray(parcelas) || parcelas.length === 0) continue;

      let changed = false;
      // sequential offset for parcelas that need shifting in this item
      let nextMonthOffset = 1;
      const newParcelas: Parcela[] = parcelas.map((p) => {
        if (p.pago) return p;
        if (!p.dataVencimento) return p;
        if (p.dataVencimento >= todayStr) return p;

        // shift: keep day-of-month, place into 2026 starting from (today.month + offset)
        const origDay = parseInt(p.dataVencimento.split("-")[2] || "1", 10);
        const base = new Date(today.getFullYear(), today.getMonth() + nextMonthOffset, 1);
        nextMonthOffset += 1;

        let year = base.getFullYear();
        let month = base.getMonth() + 1; // 1..12
        let candidate = new Date(`${buildDate(year, month, origDay)}T12:00:00`);
        if (candidate > cap) {
          // clamp to wedding date
          year = cap.getFullYear();
          month = cap.getMonth() + 1;
          const newDate = buildDate(year, month, Math.min(origDay, cap.getDate()));
          changed = true;
          correctedParcelas += 1;
          return { ...p, dataVencimento: newDate };
        }
        changed = true;
        correctedParcelas += 1;
        return { ...p, dataVencimento: buildDate(year, month, origDay) };
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
      if (upErr) console.error("fixWrongDates update error", u.id, upErr);
    }

    localStorage.setItem(FLAG, "true");
    console.log(`Migration complete: ${correctedParcelas} parcelas corrected across ${touchedItems} items`);
    return touchedItems > 0;
  } catch (e) {
    console.error("fixWrongDates failed", e);
    return false;
  }
}

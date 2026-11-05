import { describe, it, expect } from "vitest";
import { isOverdueDate, monthlyExpense, totalFaltante } from "@/lib/finance";
import { toCSV } from "@/lib/csv";
import type { WeddingItem } from "@/types/wedding";

const item = (o: Partial<WeddingItem>): WeddingItem => ({
  id: "1", nome: "X", categoria: "Outros", fornecedor: null, valorTotal: 0, valorPago: 0,
  parcelas: [], prazo: null, status: "pendente", prioridade: "media", notas: null, criadoEm: "", ...o,
} as WeddingItem);

describe("finance rules", () => {
  const now = new Date("2026-11-04T15:00:00");

  it("a deadline due today is not overdue", () => {
    expect(isOverdueDate("2026-11-04", now)).toBe(false);
    expect(isOverdueDate("2026-11-03", now)).toBe(true);
  });

  it("remaining balance never goes negative per item", () => {
    expect(totalFaltante([item({ valorTotal: 100, valorPago: 150 }), item({ valorTotal: 100 })])).toBe(100);
  });

  it("monthly forecast includes empty months up to the wedding", () => {
    const m = monthlyExpense(
      [item({ parcelas: [{ numero: 1, valor: 900, dataVencimento: "2027-01-10", pago: false }] })],
      "2027-02-20", now,
    );
    expect(m.map(x => x.month)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
    expect(m.map(x => x.value)).toEqual([0, 0, 900, 0]);
  });

  it("CSV keeps commas inside a field", () => {
    expect(toCSV([["Buffet Silva, Ltda", 1]])).toBe('"Buffet Silva, Ltda",1');
  });
});

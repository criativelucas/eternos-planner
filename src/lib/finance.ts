import { WeddingItem, Parcela } from "@/types/wedding";
import { parseISO, isPast, differenceInDays, format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const fmtBRL = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const faltanteItem = (i: WeddingItem) => Math.max(0, (i.valorTotal || 0) - (i.valorPago || 0));

export const totalFaltante = (items: WeddingItem[]) =>
  items.reduce((s, i) => s + faltanteItem(i), 0);

export interface ParcelaWithItem extends Parcela {
  itemId: string;
  itemNome: string;
  categoria: string;
}

export const allParcelas = (items: WeddingItem[]): ParcelaWithItem[] =>
  items.flatMap(i =>
    (i.parcelas || []).map(p => ({ ...p, itemId: i.id, itemNome: i.nome, categoria: i.categoria }))
  );

export const pendingParcelas = (items: WeddingItem[]) =>
  allParcelas(items).filter(p => !p.pago);

export const nextParcela = (items: WeddingItem[]) => {
  const today = startOfDay(new Date());
  return pendingParcelas(items)
    .filter(p => p.dataVencimento && parseISO(p.dataVencimento) >= today)
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0];
};

export const overdueParcelas = (items: WeddingItem[]) => {
  const today = startOfDay(new Date());
  return pendingParcelas(items).filter(
    p => p.dataVencimento && isPast(parseISO(p.dataVencimento)) && parseISO(p.dataVencimento) < today
  );
};

export const upcomingParcelas = (items: WeddingItem[], days = 7) => {
  const today = startOfDay(new Date());
  const end = addDays(today, days);
  return pendingParcelas(items).filter(p => {
    if (!p.dataVencimento) return false;
    const d = parseISO(p.dataVencimento);
    return d >= today && d <= end;
  });
};

export const monthlyExpense = (items: WeddingItem[], weddingDate?: string) => {
  const today = startOfDay(new Date());
  const cap = weddingDate ? parseISO(weddingDate) : null;
  const map: Record<string, number> = {};
  pendingParcelas(items).forEach(p => {
    if (!p.dataVencimento) return;
    const d = parseISO(p.dataVencimento);
    if (d < today) return;
    if (cap && d > cap) return;
    const key = p.dataVencimento.substring(0, 7); // YYYY-MM
    map[key] = (map[key] || 0) + p.valor;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      monthLabel: format(parseISO(month + "-01"), "MMM/yy", { locale: ptBR }),
      value,
    }));
};

export const parcelaColor = (p: Parcela): string => {
  if (p.pago) return "#10B981";
  if (!p.dataVencimento) return "#6B7280";
  const d = parseISO(p.dataVencimento);
  const today = startOfDay(new Date());
  if (d < today) return "#EF4444";
  const days = differenceInDays(d, today);
  if (days <= 7) return "#F59E0B";
  if (days <= 30) return "#C9956A";
  return "#6B7280";
};

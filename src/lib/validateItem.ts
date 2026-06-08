import { WeddingItem } from "@/types/wedding";

export interface ItemInconsistency {
  itemId: string;
  itemNome: string;
  type: "parcelas_sum" | "valor_pago_mismatch" | "pago_without_marked";
  message: string;
  expected?: number;
  actual?: number;
}

const EPS = 0.5; // tolerance in BRL for rounding

export function checkItem(item: WeddingItem): ItemInconsistency[] {
  const issues: ItemInconsistency[] = [];
  const parcelas = item.parcelas || [];

  if (parcelas.length > 0) {
    const sum = parcelas.reduce((s, p) => s + (Number(p.valor) || 0), 0);
    if (Math.abs(sum - item.valorTotal) > EPS) {
      issues.push({
        itemId: item.id,
        itemNome: item.nome,
        type: "parcelas_sum",
        message: `Soma das parcelas (${sum.toFixed(2)}) ≠ valor total (${item.valorTotal.toFixed(2)})`,
        expected: item.valorTotal,
        actual: sum,
      });
    }

    const paidSum = parcelas.filter(p => p.pago).reduce((s, p) => s + (Number(p.valor) || 0), 0);
    if (Math.abs(paidSum - item.valorPago) > EPS) {
      issues.push({
        itemId: item.id,
        itemNome: item.nome,
        type: "valor_pago_mismatch",
        message: `Valor pago (${item.valorPago.toFixed(2)}) não bate com soma das parcelas pagas (${paidSum.toFixed(2)})`,
        expected: paidSum,
        actual: item.valorPago,
      });
    }

    if (item.valorPago > EPS && !parcelas.some(p => p.pago)) {
      issues.push({
        itemId: item.id,
        itemNome: item.nome,
        type: "pago_without_marked",
        message: `Valor pago de ${item.valorPago.toFixed(2)} mas nenhuma parcela marcada como paga`,
      });
    }
  }

  return issues;
}

export function checkAllItems(items: WeddingItem[]): ItemInconsistency[] {
  return items.flatMap(checkItem);
}

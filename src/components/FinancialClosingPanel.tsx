import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import { CATEGORIA_ICONS } from "@/types/wedding";
import { fmtBRL, faltanteItem, totalFaltante } from "@/lib/finance";
import { formatBR } from "@/lib/date";
import { checkAllItems } from "@/lib/validateItem";
import MonthlyExpenseChart from "./MonthlyExpenseChart";

const FinancialClosingPanel = () => {
  const { items } = useWedding();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const pendentes = items.filter(i => faltanteItem(i) > 0);
  const inconsistencies = checkAllItems(items);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-foreground">Resumo Financeiro Completo</h2>

      {inconsistencies.length > 0 && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-100/80 dark:bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 space-y-2">
          <p className="text-sm font-body flex items-center gap-2 font-medium">
            <AlertTriangle size={14} />
            {inconsistencies.length} inconsistência{inconsistencies.length > 1 ? "s" : ""} detectada{inconsistencies.length > 1 ? "s" : ""}
          </p>
          <ul className="text-xs font-body space-y-1 pl-6 list-disc">
            {inconsistencies.slice(0, 8).map((iss, idx) => (
              <li key={idx}><strong>{iss.itemNome}</strong>: {iss.message}</li>
            ))}
          </ul>
          <p className="text-xs font-body opacity-80">Edite o item afetado para ajustar os valores ou parcelas.</p>
        </div>
      )}


      {/* A) Faltante por item */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading text-lg text-foreground">Valor Total Faltante</h3>
        {pendentes.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">Tudo quitado! 🎉</p>
        ) : (
          <div className="space-y-3">
            {pendentes.map(item => {
              const falta = faltanteItem(item);
              const pct = item.valorTotal > 0 ? (item.valorPago / item.valorTotal) * 100 : 0;
              return (
                <div key={item.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORIA_ICONS[item.categoria]}</span>
                      <span className="text-sm font-body text-foreground font-medium">{item.nome}</span>
                    </div>
                    <span className="text-sm font-accent text-primary">Faltam {fmtBRL(falta)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full gradient-rose rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground font-body whitespace-nowrap">
                      {fmtBRL(item.valorPago)} / {fmtBRL(item.valorTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="gradient-rose rounded-lg p-4 text-center">
          <p className="text-xs text-primary-foreground/80 font-body uppercase tracking-wider">Total restante a pagar</p>
          <p className="font-accent text-3xl text-primary-foreground mt-1">{fmtBRL(totalFaltante(items))}</p>
        </div>
      </div>

      {/* B) Parcelas detalhadas */}
      <div className="glass-card p-6 space-y-3">
        <h3 className="font-heading text-lg text-foreground">Parcelas Detalhadas por Item</h3>
        {items.filter(i => i.parcelas.length > 0).length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">Nenhum item com parcelas cadastradas.</p>
        ) : (
          items.filter(i => i.parcelas.length > 0).map(item => {
            const isOpen = !!expanded[item.id];
            const pendentes = item.parcelas.filter(p => !p.pago);
            const faltaParc = pendentes.reduce((s, p) => s + p.valor, 0);
            return (
              <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpanded(e => ({ ...e, [item.id]: !e[item.id] }))}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{CATEGORIA_ICONS[item.categoria]}</span>
                    <span className="text-sm font-body text-foreground font-medium">{item.nome}</span>
                    <span className="text-xs text-muted-foreground font-body">({item.parcelas.length} parc.)</span>
                  </div>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isOpen && (
                  <div className="p-3 border-t border-border space-y-2">
                    <table className="w-full text-xs font-body">
                      <thead className="text-muted-foreground uppercase text-[10px]">
                        <tr><th className="text-left py-1">Nº</th><th className="text-left">Valor</th><th className="text-left">Vencimento</th><th className="text-right">Status</th></tr>
                      </thead>
                      <tbody>
                        {item.parcelas.map(p => (
                          <tr key={p.numero} className="border-t border-border/50">
                            <td className="py-1.5 text-foreground">{p.numero}</td>
                            <td className="text-foreground">{fmtBRL(p.valor)}</td>
                            <td className="text-foreground">{p.dataVencimento ? formatBR(p.dataVencimento) : "—"}</td>
                            <td className="text-right">{p.pago ? "✅ Pago" : "⏳ Pendente"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pendentes.length > 0 && (
                      <p className="text-sm font-accent text-primary text-right pt-1">
                        Faltam {fmtBRL(faltaParc)} em {pendentes.length} parcela{pendentes.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* C) Expectativa Mensal */}
      <MonthlyExpenseChart />
    </div>
  );
};

export default FinancialClosingPanel;

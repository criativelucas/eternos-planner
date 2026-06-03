import { useMemo } from "react";
import { useWedding } from "@/contexts/WeddingContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORIA_ICONS, Categoria } from "@/types/wedding";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import FinancialClosingPanel from "@/components/FinancialClosingPanel";


const COLORS = [
  "hsl(27 47% 60%)", "hsl(15 50% 72%)", "hsl(340 40% 55%)", "hsl(200 50% 55%)",
  "hsl(150 40% 50%)", "hsl(45 60% 55%)", "hsl(280 40% 55%)", "hsl(0 50% 55%)",
  "hsl(180 40% 50%)", "hsl(60 50% 50%)", "hsl(320 50% 60%)", "hsl(100 40% 50%)",
];

const Finances = () => {
  const { items, config } = useWedding();

  const data = useMemo(() => {
    const totalGasto = items.reduce((s, i) => s + i.valorPago, 0);
    const totalPrevisto = items.reduce((s, i) => s + i.valorTotal, 0);
    const restante = totalPrevisto - totalGasto;
    const budgetPct = config.orcamentoTotal > 0 ? (totalGasto / config.orcamentoTotal) * 100 : 0;

    const byCategory = items.reduce<Record<string, number>>((acc, i) => {
      acc[i.categoria] = (acc[i.categoria] || 0) + i.valorTotal;
      return acc;
    }, {});

    const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    // Upcoming installments
    const parcelas = items.flatMap(item =>
      item.parcelas
        .filter(p => !p.pago)
        .map(p => ({ ...p, itemNome: item.nome, categoria: item.categoria }))
    ).sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

    return { totalGasto, totalPrevisto, restante, budgetPct, chartData, parcelas };
  }, [items, config]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const budgetColor = data.budgetPct > 100 ? "bg-destructive" : data.budgetPct > 80 ? "bg-yellow-500" : "gradient-rose";

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="font-heading text-3xl text-foreground">Finanças</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Planejado", value: fmt(data.totalPrevisto) },
          { label: "Total Pago", value: fmt(data.totalGasto) },
          { label: "Restante", value: fmt(data.restante) },
          { label: "Orçamento", value: fmt(config.orcamentoTotal) },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{label}</p>
            <p className="font-accent text-xl text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Budget Bar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg text-foreground">Gasto vs Orçamento</h2>
          <span className="font-accent text-sm text-primary">{Math.round(data.budgetPct)}%</span>
        </div>
        <div className="h-3 bg-border rounded-full overflow-hidden">
          <div className={`h-full ${budgetColor} rounded-full transition-all duration-700`} style={{ width: `${Math.min(data.budgetPct, 100)}%` }} />
        </div>
        {data.budgetPct > 100 && (
          <p className="text-xs text-destructive font-body mt-2">⚠️ Orçamento excedido em {fmt(data.totalGasto - config.orcamentoTotal)}</p>
        )}
        {data.budgetPct <= 100 && data.totalGasto < config.orcamentoTotal && (
          <p className="text-xs text-emerald-400 font-body mt-2">✨ Economia de {fmt(config.orcamentoTotal - data.totalGasto)} até agora!</p>
        )}
      </div>

      {/* Chart + Parcelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Gastos por Categoria</h2>
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.chartData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{ background: "hsl(325 13% 12%)", border: "1px solid hsl(325 10% 18%)", borderRadius: "8px", color: "hsl(23 38% 94%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm font-body text-center py-12">Sem dados ainda</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.chartData.map((d, idx) => (
              <div key={d.name} className="flex items-center gap-2 text-xs font-body">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                <span className="text-muted-foreground">{CATEGORIA_ICONS[d.name as Categoria]} {d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Installments */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Parcelas a Vencer</h2>
          {data.parcelas.length === 0 ? (
            <p className="text-muted-foreground text-sm font-body text-center py-12">Nenhuma parcela pendente 🎉</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.parcelas.slice(0, 10).map((p, i) => (
                <div key={`${p.itemNome}-${p.numero}-${i}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-body text-foreground">{p.itemNome}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      Parcela {p.numero} · {format(parseISO(p.dataVencimento), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="font-accent text-sm text-primary">{fmt(p.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FinancialClosingPanel />
    </div>
  );
};


export default Finances;

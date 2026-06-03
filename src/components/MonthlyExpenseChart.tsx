import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useWedding } from "@/contexts/WeddingContext";
import { monthlyExpense, fmtBRL } from "@/lib/finance";
import { format } from "date-fns";

interface Props {
  compact?: boolean;
  monthsWindow?: number;
}

const MonthlyExpenseChart = ({ compact = false, monthsWindow }: Props) => {
  const { items } = useWedding();
  const dataAll = useMemo(() => monthlyExpense(items), [items]);
  const currentMonth = format(new Date(), "yyyy-MM");
  const data = monthsWindow ? dataAll.slice(0, monthsWindow) : dataAll;

  const heaviest = useMemo(
    () => dataAll.reduce((acc, d) => (d.value > (acc?.value || 0) ? d : acc), dataAll[0]),
    [dataAll]
  );
  const avg = dataAll.length ? dataAll.reduce((s, d) => s + d.value, 0) / dataAll.length : 0;

  if (data.length === 0) {
    return compact ? null : (
      <div className="glass-card p-6 text-center text-sm text-muted-foreground font-body">
        Nenhuma parcela futura cadastrada para projetar gastos mensais.
      </div>
    );
  }

  return (
    <div className={compact ? "" : "glass-card p-6"}>
      {!compact && (
        <>
          <h2 className="font-heading text-lg text-foreground mb-1">Expectativa Mensal de Gasto</h2>
          {heaviest && (
            <p className="text-sm font-body text-foreground mb-1">
              Seu mês mais pesado será <span className="text-primary font-medium">{heaviest.monthLabel}</span>: <span className="text-primary font-medium">{fmtBRL(heaviest.value)}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground font-body mb-4">
            Média mensal até o casamento: <strong>{fmtBRL(avg)}</strong>
          </p>
        </>
      )}
      <ResponsiveContainer width="100%" height={compact ? 80 : 240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="monthLabel" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
          {!compact && <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />}
          <Tooltip
            formatter={(v: number) => fmtBRL(v)}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.month === currentMonth ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyExpenseChart;

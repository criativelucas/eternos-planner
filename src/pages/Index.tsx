import { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Target, CheckCircle, CalendarClock, AlertTriangle, Wallet, Calendar } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import ProgressRing from "@/components/ProgressRing";
import StatCard from "@/components/StatCard";
import { CATEGORIA_ICONS, STATUS_COLORS, STATUS_LABELS } from "@/types/wedding";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import InstallmentAlert from "@/components/InstallmentAlert";
import MonthlyExpenseChart from "@/components/MonthlyExpenseChart";
import { fmtBRL, totalFaltante, faltanteItem, nextParcela , isOverdueDate } from "@/lib/finance";
import { daysUntil, formatBR } from "@/lib/date";

const Dashboard = () => {
  const { items, config } = useWedding();

  const stats = useMemo(() => {
    const totalGasto = items.reduce((s, i) => s + i.valorPago, 0);
    const totalPrevisto = items.reduce((s, i) => s + i.valorTotal, 0);
    const concluidos = items.filter(i => i.status === "concluido").length;
    const daysLeft = daysUntil(config.dataCasamento);

    const upcoming = items
      .filter(i => i.prazo && !isOverdueDate(i.prazo) && i.status !== "concluido")
      .sort((a, b) => a.prazo!.localeCompare(b.prazo!))
      .slice(0, 5);

    const overdue = items.filter(i => i.prazo && isOverdueDate(i.prazo) && i.status !== "concluido");
    const progress = items.length > 0 ? (concluidos / items.length) * 100 : 0;
    const financialPct = totalPrevisto > 0 ? (totalGasto / totalPrevisto) * 100 : 0;
    const itemsAberto = items.filter(i => faltanteItem(i) > 0).length;
    const nextP = nextParcela(items);
    const nextPDays = nextP?.dataVencimento ? daysUntil(nextP.dataVencimento) : null;

    return { totalGasto, totalPrevisto, concluidos, daysLeft, upcoming, overdue, progress, financialPct, itemsAberto, nextP, nextPDays };
  }, [items, config, new Date().toDateString()]);

  return (
    <div className="space-y-8 animate-fade-in">
      <InstallmentAlert />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">
            Olá, {config.nomeNoiva} & {config.nomeNoivo} 💍
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            {stats.daysLeft > 0
              ? `Faltam ${stats.daysLeft} dias para o grande dia!`
              : stats.daysLeft === 0
              ? "O grande dia é hoje! 🎉"
              : "Parabéns pelo casamento! 🥂"}
          </p>
        </div>
        <div className="glass-card px-5 py-3 text-center">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Data do Casamento</p>
          <p className="font-accent text-lg text-primary">
            {format(parseISO(config.dataCasamento), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Progress + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <motion.div
          className="md:col-span-1 glass-card p-6 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ProgressRing progress={stats.progress} secondaryProgress={stats.financialPct} />
        </motion.div>

        <div className="md:col-span-4 overflow-x-auto md:overflow-visible">
          <div className="flex md:grid md:grid-cols-3 gap-4 min-w-max md:min-w-0">
            <div className="w-44 md:w-auto shrink-0"><StatCard icon={DollarSign} label="Total Gasto" value={fmtBRL(stats.totalGasto)} /></div>
            <div className="w-44 md:w-auto shrink-0"><StatCard icon={Target} label="Total Previsto" value={fmtBRL(stats.totalPrevisto)} /></div>
            <div className="w-44 md:w-auto shrink-0"><StatCard icon={CheckCircle} label="Concluídos" value={`${stats.concluidos}/${items.length}`} /></div>
            <div className="w-44 md:w-auto shrink-0">
              <StatCard
                icon={CalendarClock}
                label="Próximo Prazo"
                value={stats.upcoming[0]?.nome || "—"}
                subtitle={stats.upcoming[0]?.prazo ? formatBR(stats.upcoming[0].prazo) : undefined}
              />
            </div>
            <div className="w-44 md:w-auto shrink-0">
              <StatCard
                icon={Wallet}
                label="Total Restante a Pagar"
                value={fmtBRL(totalFaltante(items))}
                subtitle={`em ${stats.itemsAberto} ${stats.itemsAberto === 1 ? "item em aberto" : "itens em aberto"}`}
              />
            </div>
            <div className="w-44 md:w-auto shrink-0">
              <div className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={16} />
                  <span className="text-xs font-body uppercase tracking-wider">Próxima Parcela</span>
                </div>
                {stats.nextP ? (
                  <>
                    <p className="font-accent text-2xl text-foreground">{fmtBRL(stats.nextP.valor)}</p>
                    <p className="text-xs font-body text-muted-foreground">
                      {stats.nextP.itemNome} — vence em {stats.nextPDays} dia(s)
                    </p>
                  </>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">Nenhuma parcela futura cadastrada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly preview */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading text-lg text-foreground">Próximos meses</h2>
          <span className="text-xs text-muted-foreground font-body">3 meses</span>
        </div>
        <MonthlyExpenseChart compact monthsWindow={3} />
      </div>

      {/* Overdue Warning */}
      {stats.overdue.length > 0 && (
        <div className="glass-card p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-destructive" />
            <span className="text-sm font-body text-destructive font-medium">
              {stats.overdue.length} {stats.overdue.length === 1 ? "item atrasado" : "itens atrasados"}
            </span>
          </div>
          <div className="space-y-2">
            {stats.overdue.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm font-body">
                <span className="text-foreground">{CATEGORIA_ICONS[item.categoria]} {item.nome}</span>
                <span className="text-destructive text-xs">
                  Venceu em {formatBR(item.prazo!)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      <div className="glass-card p-6">
        <h2 className="font-heading text-xl text-foreground mb-4">Próximos Prazos</h2>
        {stats.upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm font-body">Nenhum prazo próximo 🎉</p>
        ) : (
          <div className="space-y-3">
            {stats.upcoming.map((item, i) => (
              <motion.div
                key={item.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORIA_ICONS[item.categoria]}</span>
                  <div>
                    <p className="text-sm text-foreground font-body">{item.nome}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-body ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-accent text-primary">
                    {format(parseISO(item.prazo!), "dd MMM", { locale: ptBR })}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-body">
                    {daysUntil(item.prazo!)} dias
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

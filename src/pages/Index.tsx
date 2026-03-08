import { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Target, CheckCircle, CalendarClock, AlertTriangle } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import ProgressRing from "@/components/ProgressRing";
import StatCard from "@/components/StatCard";
import { CATEGORIA_ICONS, STATUS_COLORS, STATUS_LABELS } from "@/types/wedding";
import { differenceInDays, format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { items, config } = useWedding();

  const stats = useMemo(() => {
    const totalGasto = items.reduce((s, i) => s + i.valorPago, 0);
    const totalPrevisto = items.reduce((s, i) => s + i.valorTotal, 0);
    const concluidos = items.filter(i => i.status === "concluido").length;
    const daysLeft = differenceInDays(parseISO(config.dataCasamento), new Date());

    const upcoming = items
      .filter(i => i.prazo && !isPast(parseISO(i.prazo)) && i.status !== "concluido")
      .sort((a, b) => a.prazo!.localeCompare(b.prazo!))
      .slice(0, 5);

    const overdue = items.filter(i => i.prazo && isPast(parseISO(i.prazo)) && i.status !== "concluido");

    const progress = items.length > 0 ? (concluidos / items.length) * 100 : 0;

    return { totalGasto, totalPrevisto, concluidos, daysLeft, upcoming, overdue, progress };
  }, [items, config]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-8 animate-fade-in">
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
          <ProgressRing progress={stats.progress} />
        </motion.div>

        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Gasto" value={fmt(stats.totalGasto)} />
          <StatCard icon={Target} label="Total Previsto" value={fmt(stats.totalPrevisto)} />
          <StatCard icon={CheckCircle} label="Concluídos" value={`${stats.concluidos}/${items.length}`} />
          <StatCard
            icon={CalendarClock}
            label="Próximo Prazo"
            value={stats.upcoming[0]?.nome || "—"}
            subtitle={stats.upcoming[0]?.prazo ? format(parseISO(stats.upcoming[0].prazo), "dd/MM/yyyy") : undefined}
          />
        </div>
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
                  Venceu em {format(parseISO(item.prazo!), "dd/MM/yyyy")}
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
                    {differenceInDays(parseISO(item.prazo!), new Date())} dias
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

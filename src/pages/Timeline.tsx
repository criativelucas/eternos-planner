import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useWedding } from "@/contexts/WeddingContext";
import { CATEGORIA_ICONS, STATUS_LABELS } from "@/types/wedding";
import { format, parseISO, isPast, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Heart, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { allParcelas, parcelaColor } from "@/lib/finance";
import { formatBR } from "@/lib/date";

interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  status: string;
  done: boolean;
}

const Timeline = () => {
  const { items, config } = useWedding();
  const [historyOpen, setHistoryOpen] = useState(false);

  const { futureGroups, historico } = useMemo(() => {
    const today = startOfDay(new Date());
    const events: TimelineEvent[] = [];

    items.filter(i => i.prazo).forEach(i => {
      const done = i.status === "concluido";
      const overdue = isPast(parseISO(i.prazo!)) && !done;
      const days = differenceInDays(parseISO(i.prazo!), today);
      let color = "#6B7280";
      if (done) color = "#10B981";
      else if (overdue) color = "#EF4444";
      else if (days <= 7) color = "#F59E0B";
      else if (days <= 30) color = "#C9956A";
      events.push({
        id: `item-${i.id}`,
        date: i.prazo!,
        label: i.nome,
        sublabel: `Prazo · ${i.fornecedor || i.categoria}`,
        icon: CATEGORIA_ICONS[i.categoria],
        color,
        status: STATUS_LABELS[i.status],
        done,
      });
    });

    allParcelas(items).filter(p => p.dataVencimento).forEach(p => {
      events.push({
        id: `parc-${p.itemId}-${p.numero}`,
        date: p.dataVencimento,
        label: `${p.itemNome} — Parcela ${p.numero}`,
        sublabel: `Parcela · R$ ${p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        icon: CATEGORIA_ICONS[p.categoria as keyof typeof CATEGORIA_ICONS] || "💳",
        color: parcelaColor(p),
        status: p.pago ? "Pago" : "Pendente",
        done: p.pago,
      });
    });

    events.sort((a, b) => a.date.localeCompare(b.date));

    const future: TimelineEvent[] = [];
    const past: TimelineEvent[] = [];
    events.forEach(ev => {
      const d = parseISO(ev.date);
      if (d >= today && !ev.done) future.push(ev);
      else if (ev.done) past.push(ev);
      else if (d >= today) future.push(ev);
      else past.push(ev); // overdue & not done → historic (also avoids cluttering future)
    });

    const futureGroups: Record<string, TimelineEvent[]> = {};
    future.forEach(ev => {
      const key = format(parseISO(ev.date), "MMMM yyyy", { locale: ptBR });
      if (!futureGroups[key]) futureGroups[key] = [];
      futureGroups[key].push(ev);
    });
    return { futureGroups, historico: past };
  }, [items]);

  const months = Object.keys(futureGroups);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="font-heading text-3xl text-foreground">Linha do Tempo</h1>

      {months.length === 0 && historico.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-heading text-xl text-foreground">Nenhum prazo definido</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Adicione prazos e parcelas aos seus itens.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />

          {months.map((month, mi) => (
            <div key={month} className="mb-8">
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="w-3 h-3 rounded-full gradient-rose z-10 relative left-[10px] md:left-[18px]" />
                <h2 className="font-heading text-lg text-primary capitalize ml-4">{month}</h2>
              </div>

              <div className="ml-10 md:ml-14 space-y-3">
                {futureGroups[month].map((ev, i) => {
                  const overdue = ev.color === "#EF4444";
                  return (
                    <motion.div
                      key={ev.id}
                      className={`glass-card p-4 ${overdue ? "border-destructive/40" : ""}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (mi * 0.05) + (i * 0.03) }}
                      style={{ borderLeft: `3px solid ${ev.color}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{ev.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-body text-sm text-foreground font-medium">{ev.label}</p>
                              {overdue && <AlertTriangle size={14} className="text-destructive" />}
                            </div>
                            <p className="text-xs text-muted-foreground font-body">{ev.sublabel}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-body" style={{ background: `${ev.color}33`, color: ev.color }}>
                            {ev.status}
                          </span>
                          <p className="text-xs text-muted-foreground font-body mt-1">
                            {formatBR(ev.date)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Wedding day pinned event */}
          {config.dataCasamento && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="w-5 h-5 rounded-full z-10 relative left-[5px] md:left-[13px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d4af37, #f5c462)" }}>
                  <Heart size={10} className="text-white" />
                </div>
                <h2 className="font-heading text-lg ml-4" style={{ color: "#d4af37" }}>O Grande Dia ✨</h2>
              </div>
              <div className="ml-10 md:ml-14">
                <motion.div
                  className="glass-card p-6 text-center"
                  style={{ borderLeft: "4px solid #d4af37", background: "linear-gradient(135deg, hsl(var(--card)), hsl(27 47% 60% / 0.05))" }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-3xl mb-2">💍</p>
                  <p className="font-heading text-2xl text-foreground">Dia do Casamento</p>
                  <p className="font-accent text-lg text-primary mt-1">
                    {format(parseISO(config.dataCasamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-2">{config.nomeNoiva} & {config.nomeNoivo}</p>
                </motion.div>
              </div>
            </div>
          )}

          {/* Histórico (collapsed by default) */}
          {historico.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setHistoryOpen(o => !o)}
                className="flex items-center gap-3 mb-4 relative w-full text-left"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500 z-10 relative left-[10px] md:left-[18px]" />
                <h2 className="font-heading text-lg text-emerald-600 dark:text-emerald-400 ml-4 flex items-center gap-2">
                  Histórico ({historico.length})
                  {historyOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </h2>
              </button>
              {historyOpen && (
                <div className="ml-10 md:ml-14 space-y-3">
                  {historico.map((ev, i) => (
                    <motion.div
                      key={ev.id}
                      className="glass-card p-4 border-emerald-500/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderLeft: "3px solid #10B981" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{ev.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-body text-sm text-foreground font-medium">{ev.label}</p>
                              <CheckCircle2 size={14} className="text-emerald-500" />
                            </div>
                            <p className="text-xs text-muted-foreground font-body">{ev.sublabel}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-body bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            ✅ {ev.status}
                          </span>
                          <p className="text-xs text-muted-foreground font-body mt-1">
                            {formatBR(ev.date)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;

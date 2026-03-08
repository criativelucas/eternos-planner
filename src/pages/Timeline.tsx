import { useMemo } from "react";
import { motion } from "framer-motion";
import { useWedding } from "@/contexts/WeddingContext";
import { CATEGORIA_ICONS, STATUS_COLORS, STATUS_LABELS } from "@/types/wedding";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";

const Timeline = () => {
  const { items } = useWedding();

  const grouped = useMemo(() => {
    const withDeadline = items
      .filter(i => i.prazo)
      .sort((a, b) => a.prazo!.localeCompare(b.prazo!));

    const groups: Record<string, typeof withDeadline> = {};
    withDeadline.forEach(item => {
      const key = format(parseISO(item.prazo!), "MMMM yyyy", { locale: ptBR });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [items]);

  const months = Object.keys(grouped);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="font-heading text-3xl text-foreground">Linha do Tempo</h1>

      {months.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-heading text-xl text-foreground">Nenhum prazo definido</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Adicione prazos aos seus itens para visualizar a linha do tempo.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />

          {months.map((month, mi) => (
            <div key={month} className="mb-8">
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="w-3 h-3 rounded-full gradient-rose z-10 relative left-[10px] md:left-[18px]" />
                <h2 className="font-heading text-lg text-primary capitalize ml-4">{month}</h2>
              </div>

              <div className="ml-10 md:ml-14 space-y-3">
                {grouped[month].map((item, i) => {
                  const overdue = isPast(parseISO(item.prazo!)) && item.status !== "concluido";
                  return (
                    <motion.div
                      key={item.id}
                      className={`glass-card p-4 ${overdue ? "border-destructive/40" : ""}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (mi * 0.1) + (i * 0.05) }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{CATEGORIA_ICONS[item.categoria]}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-body text-sm text-foreground font-medium">{item.nome}</p>
                              {overdue && <AlertTriangle size={14} className="text-destructive" />}
                            </div>
                            <p className="text-xs text-muted-foreground font-body">
                              {item.fornecedor || item.categoria}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-body ${STATUS_COLORS[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                          <p className="text-xs text-muted-foreground font-body mt-1">
                            {format(parseISO(item.prazo!), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline;

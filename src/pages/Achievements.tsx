import { useMemo } from "react";
import { motion } from "framer-motion";
import { useWedding } from "@/contexts/WeddingContext";
import { Lock } from "lucide-react";
import { isPast, parseISO } from "date-fns";
import { overdueParcelas, allParcelas } from "@/lib/finance";

interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  check: (items: any[], config: any) => boolean;
}

const BADGES: Badge[] = [
  { id: "first", emoji: "🌹", name: "Primeiros Passos", description: "Primeiro item adicionado", check: (items) => items.length > 0 },
  { id: "saver", emoji: "💰", name: "Poupador", description: "Pagou a primeira parcela", check: (items) => items.some((i: any) => i.parcelas.some((p: any) => p.pago)) },
  { id: "organized", emoji: "📋", name: "Organizado", description: "10+ itens cadastrados", check: (items) => items.length >= 10 },
  { id: "halfway", emoji: "✅", name: "Meio Caminho", description: "50% dos itens concluídos", check: (items) => items.length > 0 && items.filter((i: any) => i.status === "concluido").length >= items.length * 0.5 },
  { id: "almost", emoji: "🎊", name: "Quase Lá", description: "80% dos itens concluídos", check: (items) => items.length > 0 && items.filter((i: any) => i.status === "concluido").length >= items.length * 0.8 },
  { id: "done", emoji: "💍", name: "Tudo Pronto", description: "100% dos itens concluídos", check: (items) => items.length > 0 && items.every((i: any) => i.status === "concluido") },
  { id: "punctual", emoji: "📅", name: "Pontual", description: "Nenhum prazo vencido", check: (items) => !items.some((i: any) => i.prazo && isPast(parseISO(i.prazo)) && i.status !== "concluido") },
  { id: "budget", emoji: "🎯", name: "Dentro do Orçamento", description: "Gastos abaixo do planejado", check: (items, config) => items.reduce((s: number, i: any) => s + i.valorPago, 0) <= config.orcamentoTotal },
  { id: "no_late", emoji: "📅", name: "Sem Atrasos", description: "Nenhuma parcela vencida", check: (items) => overdueParcelas(items).length === 0 && allParcelas(items).length > 0 },
  { id: "loyal", emoji: "💳", name: "Parceiro Fiel", description: "5+ parcelas pagas", check: (items) => allParcelas(items).filter(p => p.pago).length >= 5 },
  { id: "timeline_full", emoji: "🗓️", name: "Linha do Tempo Completa", description: "Todos os itens têm prazo", check: (items) => items.length > 0 && items.every((i: any) => !!i.prazo) },
  { id: "ai_explorer", emoji: "🤖", name: "Explorador IA", description: "Usou o assistente 3+ vezes", check: () => Number(localStorage.getItem("aiUsageCount") || "0") >= 3 },
  { id: "budget_master", emoji: "💰", name: "Orçamento Master", description: "Total gasto abaixo do orçamento", check: (items, config) => config.orcamentoTotal > 0 && items.reduce((s: number, i: any) => s + i.valorPago, 0) < config.orcamentoTotal },
  { id: "dream", emoji: "🌟", name: "Casamento dos Sonhos", description: "Todos os campos preenchidos", check: (items) => items.length > 0 && items.every((i: any) => i.nome && i.categoria && i.fornecedor && i.valorTotal > 0 && i.prazo && i.notas) },
];

const Achievements = () => {
  const { items, config } = useWedding();

  const unlockedIds = useMemo(() => {
    return new Set(BADGES.filter(b => b.check(items, config)).map(b => b.id));
  }, [items, config]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl text-foreground">Conquistas</h1>
        <p className="text-muted-foreground text-sm font-body mt-1">
          {unlockedIds.size} de {BADGES.length} conquistas desbloqueadas
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BADGES.map((badge, i) => {
          const unlocked = unlockedIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              className={`glass-card p-6 text-center ${unlocked ? "glow-primary" : "opacity-50"}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: unlocked ? 1 : 0.5 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${unlocked ? "gradient-rose" : "bg-border"}`}>
                {unlocked ? badge.emoji : <Lock size={20} className="text-muted-foreground" />}
              </div>
              <p className="font-heading text-sm text-foreground">{badge.name}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">{badge.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;

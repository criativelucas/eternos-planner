import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ChevronDown, ChevronUp, Trash2, Pencil } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import { CATEGORIAS, CATEGORIA_ICONS, STATUS_COLORS, STATUS_LABELS, Categoria, Status } from "@/types/wedding";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import EditItemDialog from "@/components/EditItemDialog";
import { WeddingItem } from "@/types/wedding";

const Items = () => {
  const { items, deleteItem, updateItem } = useWedding();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Categoria | "">("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<WeddingItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat && i.categoria !== filterCat) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      return true;
    });
  }, [items, search, filterCat, filterStatus]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pct = (paid: number, total: number) => total > 0 ? Math.min((paid / total) * 100, 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-3xl text-foreground">Itens do Casamento</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar itens..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value as Categoria | "")}
              className="bg-secondary border border-border rounded-lg pl-8 pr-8 py-2.5 text-sm font-body text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Categoria</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Status | "")}
            className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm font-body text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Status</option>
            {(["pendente", "em_andamento", "concluido", "cancelado"] as Status[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">🌸</p>
          <p className="font-heading text-xl text-foreground">Nenhum item encontrado</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Use o assistente IA para adicionar itens!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  <span className="text-2xl">{CATEGORIA_ICONS[item.categoria]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body font-medium text-foreground truncate">{item.nome}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-body ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {item.fornecedor || item.categoria}
                      {item.prazo && ` · Prazo: ${format(parseISO(item.prazo), "dd/MM/yyyy")}`}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-rose rounded-full transition-all duration-500"
                          style={{ width: `${pct(item.valorPago, item.valorTotal)}%` }}
                        />
                      </div>
                      <span className="text-xs font-accent text-primary whitespace-nowrap">
                        {fmt(item.valorPago)} / {fmt(item.valorTotal)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setEditOpen(true);
                      }}
                      className="text-muted-foreground hover:text-primary p-1"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      {expanded === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        deleteItem(item.id);
                        toast({ title: "Item removido", description: `"${item.nome}" foi removido.` });
                      }}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded parcelas */}
                <AnimatePresence>
                  {expanded === item.id && item.parcelas.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="p-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-2">Parcelas</p>
                        {item.parcelas.map(p => (
                          <div key={p.numero} className="flex items-center justify-between text-sm font-body">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const newParcelas = item.parcelas.map(pp =>
                                    pp.numero === p.numero ? { ...pp, pago: !pp.pago } : pp
                                  );
                                  const newPago = newParcelas.filter(pp => pp.pago).reduce((s, pp) => s + pp.valor, 0);
                                  updateItem(item.id, {
                                    parcelas: newParcelas,
                                    valorPago: newPago,
                                    status: newPago >= item.valorTotal ? "concluido" : "em_andamento",
                                  });
                                }}
                                className={`w-4 h-4 rounded border ${p.pago ? "bg-primary border-primary" : "border-border"} flex items-center justify-center`}
                              >
                                {p.pago && <span className="text-[10px] text-primary-foreground">✓</span>}
                              </button>
                              <span className={`${p.pago ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                Parcela {p.numero} — {fmt(p.valor)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(p.dataVencimento), "dd/MM/yyyy")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <EditItemDialog item={editItem} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
};

export default Items;

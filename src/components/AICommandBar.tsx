import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, Edit3, Loader2 } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import { WeddingItem, CATEGORIA_ICONS, STATUS_LABELS } from "@/types/wedding";
import { useToast } from "@/hooks/use-toast";

const PLACEHOLDERS = [
  'Contratei o fotógrafo por R$4.500, dei entrada de R$1.500...',
  'Paguei a 2ª parcela do buffet de R$800',
  'O vestido ficou para maio, custa R$3.200',
  'Reservei o DJ por R$2.000, 4x de R$500',
  'Comprei os convites por R$800, já paguei tudo',
];

function mockParseInput(input: string): Partial<WeddingItem> {
  const lower = input.toLowerCase();
  const moneyRegex = /r\$\s?([\d.,]+)/gi;
  const values: number[] = [];
  let m;
  while ((m = moneyRegex.exec(input)) !== null) {
    values.push(parseFloat(m[1].replace(".", "").replace(",", ".")));
  }

  const categoriaMap: Record<string, WeddingItem["categoria"]> = {
    buffet: "Buffet", fotógrafo: "Foto/Vídeo", foto: "Foto/Vídeo", vídeo: "Foto/Vídeo",
    vestido: "Vestuário", traje: "Vestuário", decoração: "Decoração", dj: "Música",
    música: "Música", banda: "Música", convite: "Convites", lua: "Lua de Mel",
    aliança: "Alianças", bolo: "Bolo", flor: "Flores", flores: "Flores",
    transporte: "Transporte", carro: "Transporte", beleza: "Beleza", make: "Beleza",
  };

  let categoria: WeddingItem["categoria"] = "Outros";
  for (const [key, val] of Object.entries(categoriaMap)) {
    if (lower.includes(key)) { categoria = val; break; }
  }

  const parcelasMatch = lower.match(/(\d+)\s*(?:x|parcela|vezes)/);
  const numParcelas = parcelasMatch ? parseInt(parcelasMatch[1]) : 0;

  const valorTotal = values[0] || 0;
  const valorPago = values.length > 1 ? values[1] : 0;

  const parcelas: WeddingItem["parcelas"] = [];
  if (numParcelas > 0) {
    const valorParcela = values.length > 1 ? values[1] : valorTotal / numParcelas;
    for (let i = 0; i < numParcelas; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i + 1);
      parcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: d.toISOString().split("T")[0],
        pago: false,
      });
    }
  }

  // Try to extract a name
  let nome = input.split(/[,.]/).at(0)?.trim() || categoria;
  if (nome.length > 50) nome = nome.substring(0, 50);

  return {
    nome,
    categoria,
    valorTotal,
    valorPago,
    parcelas,
    status: valorPago >= valorTotal && valorTotal > 0 ? "concluido" : "em_andamento",
    prioridade: "media",
    notas: input,
  };
}

const AICommandBar = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Partial<WeddingItem> | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const { addItem } = useWedding();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") { setOpen(false); setPreview(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const parsed = mockParseInput(input);
    setPreview(parsed);
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!preview) return;
    const item: WeddingItem = {
      id: crypto.randomUUID(),
      nome: preview.nome || "Novo Item",
      categoria: preview.categoria || "Outros",
      fornecedor: preview.fornecedor || null,
      valorTotal: preview.valorTotal || 0,
      valorPago: preview.valorPago || 0,
      parcelas: preview.parcelas || [],
      prazo: preview.prazo || null,
      status: preview.status || "pendente",
      prioridade: preview.prioridade || "media",
      notas: preview.notas || null,
      criadoEm: new Date().toISOString().split("T")[0],
    };
    addItem(item);
    toast({ title: "Item adicionado! ✨", description: `"${item.nome}" foi adicionado ao planejamento.` });
    setPreview(null);
    setInput("");
    setOpen(false);
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-6 glass-card p-4 flex items-center gap-3 cursor-text hover:border-primary/30 transition-colors group"
      >
        <Sparkles size={18} className="text-primary group-hover:animate-pulse-glow" />
        <span className="text-muted-foreground text-sm font-body flex-1 text-left truncate">
          {PLACEHOLDERS[placeholderIdx]}
        </span>
        <kbd className="hidden md:inline text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-body">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setOpen(false); setPreview(null); }}
          >
            <motion.div
              className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full md:max-w-xl p-6 max-h-[80vh] overflow-y-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-primary" />
                  <h3 className="font-heading text-xl text-foreground">Assistente IA</h3>
                </div>
                <button onClick={() => { setOpen(false); setPreview(null); }} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {!preview ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground font-body">
                    Conte o que está planejando em linguagem natural:
                  </p>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={PLACEHOLDERS[placeholderIdx]}
                    className="w-full bg-secondary border border-border rounded-lg p-4 text-foreground font-body text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !input.trim()}
                    className="w-full gradient-rose text-primary-foreground font-body font-medium py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {loading ? "Interpretando..." : "Interpretar com IA"}
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <p className="text-sm text-muted-foreground font-body">Está correto? Adicionar ao planejamento?</p>
                  <div className="bg-secondary rounded-lg p-4 space-y-3 border border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORIA_ICONS[preview.categoria || "Outros"]}</span>
                      <div>
                        <p className="font-heading text-lg text-foreground">{preview.nome}</p>
                        <p className="text-xs text-muted-foreground font-body">{preview.categoria}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm font-body">
                      <div><span className="text-muted-foreground">Total:</span> <span className="text-foreground">{formatCurrency(preview.valorTotal || 0)}</span></div>
                      <div><span className="text-muted-foreground">Pago:</span> <span className="text-primary">{formatCurrency(preview.valorPago || 0)}</span></div>
                      <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground">{STATUS_LABELS[preview.status || "pendente"]}</span></div>
                      <div><span className="text-muted-foreground">Parcelas:</span> <span className="text-foreground">{preview.parcelas?.length || 0}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirm}
                      className="flex-1 gradient-rose text-primary-foreground font-body font-medium py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Confirmar
                    </button>
                    <button
                      onClick={() => setPreview(null)}
                      className="flex-1 bg-secondary text-foreground font-body font-medium py-3 rounded-lg flex items-center justify-center gap-2 border border-border hover:bg-surface-hover transition-colors"
                    >
                      <Edit3 size={18} /> Editar
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICommandBar;

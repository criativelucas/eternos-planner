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

function parseBRLValue(raw: string): number {
  // Handle Brazilian format: "4.500" = 4500, "4.500,00" = 4500, "800" = 800, "3.200" = 3200
  let cleaned = raw.trim();
  // If has both dot and comma, dot is thousands separator
  if (cleaned.includes(".") && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    // Only comma = decimal separator
    cleaned = cleaned.replace(",", ".");
  } else if (cleaned.includes(".")) {
    // Only dot: if 3 digits after dot, it's thousands separator
    const parts = cleaned.split(".");
    if (parts[1]?.length === 3) {
      cleaned = cleaned.replace(".", "");
    }
  }
  return parseFloat(cleaned) || 0;
}

function mockParseInput(input: string): Partial<WeddingItem> {
  const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const original = input.toLowerCase();

  console.log("[AI Parser] Input:", input);

  // Extract all monetary values - handle R$4.500 / R$ 800 / 4500 reais / 800,00
  const moneyRegex = /r\$\s?([\d.,]+)/gi;
  const values: number[] = [];
  let m;
  while ((m = moneyRegex.exec(input)) !== null) {
    values.push(parseBRLValue(m[1]));
  }

  // If no R$ found, try to find standalone large numbers (likely prices)
  if (values.length === 0) {
    const numRegex = /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\b/g;
    let nm;
    while ((nm = numRegex.exec(input)) !== null) {
      const val = parseBRLValue(nm[1]);
      if (val >= 50) values.push(val); // Only consider values >= 50 as prices
    }
  }

  console.log("[AI Parser] Values found:", values);

  // Find installment patterns: "3x de R$600", "4x de R$500", "faltam 3x"
  const parcelaValorMatch = original.match(/(\d+)\s*(?:x|parcelas?|vezes)\s*(?:de\s*)?r?\$?\s?([\d.,]+)/i);
  const parcelasOnlyMatch = original.match(/(\d+)\s*(?:x|parcelas?|vezes)/);

  // Category detection - search in normalized (no accents) text
  const categoriaMap: [string[], WeddingItem["categoria"]][] = [
    [["buffet", "gastronomia", "comida", "jantar", "almoco"], "Buffet"],
    [["fotografo", "fotografia", "foto", "video", "filmagem"], "Foto/Vídeo"],
    [["vestido", "traje", "roupa", "terno"], "Vestuário"],
    [["decoracao", "decor", "arranjo"], "Decoração"],
    [["dj", "musica", "banda", "som", "sonorizacao"], "Música"],
    [["convite", "papelaria", "save the date"], "Convites"],
    [["lua de mel", "viagem", "honeymoon"], "Lua de Mel"],
    [["alianca", "anel", "joias", "joia"], "Alianças"],
    [["bolo", "doce", "doceria", "confeitaria"], "Bolo"],
    [["flor", "flores", "florista", "buque"], "Flores"],
    [["transporte", "carro", "limousine", "limusine"], "Transporte"],
    [["beleza", "make", "maquiagem", "cabelo", "penteado"], "Beleza"],
    [["venue", "espaco", "salao", "igreja", "cerimonia", "local", "chacara", "sitio", "fazenda"], "Venue"],
  ];

  let categoria: WeddingItem["categoria"] = "Outros";
  for (const [keywords, cat] of categoriaMap) {
    if (keywords.some(k => lower.includes(k))) {
      categoria = cat;
      break;
    }
  }

  console.log("[AI Parser] Categoria:", categoria);

  // Detect installments
  let numParcelas = 0;
  let valorParcela = 0;

  if (parcelaValorMatch) {
    numParcelas = parseInt(parcelaValorMatch[1]);
    valorParcela = parseBRLValue(parcelaValorMatch[2]);
  } else if (parcelasOnlyMatch) {
    numParcelas = parseInt(parcelasOnlyMatch[1]);
  }

  // Determine valorTotal and valorPago from context
  let valorTotal = 0;
  let valorPago = 0;

  const hasPaguei = /paguei|pago|entrada|dei|pagou|quitei|depositei/.test(original);
  const hasFaltam = /faltam?|restam?|restante|falta/.test(original);
  const hasCusta = /custa|custou|valor|preco|preço|por|total|cobra|cobrou/.test(original);
  const hasTudo = /tudo|total|quitei|completo|inteiro|a vista|à vista/.test(original);
  const hasContratei = /contratei|reservei|fechei|comprei|acertei|combinei/.test(original);

  if (values.length >= 2 && hasFaltam && numParcelas > 0) {
    // "Paguei R$800, faltam 3x de R$600"
    valorPago = values[0];
    valorParcela = valorParcela || values[1];
    valorTotal = valorPago + (numParcelas * valorParcela);
  } else if (values.length >= 2 && (hasPaguei || hasContratei)) {
    // "Contratei por R$4.500, dei entrada de R$1.500"
    if (values[0] > values[1]) {
      valorTotal = values[0];
      valorPago = values[1];
    } else {
      valorPago = values[0];
      valorTotal = values[1];
    }
  } else if (values.length >= 2) {
    // Two values, first is likely total
    valorTotal = Math.max(...values);
    valorPago = Math.min(...values);
  } else if (values.length === 1 && hasPaguei && hasTudo) {
    // "Comprei os convites por R$800, já paguei tudo"
    valorTotal = values[0];
    valorPago = values[0];
  } else if (values.length === 1 && hasPaguei && !hasCusta && !hasContratei) {
    // "Paguei a 2ª parcela do buffet de R$800"
    valorPago = values[0];
    valorTotal = values[0];
  } else if (values.length === 1 && numParcelas > 0 && valorParcela > 0) {
    valorTotal = numParcelas * valorParcela;
  } else if (values.length === 1) {
    valorTotal = values[0];
    if (hasPaguei) valorPago = values[0];
  } else if (numParcelas > 0 && valorParcela > 0) {
    valorTotal = numParcelas * valorParcela;
  }

  // Build parcelas
  const parcelas: WeddingItem["parcelas"] = [];
  if (numParcelas > 0) {
    const vp = valorParcela || (valorTotal > 0 ? valorTotal / numParcelas : 0);
    for (let i = 0; i < numParcelas; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i + 1);
      parcelas.push({
        numero: i + 1,
        valor: vp,
        dataVencimento: d.toISOString().split("T")[0],
        pago: false,
      });
    }
  }

  // Extract name from sentence
  let nome = "";
  const nomePatterns = [
    /(?:contratei|reservei|fechei|comprei|paguei|acertei|combinei)\s+(?:o|a|os|as|um|uma)?\s*(.+?)(?:\s+(?:por|de|no valor|,|$))/i,
    /(?:o|a)\s+(.+?)(?:\s+(?:custa|custou|ficou|fica|cobra|por)\s)/i,
    /^(.+?)(?:\s+(?:custa|custou|ficou|por|de|,)\s)/i,
  ];
  for (const pattern of nomePatterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim().replace(/^(o|a|os|as|do|da|dos|das)\s+/i, "");
      if (candidate.length >= 2 && candidate.length < 50) {
        nome = candidate;
        break;
      }
    }
  }
  if (!nome || nome.length < 2) nome = categoria;
  nome = nome.charAt(0).toUpperCase() + nome.slice(1);

  const status = valorPago >= valorTotal && valorTotal > 0 ? "concluido" as const
    : valorPago > 0 ? "em_andamento" as const
    : "pendente" as const;

  const result = {
    nome,
    categoria,
    valorTotal,
    valorPago,
    parcelas,
    status,
    prioridade: "media" as const,
    notas: input,
  };

  console.log("[AI Parser] Result:", result);
  return result;
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

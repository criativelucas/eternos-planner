import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Plus, Sparkles, Loader2 } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import { CATEGORIA_ICONS, Categoria, Prioridade } from "@/types/wedding";
import { fmtBRL } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  nome: string;
  categoria: Categoria;
  valorEstimado: number;
  prioridade: Prioridade;
  motivo: string;
}

const CACHE_KEY = "aiSuggestionsCache";
const TTL_MS = 10 * 60 * 1000;

const PRIO_DOT: Record<Prioridade, string> = {
  alta: "bg-red-500",
  media: "bg-yellow-500",
  baixa: "bg-gray-400",
};

const AISuggestions = () => {
  const { items } = useWedding();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { toast } = useToast();

  const fetchSuggestions = useCallback(async (force = false) => {
    if (!force) {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const { ts, data } = JSON.parse(raw);
          if (Date.now() - ts < TTL_MS) {
            setSuggestions(data);
            return;
          }
        }
      } catch {}
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-suggestions", {
        body: { items: items.map(i => ({ nome: i.nome, categoria: i.categoria })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const sug: Suggestion[] = data?.sugestoes || [];
      setSuggestions(sug);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: sug }));
    } catch (e: any) {
      toast({ title: "Erro nas sugestões", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }, [items, toast]);

  useEffect(() => { fetchSuggestions(); }, []); // eslint-disable-line

  const addToPlan = (s: Suggestion) => {
    window.dispatchEvent(new CustomEvent("ai-commandbar-open", {
      detail: { text: `Quero adicionar ${s.nome} ao planejamento, valor estimado R$${s.valorEstimado}` }
    }));
    // track usage
    const c = Number(localStorage.getItem("aiUsageCount") || "0") + 1;
    localStorage.setItem("aiUsageCount", String(c));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="font-heading text-xl text-foreground">Sugestões da IA</h2>
        </div>
        <button
          onClick={() => fetchSuggestions(true)}
          disabled={loading}
          className="flex items-center gap-2 text-xs px-3 py-2 bg-secondary border border-border rounded-lg font-body hover:bg-surface-hover disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-4 h-28 animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-muted-foreground font-body">
          <Loader2 className="animate-spin mx-auto mb-2" size={20} />
          Carregando sugestões...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <div key={i} className="glass-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CATEGORIA_ICONS[s.categoria] || "📦"}</span>
                  <div>
                    <p className="font-body font-medium text-foreground text-sm">{s.nome}</p>
                    <p className="text-xs text-muted-foreground">~{fmtBRL(s.valorEstimado)}</p>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${PRIO_DOT[s.prioridade] || "bg-gray-400"} mt-2`} title={s.prioridade} />
              </div>
              <p className="text-xs italic text-muted-foreground font-body">{s.motivo}</p>
              <button
                onClick={() => addToPlan(s)}
                className="self-start mt-1 text-xs flex items-center gap-1 text-primary hover:underline font-body"
              >
                <Plus size={12} /> Adicionar ao Planejamento
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AISuggestions;

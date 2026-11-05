import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WeddingItem, WeddingConfig, Parcela } from "@/types/wedding";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WeddingContextType {
  items: WeddingItem[];
  config: WeddingConfig;
  configId: string | null;
  loading: boolean;
  loadError: boolean;
  addItem: (item: WeddingItem) => Promise<boolean>;
  updateItem: (id: string, updates: Partial<WeddingItem>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  updateConfig: (updates: Partial<WeddingConfig>) => Promise<boolean>;
  refetch: () => void;
}

const WeddingContext = createContext<WeddingContextType | null>(null);

function dbToItem(row: any): WeddingItem {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    fornecedor: row.fornecedor,
    valorTotal: Number(row.valor_total),
    valorPago: Number(row.valor_pago),
    parcelas: (row.parcelas as Parcela[]) || [],
    prazo: row.prazo,
    status: row.status,
    prioridade: row.prioridade,
    notas: row.notas,
    criadoEm: row.created_at?.split("T")[0] || "",
  };
}

function dbToConfig(row: any): WeddingConfig {
  return {
    nomeNoiva: row.nome_noiva,
    nomeNoivo: row.nome_noivo,
    dataCasamento: row.data_casamento,
    orcamentoTotal: Number(row.orcamento_total),
  };
}

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WeddingItem[]>([]);
  const [config, setConfig] = useState<WeddingConfig>({
    nomeNoiva: "Ana", nomeNoivo: "Pedro", dataCasamento: "2026-11-14", orcamentoTotal: 45000,
  });
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Serialize writes per item so an older request can't overwrite a newer edit.
  const writeQueue = React.useRef<Map<string, Promise<unknown>>>(new Map());
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(false);
    try {
      // First try to accept any pending invite
      await supabase.rpc("accept_couple_invite", { _user_id: user.id });

      // Get user's config id
      const { data: cfgId, error: cfgErr } = await supabase.rpc("get_user_config_id", { _user_id: user.id });
      if (cfgErr) throw cfgErr;

      if (cfgId) {
        const [configRes, itemsRes] = await Promise.all([
          supabase.from("wedding_config").select("*").eq("id", cfgId).single(),
          supabase.from("wedding_items").select("*").eq("config_id", cfgId).order("created_at", { ascending: false }),
        ]);

        if (configRes.error) throw configRes.error;
        if (itemsRes.error) throw itemsRes.error;
        if (configRes.data) {
          setConfig(dbToConfig(configRes.data));
          setConfigId(configRes.data.id);
        }
        if (itemsRes.data) setItems(itemsRes.data.map(dbToItem));
      } else {
        // Create new wedding config for this user
        const { data: newConfig, error } = await supabase.from("wedding_config").insert({
          user_id: user.id,
          nome_noiva: "Noiva",
          nome_noivo: "Noivo",
          data_casamento: "2026-12-31",
          orcamento_total: 50000,
        }).select().single();

        if (newConfig) {
          setConfig(dbToConfig(newConfig));
          setConfigId(newConfig.id);
          setItems([]);
        }
        if (error) console.error("Error creating config:", error);
      }
    } catch (e) {
      console.error("Error fetching data:", e);
      setLoadError(true);
      toast({ title: "Não foi possível carregar seus dados", description: "Verifique a conexão e recarregue a página.", variant: "destructive" });
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addItem = useCallback(async (item: WeddingItem) => {
    if (!configId) {
      toast({ title: "Erro ao salvar", description: "Seus dados ainda estão carregando. Tente de novo.", variant: "destructive" });
      return false;
    }
    setItems(prev => [item, ...prev]);

    const { error } = await supabase.from("wedding_items").insert({
      id: item.id,
      config_id: configId,
      nome: item.nome,
      categoria: item.categoria,
      fornecedor: item.fornecedor,
      valor_total: item.valorTotal,
      valor_pago: item.valorPago,
      parcelas: item.parcelas as any,
      prazo: item.prazo,
      status: item.status,
      prioridade: item.prioridade,
      notas: item.notas,
    });

    if (error) {
      console.error("Error adding item:", error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      setItems(prev => prev.filter(i => i.id !== item.id));
      return false;
    }
    return true;
  }, [configId, toast]);

  const updateItem = useCallback(async (id: string, updates: Partial<WeddingItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

    const dbUpdates: any = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria;
    if (updates.fornecedor !== undefined) dbUpdates.fornecedor = updates.fornecedor;
    if (updates.valorTotal !== undefined) dbUpdates.valor_total = updates.valorTotal;
    if (updates.valorPago !== undefined) dbUpdates.valor_pago = updates.valorPago;
    if (updates.parcelas !== undefined) dbUpdates.parcelas = updates.parcelas;
    if (updates.prazo !== undefined) dbUpdates.prazo = updates.prazo;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.prioridade !== undefined) dbUpdates.prioridade = updates.prioridade;
    if (updates.notas !== undefined) dbUpdates.notas = updates.notas;

    const prev = writeQueue.current.get(id) || Promise.resolve();
    const job = prev.then(() => supabase.from("wedding_items").update(dbUpdates).eq("id", id));
    writeQueue.current.set(id, job.catch(() => {}));
    const { error } = await job;
    if (error) {
      console.error("Error updating item:", error);
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      fetchData();
      return false;
    }
    return true;
  }, [toast, fetchData]);

  const deleteItem = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));

    const { error } = await supabase.from("wedding_items").delete().eq("id", id);
    if (error) {
      console.error("Error deleting item:", error);
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      fetchData();
      return false;
    }
    return true;
  }, [toast, fetchData]);

  const updateConfig = useCallback(async (updates: Partial<WeddingConfig>) => {
    if (!configId) {
      toast({ title: "Erro ao salvar", description: "Seus dados ainda estão carregando. Tente de novo.", variant: "destructive" });
      return false;
    }
    setConfig(prev => ({ ...prev, ...updates }));

    const dbUpdates: any = {};
    if (updates.nomeNoiva !== undefined) dbUpdates.nome_noiva = updates.nomeNoiva;
    if (updates.nomeNoivo !== undefined) dbUpdates.nome_noivo = updates.nomeNoivo;
    if (updates.dataCasamento !== undefined) dbUpdates.data_casamento = updates.dataCasamento;
    if (updates.orcamentoTotal !== undefined) dbUpdates.orcamento_total = updates.orcamentoTotal;

    const { error } = await supabase.from("wedding_config").update(dbUpdates).eq("id", configId);
    if (error) {
      console.error("Error updating config:", error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      fetchData();
      return false;
    }
    return true;
  }, [configId, toast, fetchData]);

  return (
    <WeddingContext.Provider value={{ items, config, configId, loading, loadError, addItem, updateItem, deleteItem, updateConfig, refetch: fetchData }}>
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding must be inside WeddingProvider");
  return ctx;
};

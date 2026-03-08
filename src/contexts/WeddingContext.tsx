import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WeddingItem, WeddingConfig } from "@/types/wedding";
import { seedItems, defaultConfig } from "@/data/seedData";

interface WeddingContextType {
  items: WeddingItem[];
  config: WeddingConfig;
  addItem: (item: WeddingItem) => void;
  updateItem: (id: string, updates: Partial<WeddingItem>) => void;
  deleteItem: (id: string) => void;
  updateConfig: (updates: Partial<WeddingConfig>) => void;
}

const WeddingContext = createContext<WeddingContextType | null>(null);

const ITEMS_KEY = "eternos_items";
const CONFIG_KEY = "eternos_config";

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WeddingItem[]>(() => {
    const stored = localStorage.getItem(ITEMS_KEY);
    return stored ? JSON.parse(stored) : seedItems;
  });

  const [config, setConfig] = useState<WeddingConfig>(() => {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : defaultConfig;
  });

  useEffect(() => { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }, [config]);

  const addItem = useCallback((item: WeddingItem) => {
    setItems(prev => [item, ...prev]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<WeddingItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateConfig = useCallback((updates: Partial<WeddingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <WeddingContext.Provider value={{ items, config, addItem, updateItem, deleteItem, updateConfig }}>
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding must be inside WeddingProvider");
  return ctx;
};

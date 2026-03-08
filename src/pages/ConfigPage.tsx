import { useState } from "react";
import { useWedding } from "@/contexts/WeddingContext";
import { useToast } from "@/hooks/use-toast";
import { Save, Download } from "lucide-react";

const ConfigPage = () => {
  const { config, updateConfig, items } = useWedding();
  const { toast } = useToast();
  const [form, setForm] = useState(config);

  const handleSave = () => {
    updateConfig(form);
    toast({ title: "Configurações salvas! ✨" });
  };

  const handleExport = () => {
    const csv = [
      ["Nome", "Categoria", "Fornecedor", "Valor Total", "Valor Pago", "Status", "Prazo", "Prioridade"].join(","),
      ...items.map(i =>
        [i.nome, i.categoria, i.fornecedor || "", i.valorTotal, i.valorPago, i.status, i.prazo || "", i.prioridade].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eternos-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Dados exportados! 📄" });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-lg">
      <h1 className="font-heading text-3xl text-foreground">Configurações</h1>

      <div className="glass-card p-6 space-y-5">
        <div>
          <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">Nome da Noiva</label>
          <input
            value={form.nomeNoiva}
            onChange={e => setForm({ ...form, nomeNoiva: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">Nome do Noivo</label>
          <input
            value={form.nomeNoivo}
            onChange={e => setForm({ ...form, nomeNoivo: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">Data do Casamento</label>
          <input
            type="date"
            value={form.dataCasamento}
            onChange={e => setForm({ ...form, dataCasamento: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">Orçamento Total (R$)</label>
          <input
            type="number"
            value={form.orcamentoTotal}
            onChange={e => setForm({ ...form, orcamentoTotal: Number(e.target.value) })}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full gradient-rose text-primary-foreground font-body font-medium py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Save size={16} /> Salvar Configurações
        </button>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-heading text-lg text-foreground mb-3">Exportar Dados</h2>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Exporte todos os itens do planejamento como arquivo CSV.
        </p>
        <button
          onClick={handleExport}
          className="w-full bg-secondary border border-border text-foreground font-body font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-hover transition-colors"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>
    </div>
  );
};

export default ConfigPage;

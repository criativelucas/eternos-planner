import { useState, useEffect } from "react";
import { useWedding } from "@/contexts/WeddingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toCSV } from "@/lib/csv";
import { Save, Download, UserPlus, LogOut, Mail, Check, X } from "lucide-react";

const ConfigPage = () => {
  const { config, updateConfig, items, configId, loading } = useWedding();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(config);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState<{ id: string; invite_email: string; accepted: boolean }[]>([]);
  const [saving, setSaving] = useState(false);

  // Keep the form in sync with the real saved settings once they load.
  useEffect(() => { if (!loading) setForm(config); }, [loading, config]);

  useEffect(() => {
    if (!configId) return;
    supabase.from("couple_invites").select("id, invite_email, accepted").eq("config_id", configId).then(({ data }) => {
      if (data) {
        // one row per email
        const seen = new Set<string>();
        setInvites(data.filter(d => { const k = d.invite_email.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }));
      }
    });
  }, [configId]);

  const handleSave = async () => {
    if (loading || !configId) return;
    setSaving(true);
    const ok = await updateConfig(form);
    setSaving(false);
    if (ok) toast({ title: "Configurações salvas! ✨" });
  };

  const handleInvite = async () => {
    if (!inviteEmail || !configId || !user) return;
    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke("invite-partner", {
        body: { partnerEmail: inviteEmail, configId },
      });

      if (error || data?.error) {
        toast({ title: "Erro ao convidar", description: data?.error || error?.message, variant: "destructive" });
      } else if (false) {
        toast({ title: "Erro ao convidar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Convite enviado! 💍", description: `Um email foi enviado para ${inviteEmail} com o link de acesso.` });
        setInvites(prev => prev.some(p => p.invite_email.toLowerCase() === inviteEmail.toLowerCase()) ? prev : [...prev, { id: crypto.randomUUID(), invite_email: inviteEmail, accepted: false }]);
        setInviteEmail("");
      }
    } catch (err) {
      toast({ title: "Erro ao convidar", description: "Tente novamente.", variant: "destructive" });
    }
    setInviting(false);
  };

  const handleExport = () => {
    const csv = toCSV([
      ["Nome", "Categoria", "Fornecedor", "Valor Total", "Valor Pago", "Status", "Prazo", "Prioridade"],
      ...items.map(i => [i.nome, i.categoria, i.fornecedor || "", i.valorTotal, i.valorPago, i.status, i.prazo || "", i.prioridade]),
    ]);
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

      {/* Account info */}
      <div className="glass-card p-6 space-y-3">
        <h2 className="font-heading text-lg text-foreground">Sua Conta</h2>
        <p className="text-sm text-muted-foreground font-body">{user?.email}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-destructive hover:underline font-body"
        >
          <LogOut size={14} /> Sair da conta
        </button>
      </div>

      {/* Invite partner */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-heading text-lg text-foreground flex items-center gap-2">
          <UserPlus size={18} className="text-primary" /> Conta Casal
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Convide seu parceiro(a) para editar o planejamento juntos.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@parceiro.com"
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail}
            className="gradient-rose text-primary-foreground font-body font-medium px-4 py-2.5 rounded-lg disabled:opacity-50 text-sm"
          >
            {inviting ? "..." : "Convidar"}
          </button>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2 pt-2">
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-2 text-sm font-body">
                <span className="text-foreground">{inv.invite_email}</span>
                {inv.accepted ? (
                  <span className="flex items-center gap-1 text-emerald-400"><Check size={14} /> Aceito</span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground"><X size={14} /> Pendente</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wedding config */}
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

      {/* Export */}
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

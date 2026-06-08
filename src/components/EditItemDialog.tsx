import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";
import { WeddingItem, CATEGORIAS, Categoria, Status, Prioridade, STATUS_LABELS, PRIORIDADE_LABELS } from "@/types/wedding";
import { useWedding } from "@/contexts/WeddingContext";
import { useAutosave } from "@/hooks/useAutosave";

interface Props {
  item: WeddingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditItemDialog = ({ item, open, onOpenChange }: Props) => {
  const { updateItem } = useWedding();
  const [form, setForm] = useState({
    nome: "",
    categoria: "Outros" as Categoria,
    fornecedor: "",
    valorTotal: 0,
    valorPago: 0,
    prazo: "",
    status: "pendente" as Status,
    prioridade: "media" as Prioridade,
    notas: "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        nome: item.nome,
        categoria: item.categoria,
        fornecedor: item.fornecedor || "",
        valorTotal: item.valorTotal,
        valorPago: item.valorPago,
        prazo: item.prazo || "",
        status: item.status,
        prioridade: item.prioridade,
        notas: item.notas || "",
      });
    }
  }, [item]);

  const status = useAutosave(form, (f) => {
    if (!item || !open) return;
    updateItem(item.id, {
      nome: f.nome,
      categoria: f.categoria,
      fornecedor: f.fornecedor || null,
      valorTotal: f.valorTotal,
      valorPago: f.valorPago,
      prazo: f.prazo || null,
      status: f.status,
      prioridade: f.prioridade,
      notas: f.notas || null,
    });
  }, 700);

  const selectClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-heading text-xl">Editar Item</DialogTitle>
            <div className="text-xs font-body text-muted-foreground flex items-center gap-1.5 min-h-[20px]">
              {status === "saving" && (<><Loader2 size={12} className="animate-spin" /> Salvando…</>)}
              {status === "saved" && (<><Check size={12} className="text-emerald-500" /> Salvo</>)}
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="font-body text-xs text-muted-foreground">Nome</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-body text-xs text-muted-foreground">Categoria</Label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Categoria }))} className={selectClass}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground">Fornecedor</Label>
              <Input value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-body text-xs text-muted-foreground">Valor Total (R$)</Label>
              <Input type="number" min={0} step={0.01} value={form.valorTotal} onChange={e => setForm(f => ({ ...f, valorTotal: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground">Valor Pago (R$)</Label>
              <Input type="number" min={0} step={0.01} value={form.valorPago} onChange={e => setForm(f => ({ ...f, valorPago: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-body text-xs text-muted-foreground">Status</Label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))} className={selectClass}>
                {(["pendente", "em_andamento", "concluido", "cancelado"] as Status[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground">Prioridade</Label>
              <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value as Prioridade }))} className={selectClass}>
                {(["alta", "media", "baixa"] as Prioridade[]).map(p => (
                  <option key={p} value={p}>{PRIORIDADE_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label className="font-body text-xs text-muted-foreground">Prazo</Label>
            <Input type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
          </div>
          <div>
            <Label className="font-body text-xs text-muted-foreground">Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observações..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;

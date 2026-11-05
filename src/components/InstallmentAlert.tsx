import { useState } from "react";
import { AlertTriangle, Bell, X } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import { overdueParcelas, upcomingParcelas, fmtBRL } from "@/lib/finance";
import { daysUntil } from "@/lib/date";

const InstallmentAlert = () => {
  const { items } = useWedding();
  const [dismissed, setDismissed] = useState<boolean>(() => sessionStorage.getItem("alertDismissed") === "1");

  const overdue = overdueParcelas(items);
  const upcoming = upcomingParcelas(items, 7);
  const recentOverdue = overdue;
  const suspicious = false;

  if (dismissed) return null;
  if (!suspicious && recentOverdue.length === 0 && upcoming.length === 0) return null;

  const dismiss = () => {
    sessionStorage.setItem("alertDismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-100/80 dark:bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 mb-4 relative">
      <button onClick={dismiss} className="absolute top-2 right-2 p-1 opacity-60 hover:opacity-100" aria-label="Fechar">
        <X size={14} />
      </button>
      <div className="space-y-1 pr-6">
        {suspicious ? (
          <p className="text-sm font-body flex items-center gap-2">
            <AlertTriangle size={14} />
            ⚠️ Detectamos possíveis datas incorretas. Verifique seus prazos.
          </p>
        ) : (
          recentOverdue.length > 0 && (
            <p className="text-sm font-body flex items-center gap-2">
              <AlertTriangle size={14} />
              Você tem <strong>{recentOverdue.length}</strong> parcela(s) vencida(s). Verifique seus pagamentos.
            </p>
          )
        )}
        {!suspicious && upcoming.slice(0, 3).map((p, i) => {
          const days = daysUntil(p.dataVencimento);
          return (
            <p key={`${p.itemId}-${p.numero}-${i}`} className="text-sm font-body flex items-center gap-2">
              <Bell size={14} />
              <strong>{p.itemNome}</strong>: parcela de {fmtBRL(p.valor)} vence em {days === 0 ? "hoje" : `${days} dia${days > 1 ? "s" : ""}`}.
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default InstallmentAlert;

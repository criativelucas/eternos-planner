import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
}

const StatCard = ({ icon: Icon, label, value, subtitle }: StatCardProps) => (
  <div className="glass-card p-5 flex flex-col gap-3">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={16} />
      <span className="text-xs font-body uppercase tracking-wider">{label}</span>
    </div>
    <p className="font-accent text-2xl text-foreground">{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground font-body">{subtitle}</p>}
  </div>
);

export default StatCard;

import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, DollarSign, Clock, Award, Settings } from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/itens", icon: List, label: "Itens" },
  { to: "/financas", icon: DollarSign, label: "Finanças" },
  { to: "/timeline", icon: Clock, label: "Linha do Tempo" },
  { to: "/conquistas", icon: Award, label: "Conquistas" },
  { to: "/config", icon: Settings, label: "Configurações" },
];

const Sidebar = () => (
  <aside className="hidden md:flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border p-6">
    <div className="mb-10">
      <h1 className="font-heading text-3xl font-semibold text-gradient-rose">Eternos</h1>
      <p className="text-xs text-muted-foreground mt-1 font-body">Planejamento de Casamento</p>
    </div>
    <nav className="flex flex-col gap-1 flex-1">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body transition-all duration-200 ${
              isActive
                ? "bg-sidebar-accent text-primary glow-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-auto pt-6 border-t border-sidebar-border">
      <p className="text-xs text-muted-foreground text-center font-body">
        ✨ Feito com amor
      </p>
    </div>
  </aside>
);

export default Sidebar;

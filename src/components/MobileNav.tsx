import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, DollarSign, Clock, Award } from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/itens", icon: List, label: "Itens" },
  { to: "/financas", icon: DollarSign, label: "Finanças" },
  { to: "/timeline", icon: Clock, label: "Timeline" },
  { to: "/conquistas", icon: Award, label: "Conquistas" },
];

const MobileNav = () => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex justify-around py-2">
    {links.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/"}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-body transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`
        }
      >
        <Icon size={18} />
        {label}
      </NavLink>
    ))}
  </nav>
);

export default MobileNav;

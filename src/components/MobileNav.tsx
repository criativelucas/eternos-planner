import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, DollarSign, Clock, Award, Settings } from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard },
  { to: "/itens", icon: List },
  { to: "/financas", icon: DollarSign },
  { to: "/timeline", icon: Clock },
  { to: "/conquistas", icon: Award },
  { to: "/config", icon: Settings },
];

const MobileNav = () => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex justify-around py-2">
    {links.map(({ to, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/"}
        className={({ isActive }) =>
          `flex items-center justify-center p-2 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`
        }
      >
        <Icon size={20} />
      </NavLink>
    ))}
  </nav>
);

export default MobileNav;

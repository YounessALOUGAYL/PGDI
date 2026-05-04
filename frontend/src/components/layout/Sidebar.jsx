// Chemin : frontend/src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/demandes",  icon: FolderOpen,      label: "Dossiers"        },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
        <ShieldCheck className="h-5 w-5 text-slate-700" />
        <span className="text-sm font-bold tracking-tight text-slate-800">
          GestionDélais
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm
               font-medium transition-colors
               ${
                 isActive
                   ? "bg-slate-900 text-white"
                   : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
               }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Profil utilisateur + Logout */}
      <div className="border-t border-slate-100 p-3">
        {user && (
          <div className="mb-2 px-2">
            <p className="text-xs font-semibold text-slate-700 truncate">
              {user.nom}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="
            flex w-full items-center gap-2 rounded-lg px-3 py-2
            text-sm text-slate-500 transition hover:bg-red-50
            hover:text-red-600
          "
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

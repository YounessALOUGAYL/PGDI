// Chemin : frontend/src/components/layout/Header.jsx
import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const LABELS = {
  dashboard: "Tableau de bord",
  demandes:  "Dossiers",
};

export default function Header() {
  const { pathname } = useLocation();
  const { user }     = useAuth();

  // Génère le breadcrumb depuis le pathname
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between
                       border-b border-slate-200 bg-white px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          const label  = LABELS[seg] ?? seg;
          const href   = "/" + segments.slice(0, idx + 1).join("/");
          return (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              {isLast ? (
                <span className="font-medium text-slate-800">{label}</span>
              ) : (
                <Link to={href} className="text-slate-400 hover:text-slate-600">
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Infos utilisateur */}
      {user && (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full
                          bg-slate-800 text-xs font-bold text-white">
            {user.nom?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500">{user.email}</span>
        </div>
      )}
    </header>
  );
}

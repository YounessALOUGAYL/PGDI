// Chemin : frontend/src/features/dashboard/KpiCard.jsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Carte KPI du Dashboard.
 *
 * Props :
 *   title    — libellé
 *   value    — valeur numérique principale
 *   subtitle — texte secondaire
 *   couleur  — "ROUGE" | "ORANGE" | "VERT" | "GRIS"
 *   icon     — composant Lucide
 *   trend    — { value: number, direction: "up"|"down"|"flat" } (optionnel)
 *   loading  — affiche un skeleton si true
 */
export default function KpiCard({
  title, value, subtitle, couleur = "GRIS",
  icon: Icon, trend, loading = false,
}) {
  const cfg = {
    ROUGE:  { bg:"bg-red-500",     light:"bg-red-50",    text:"text-red-600",    border:"border-red-100"    },
    ORANGE: { bg:"bg-amber-400",   light:"bg-amber-50",  text:"text-amber-600",  border:"border-amber-100"  },
    VERT:   { bg:"bg-emerald-500", light:"bg-emerald-50",text:"text-emerald-600",border:"border-emerald-100" },
    GRIS:   { bg:"bg-slate-400",   light:"bg-slate-50",  text:"text-slate-500",  border:"border-slate-100"  },
  }[couleur] ?? { bg:"bg-slate-400",light:"bg-slate-50",text:"text-slate-500",border:"border-slate-100" };

  const TrendIcon =
    trend?.direction === "up"   ? TrendingUp  :
    trend?.direction === "down" ? TrendingDown : Minus;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-8 w-16 rounded bg-slate-100" />
          <div className="h-3 w-32 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className={`
      rounded-xl border bg-white p-5 shadow-sm
      transition-shadow duration-200 hover:shadow-md ${cfg.border}
    `}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </p>
        {Icon && (
          <span className={`rounded-lg p-2 ${cfg.light}`}>
            <Icon className={`h-4 w-4 ${cfg.text}`} strokeWidth={2} />
          </span>
        )}
      </div>

      <p className={`mt-3 text-4xl font-bold tabular-nums tracking-tight ${cfg.text}`}>
        {value ?? "—"}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {subtitle && (
          <p className="text-xs text-slate-400">{subtitle}</p>
        )}
        {trend && (
          <span className={`
            ml-auto inline-flex items-center gap-0.5 text-xs font-medium
            ${trend.direction === "up"   ? "text-red-500"
            : trend.direction === "down" ? "text-emerald-600"
            : "text-slate-400"}
          `}>
            <TrendIcon className="h-3 w-3" />
            {trend.value}
          </span>
        )}
      </div>

      <div className={`mt-4 h-0.5 w-full rounded-full ${cfg.light}`}>
        <div
          className={`h-0.5 rounded-full transition-all duration-700 ${cfg.bg}`}
          style={{ width: `${Math.min(((value ?? 0) / 20) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
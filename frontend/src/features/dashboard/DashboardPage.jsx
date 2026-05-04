// Chemin : frontend/src/features/dashboard/DashboardPage.jsx
import {
  AlertTriangle, Clock, FileCheck,
  RefreshCw, Layers,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import KpiCard      from "./KpiCard";
import AlertesTable from "./AlertesTable";
import { useAuth }  from "../../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    retards, alertes, loading, error,
    lastRefreshed, refresh,
  } = useDashboard(5);

  const kpis = {
    totalRetards:       retards.length,
    totalAlertes:       alertes.length,
    suspensionsActives: [...retards, ...alertes]
      .filter((s) => s.suspensionActive).length,
    dossiersActifs: [
      ...new Set([...retards, ...alertes].map((s) => s.id)),
    ].length,
  };

  const fmtHeure = (d) =>
    d
      ? d.toLocaleTimeString("fr-MA", {
          hour: "2-digit", minute: "2-digit",
        })
      : "—";

  return (
    <div className="page-enter min-h-screen bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tableau de bord
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {user?.nom ? `Bonjour, ${user.nom} — ` : ""}
              Suivi en temps réel des délais d'instruction
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-slate-400">
                Mis à jour à {fmtHeure(lastRefreshed)}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="
                inline-flex items-center gap-1.5 rounded-lg border border-slate-200
                bg-white px-3 py-1.5 text-xs font-medium text-slate-600
                shadow-sm transition hover:bg-slate-50 disabled:opacity-50
              "
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border
                          border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Dossiers en retard"
            value={kpis.totalRetards}
            subtitle="Délai légal dépassé"
            couleur="ROUGE"
            icon={AlertTriangle}
            loading={loading}
          />
          <KpiCard
            title="Échéances proches"
            value={kpis.totalAlertes}
            subtitle="Dans les 5 prochains jours"
            couleur="ORANGE"
            icon={Clock}
            loading={loading}
          />
          <KpiCard
            title="Suspensions actives"
            value={kpis.suspensionsActives}
            subtitle="Délais gelés en ce moment"
            couleur="GRIS"
            icon={Layers}
            loading={loading}
          />
          <KpiCard
            title="Dossiers concernés"
            value={kpis.dossiersActifs}
            subtitle="Nécessitent une action"
            couleur="VERT"
            icon={FileCheck}
            loading={loading}
          />
        </div>

        {/* Tableaux d'alertes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Retards */}
          <section className="rounded-xl border border-red-100 bg-white shadow-sm">
            <div className="flex items-center justify-between
                            border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full
                                   rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2
                                   rounded-full bg-red-500" />
                </span>
                <h2 className="text-sm font-semibold text-slate-800">
                  Dossiers en retard
                </h2>
                {!loading && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs
                                   font-semibold text-red-600 ring-1 ring-red-100">
                    {retards.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Délai légal dépassé</p>
            </div>
            <AlertesTable
              data={retards}
              loading={loading}
              emptyText="Aucun dossier en retard — bonne nouvelle !"
            />
          </section>

          {/* Alertes échéance */}
          <section className="rounded-xl border border-amber-100 bg-white shadow-sm">
            <div className="flex items-center justify-between
                            border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Échéances dans 5 jours
                </h2>
                {!loading && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs
                                   font-semibold text-amber-600 ring-1 ring-amber-100">
                    {alertes.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Action préventive requise</p>
            </div>
            <AlertesTable
              data={alertes}
              loading={loading}
              emptyText="Aucune échéance imminente"
            />
          </section>

        </div>

        <p className="mt-8 text-center text-xs text-slate-300">
          Les statuts sont recalculés automatiquement chaque nuit à minuit.
        </p>
      </div>
    </div>
  );
}
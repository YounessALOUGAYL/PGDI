// Chemin : frontend/src/features/dashboard/AlertesTable.jsx
import { ArrowUpRight, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/common/StatusBadge";
import DelaiChip   from "../../components/common/DelaiChip";
import { getCouleurTokens } from "../../utils/couleur.utils";

/**
 * Tableau d'alertes réutilisable (retards ET échéances proches).
 *
 * Props :
 *   data      — SuiviResponseDTO[]
 *   loading   — boolean
 *   emptyText — texte affiché si liste vide
 */
export default function AlertesTable({ data = [], loading = false, emptyText }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 py-2">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-3 flex-1 rounded bg-slate-100" />
            <div className="h-5 w-16 rounded-full bg-slate-100" />
            <div className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
        <Inbox className="h-7 w-7 opacity-40" />
        <p className="text-sm">{emptyText ?? "Aucun dossier"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {["N° Dossier","Établissement","Évaluateur","Délai","Statut",""].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-xs font-semibold
                           uppercase tracking-wider text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((suivi) => {
            const tokens = getCouleurTokens(suivi.couleurStatut);
            const isLate = suivi.couleurStatut === "ROUGE";

            return (
              <tr
                key={suivi.id}
                onClick={() => navigate(`/demandes/${suivi.demandeId}`)}
                className={`
                  cursor-pointer transition-colors duration-100
                  ${tokens.row} ${isLate ? "bg-red-50/20" : ""}
                `}
              >
                <td className="px-3 py-3">
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {suivi.numeroDossier}
                  </span>
                </td>
                <td className="px-3 py-3 max-w-[180px]">
                  <p className="truncate font-medium text-slate-800">
                    {suivi.nomEtablissement}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-slate-500">
                    {suivi.evaluateurNom ?? (
                      <span className="italic text-slate-300">—</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <DelaiChip jours={suivi.delaiRestant} couleur={suivi.couleurStatut} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge couleur={suivi.couleurStatut} pulse={isLate} size="sm" />
                </td>
                <td className="px-3 py-3 text-right">
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
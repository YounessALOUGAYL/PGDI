// Chemin : frontend/src/features/demandes/SuiviDetailPanel.jsx
import { ShieldAlert, PauseCircle, CheckCircle2, Clock4 } from "lucide-react";
import StatusBadge from "../../components/common/StatusBadge";

function Metrique({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-700">
        {value ?? <span className="font-normal italic text-slate-300">—</span>}
      </dd>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function SuiviDetailPanel({ suivi }) {
  const {
    echeancierAMMPS, delaiRestant, totalJoursSuspendu, // تم التحديث إلى AMMPS
    stadeInstruction, couleurStatut, suspensionActive,
    evaluateurNom, dateReceptionAMMPS,                 // تم التحديث إلى AMMPS
  } = suivi;

  // Barre de progression (approximation Frontend)
  const nbJoursLegaux = delaiRestant > 30 ? 60 : 30;
  const progression =
    delaiRestant != null
      ? Math.max(0, Math.min(100, (delaiRestant / nbJoursLegaux) * 100))
      : 0;

  const barColor =
    couleurStatut === "ROUGE"  ? "bg-red-500"     :
    couleurStatut === "ORANGE" ? "bg-amber-400"   :
    couleurStatut === "VERT"   ? "bg-emerald-500" : "bg-slate-300";

  const valColor =
    couleurStatut === "ROUGE"  ? "text-red-600"     :
    couleurStatut === "ORANGE" ? "text-amber-500"   :
    couleurStatut === "VERT"   ? "text-emerald-600" : "text-slate-400";

  const borderColor =
    couleurStatut === "ROUGE"  ? "border-red-100"    :
    couleurStatut === "ORANGE" ? "border-amber-100"  : "border-slate-200";

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${borderColor}`}>

      {/* Bandeau suspension active */}
      {suspensionActive && (
        <div className="flex items-center gap-2 bg-amber-50 px-5 py-2.5 border-b border-amber-100">
          <PauseCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-amber-700">
            Le décompte du délai est actuellement{" "}
            <strong>suspendu</strong>. En attente de réponse ou de visite.
          </p>
        </div>
      )}

      <div className="px-5 py-5">

        {/* Délai restant en grand */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Délai restant
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              {delaiRestant != null ? (
                <>
                  <span className={`text-5xl font-bold tabular-nums leading-none ${valColor}`}>
                    {Math.abs(delaiRestant)}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    {delaiRestant < 0 ? "jours de retard" : "jours restants"}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-slate-300">
                  Non démarré
                </span>
              )}
            </div>
          </div>
          <StatusBadge
            couleur={couleurStatut}
            pulse={couleurStatut === "ROUGE"}
          />
        </div>

        {/* Barre de progression */}
        {delaiRestant != null && (
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${progression}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-300">
              <span>Échéance</span>
              <span>Délai légal complet</span>
            </div>
          </div>
        )}

        {/* Grille de métriques */}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metrique
            icon={Clock4}
            label="Date d'échéance"
            value={fmtDate(echeancierAMMPS) ?? "Non calculé"} // تم التحديث
          />
          <Metrique
            icon={CheckCircle2}
            label="Réception AMMPS" // تم التحديث بصرياً
            value={fmtDate(dateReceptionAMMPS) ?? "Non renseigné"} // تم التحديث
          />
          <Metrique
            icon={PauseCircle}
            label="Jours suspendus"
            value={`${totalJoursSuspendu ?? 0}j`}
          />
          <Metrique
            icon={ShieldAlert}
            label="Évaluateur"
            value={evaluateurNom ?? "Non assigné"}
          />
        </dl>
      </div>
    </div>
  );
}
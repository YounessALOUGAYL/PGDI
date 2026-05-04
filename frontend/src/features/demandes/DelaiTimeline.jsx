// Chemin : frontend/src/features/demandes/DelaiTimeline.jsx
import {
  FilePlus, PauseCircle, PlayCircle, MapPin,
  ClipboardCheck, AlertTriangle, FlagTriangleRight,
} from "lucide-react";

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-MA", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function construireEvenements(demande, suivi) {
  const events = [];

  if (demande.dateDepot) {
    events.push({
      id:     "depot",
      date:   demande.dateDepot,
      type:   "DEPOT",
      titre:  "Dépôt de la demande",
      detail: `Dossier ${demande.numeroDossier} — ${demande.nomEtablissement}`,
    });
  }

  if (suivi.dateReceptionDMP) {
    events.push({
      id:     "reception",
      date:   suivi.dateReceptionDMP,
      type:   "DEPART",
      titre:  "Réception — Démarrage du délai",
      detail: `Délai légal : ${demande.typeDelaiLegal?.replace("_", " ")}`,
    });
  }

  (suivi.suspensions ?? []).forEach((s) => {
    events.push({
      id:      `susp-debut-${s.id}`,
      date:    s.dateDebut,
      type:    "SUSPENSION_DEBUT",
      motif:   s.motif,
      titre:
        s.motif === "COMPLEMENT_DOSSIER"
          ? "Demande de complément — Délai suspendu"
          : "Visite de conformité planifiée — Délai suspendu",
      detail:  `${s.nbJoursSuspendu}j suspendus${s.enCours ? " (en cours)" : ""}`,
      enCours: s.enCours,
    });

    if (s.dateFin) {
      events.push({
        id:     `susp-fin-${s.id}`,
        date:   s.dateFin,
        type:   "SUSPENSION_FIN",
        motif:  s.motif,
        titre:
          s.motif === "COMPLEMENT_DOSSIER"
            ? "Réponse reçue — Délai repris"
            : "Visite clôturée — Délai repris",
        detail: `Suspension de ${s.nbJoursSuspendu}j prise en compte`,
      });
    }
  });

  if (suivi.stadeInstruction !== "CLOTURE") {
    events.push({
      id:      "actuel",
      date:    null,
      type:    "ACTUEL",
      titre:   "État actuel",
      detail:
        suivi.suspensionActive
          ? "Délai suspendu — en attente"
          : suivi.delaiRestant != null
          ? suivi.delaiRestant < 0
            ? `${Math.abs(suivi.delaiRestant)} jours de retard`
            : `${suivi.delaiRestant} jours restants`
          : "En cours",
      couleur: suivi.couleurStatut,
    });
  } else {
    events.push({
      id:     "cloture",
      date:   null,
      type:   "CLOTURE",
      titre:  "Dossier clôturé",
      detail: demande.infoStatutFinal ?? demande.statutFinal ?? "Clôturé",
    });
  }

  return events.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

const CFG = {
  DEPOT:            { icon: FilePlus,          dot: "bg-slate-400 ring-slate-100",   line: "bg-slate-200",   text: "text-slate-700",    sub: "text-slate-400"   },
  DEPART:           { icon: FlagTriangleRight, dot: "bg-emerald-500 ring-emerald-100", line: "bg-emerald-100", text: "text-emerald-800", sub: "text-emerald-500" },
  SUSPENSION_DEBUT: { icon: PauseCircle,       dot: "bg-amber-400 ring-amber-100",   line: "bg-amber-100",   text: "text-amber-800",    sub: "text-amber-500"   },
  SUSPENSION_FIN:   { icon: PlayCircle,        dot: "bg-sky-500 ring-sky-100",       line: "bg-sky-100",     text: "text-sky-800",      sub: "text-sky-500"     },
  ACTUEL:           { icon: MapPin,            dot: "bg-slate-800 ring-slate-200",   line: null,             text: "text-slate-800",    sub: "text-slate-500"   },
  CLOTURE:          { icon: ClipboardCheck,    dot: "bg-slate-400 ring-slate-100",   line: null,             text: "text-slate-600",    sub: "text-slate-400"   },
};

export default function DelaiTimeline({ demande, suivi }) {
  const events = construireEvenements(demande, suivi);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Historique du dossier
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Chronologie — dépôt, suspensions, reprises
        </p>
      </div>

      <div className="px-5 py-5">
        <ol className="relative space-y-0">
          {events.map((ev, idx) => {
            const cfg     = CFG[ev.type] ?? CFG.DEPOT;
            const Icon    = cfg.icon;
            const isLast  = idx === events.length - 1;
            const isActuel = ev.type === "ACTUEL";

            return (
              <li key={ev.id} className="relative flex gap-4">

                {/* Dot + ligne verticale */}
                <div className="relative flex flex-col items-center">
                  <span className={`
                    relative z-10 flex h-8 w-8 shrink-0 items-center justify-center
                    rounded-full ring-4 shadow-sm
                    ${isActuel ? "animate-pulse" : ""}
                    ${cfg.dot}
                  `}>
                    <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </span>
                  {!isLast && (
                    <span
                      className={`absolute top-8 left-1/2 w-0.5 -translate-x-1/2 ${cfg.line ?? "bg-slate-200"}`}
                      style={{ height: "calc(100% - 2rem)" }}
                    />
                  )}
                </div>

                {/* Contenu */}
                <div className={`
                  mb-6 min-w-0 flex-1 rounded-lg px-4 py-3
                  ${isActuel
                    ? "border border-slate-200 bg-slate-50 shadow-sm"
                    : "bg-slate-50/50"}
                `}>
                  <time className="block text-xs text-slate-400">
                    {ev.date
                      ? fmtDate(ev.date)
                      : <span className="font-semibold text-slate-600">Aujourd'hui</span>}
                  </time>

                  <p className={`mt-0.5 text-sm font-semibold ${cfg.text}`}>
                    {ev.titre}
                    {ev.enCours && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5
                                       text-xs font-medium text-amber-700">
                        En cours
                      </span>
                    )}
                  </p>

                  <p className={`mt-0.5 text-xs ${cfg.sub}`}>{ev.detail}</p>

                  {isActuel && suivi.couleurStatut === "ROUGE" && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md
                                    bg-red-50 px-2.5 py-1.5">
                      <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                      <p className="text-xs font-medium text-red-700">
                        Le délai légal est dépassé — action requise
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
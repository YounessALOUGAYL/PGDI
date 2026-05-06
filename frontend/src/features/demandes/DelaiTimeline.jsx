import React from "react";
import { CheckCircle2, Clock, Play, Pause, FileText } from "lucide-react";

// دالة مساعدة لتنسيق التواريخ
function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DelaiTimeline({ demande, suivi }) {
  const isRetard = suivi?.delaiRestant < 0;
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Historique du dossier</h2>
        <p className="text-xs text-slate-400 mt-0.5">Chronologie — dépôt, suspensions, reprises</p>
      </div>

      <div className="p-6">
        <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
          
          {/* 1. نقطة الإيداع (Dépôt) */}
          <div className="relative pl-6">
            <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white">
              <FileText className="h-4 w-4 text-slate-500" />
            </span>
            <div>
              <p className="text-xs text-slate-400">{fmtDate(demande.dateDepot)}</p>
              <p className="font-medium text-slate-800">Dépôt de la demande</p>
              <p className="text-sm text-slate-500">Dossier {demande.numeroDossier} — {demande.nomEtablissement}</p>
            </div>
          </div>

          {/* 2. بدء العداد (Démarrage du délai) */}
          {demande?.dateReceptionAMMPS && (
            <div className="relative pl-6">
              <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-white">
                <Play className="h-4 w-4 text-emerald-600 ml-0.5" />
              </span>
              <div>
                <p className="text-xs text-slate-400">{fmtDate(demande.dateReceptionAMMPS)}</p>
                <p className="font-medium text-emerald-700">Réception — Démarrage du délai</p>
                <p className="text-sm text-slate-500">Délai légal : {demande.typeDelaiLegal?.replace("_", " ")}</p>
              </div>
            </div>
          )}

          {/* 3. ── حلقة تكرار طلبات التكملة (Complements) ── */}
          {demande?.complements?.map((cpl, index) => (
            <React.Fragment key={cpl.id}>
              {/* تجميد العداد (Envoi Complément) */}
              <div className="relative pl-6">
                <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 ring-4 ring-white">
                  <Pause className="h-4 w-4 text-orange-600" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">{fmtDate(cpl.dateEnvoiCpl)}</p>
                  <p className="font-medium text-slate-800">Demande de complément (N°{index + 1})</p>
                  <p className="text-sm text-slate-500">
                    Le délai a été suspendu.
                    {cpl.suspensionActive && (
                      <span className="ml-1 font-medium text-orange-600">En attente de réponse...</span>
                    )}
                  </p>
                </div>
              </div>

              {/* استئناف العداد (Réception Complément) */}
              {cpl.dateReceptionCpl && (
                <div className="relative pl-6">
                  <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
                    <Play className="h-4 w-4 text-blue-600 ml-0.5" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">{fmtDate(cpl.dateReceptionCpl)}</p>
                    <p className="font-medium text-slate-800">Réception du complément (N°{index + 1})</p>
                    <p className="text-sm text-slate-500">
                      Reprise du délai. <span className="font-medium text-slate-700">+{cpl.joursSuspendu} jours</span> ajoutés à l'échéancier.
                    </p>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* 4. الحالة الحالية (État actuel) */}
          <div className="relative pl-6 pt-2">
            <span className={`absolute -left-[17px] top-3 flex h-8 w-8 items-center justify-center rounded-full ${isRetard ? 'bg-red-100' : 'bg-slate-800'} ring-4 ring-white`}>
              <Clock className={`h-4 w-4 ${isRetard ? 'text-red-600' : 'text-white'}`} />
            </span>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aujourd'hui</p>
              <p className="font-semibold text-slate-800 mt-1">État actuel</p>
              
              {suivi?.stadeInstruction === "CLOTURE" ? (
                <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-200/50 w-fit px-2 py-1 rounded">
                  <CheckCircle2 className="h-4 w-4" /> Dossier clôturé
                </div>
              ) : isRetard ? (
                <div className="mt-2 text-sm font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded">
                  ⚠️ Le délai légal est dépassé — action requise
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{suivi?.delaiRestant} jours</span> restants
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
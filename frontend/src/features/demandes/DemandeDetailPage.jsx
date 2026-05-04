// Chemin : frontend/src/features/demandes/DemandeDetailPage.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, AlertTriangle,
  Building2, User, Calendar, Hash, Layers,
} from "lucide-react";
import { useDemandeDetail } from "../../hooks/useDemandeDetail";
import SuiviDetailPanel from "./SuiviDetailPanel";
import DelaiTimeline    from "./DelaiTimeline";
import ActionsSidebar   from "./ActionsSidebar";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ── Section 1 : Informations générales ───────────────────────────────────────

function InfosGeneralesCard({ demande }) {
  const champs = [
    {
      icon:  Hash,
      label: "N° Dossier",
      value: demande.numeroDossier,
      mono:  true,
    },
    {
      icon:  Building2,
      label: "Établissement",
      value: demande.nomEtablissement,
    },
    {
      icon:  Layers,
      label: "Type / Motif",
      value: demande.typeMotifDemande
        ? `${demande.typeDelaiLegal?.replace("_", " ")} — ${demande.typeMotifDemande}`
        : demande.typeDelaiLegal?.replace("_", " "),
    },
    {
      icon:  User,
      label: "Demandeur",
      value: demande.demandeurNom,
    },
    {
      icon:  Calendar,
      label: "Date de dépôt",
      value: fmtDate(demande.dateDepot),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Informations générales
        </h2>
      </div>
      <dl className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
        {champs.map(({ icon: Icon, label, value, mono }) => (
          <div key={label} className="bg-white px-5 py-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium
                           uppercase tracking-wider text-slate-400">
              <Icon className="h-3 w-3" />
              {label}
            </dt>
            <dd className={`mt-1.5 text-sm font-semibold text-slate-800
                            ${mono ? "font-mono" : ""}`}>
              {value ?? (
                <span className="font-normal italic text-slate-300">—</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 p-8 animate-pulse">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="h-36 rounded-xl bg-slate-100" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="h-48 rounded-xl bg-slate-100" />
            <div className="h-64 rounded-xl bg-slate-100" />
          </div>
          <div className="h-80 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetour }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 font-medium text-slate-700">
          {message ?? "Dossier introuvable"}
        </p>
        <button
          onClick={onRetour}
          className="mt-4 text-sm text-slate-500 underline underline-offset-2"
        >
          Retour à la liste
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DemandeDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const {
    demande, suivi, loading, error, refresh,
  } = useDemandeDetail(id);

  if (loading) return <PageSkeleton />;
  if (error || !demande) {
    return (
      <ErrorCard
        message={error}
        onRetour={() => navigate("/demandes")}
      />
    );
  }

  return (
    <div className="page-enter min-h-screen bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb & actions globales */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/demandes")}
              className="flex items-center gap-1.5 text-sm text-slate-500
                         transition hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Dossiers
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-sm font-semibold text-slate-800">
              {demande.numeroDossier}
            </span>
          </div>
          <button
            onClick={refresh}
            className="
              inline-flex items-center gap-1.5 rounded-lg border border-slate-200
              bg-white px-3 py-1.5 text-xs font-medium text-slate-600
              shadow-sm transition hover:bg-slate-50
            "
          >
            <RefreshCw className="h-3 w-3" />
            Actualiser
          </button>
        </div>

        {/* Layout 2/3 + 1/3 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Colonne principale ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Section 1 — Informations générales */}
            <InfosGeneralesCard demande={demande} />

            {/* Section 2 — Panneau de contrôle des délais */}
            {suivi ? (
              <SuiviDetailPanel suivi={suivi} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200
                              bg-white px-6 py-10 text-center">
                <p className="text-sm text-slate-400">
                  Le suivi de ce dossier n'a pas encore été initialisé.
                </p>
              </div>
            )}

            {/* Section 3 — Timeline historique */}
            {suivi && (
              <DelaiTimeline demande={demande} suivi={suivi} />
            )}
          </div>

          {/* ── Colonne latérale (actions) ── */}
          <div className="lg:col-span-1">
            <ActionsSidebar
              suivi={suivi}
              demande={demande}
              onSuccess={refresh}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
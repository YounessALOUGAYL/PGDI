// Chemin : frontend/src/features/demandes/NouveauDossierForm.jsx
import { useState, useCallback } from "react";
import {
  Building2, FileText, Scale, AlignLeft,
  User, CalendarDays, ChevronRight,
  Loader2, CheckCircle2, AlertCircle,
  Info, Sparkles, Clock, Hash,
} from "lucide-react";
import demandeService from "../../services/demande.service";

// ─── Constantes métier AMMPS ──────────────────────────────────────────────────

const TYPES_DELAI = [
  {
    value: "SGG_30J",
    label: "SGG — 30 jours",
    jours: 30,
    description: "Secrétariat Général du Gouvernement",
    couleur: "emerald",
  },
  {
    value: "AMMPS_60J",
    label: "AMMPS — 60 jours",
    jours: 60,
    description: "Agence Marocaine du Médicament",
    couleur: "sky",
  },
  {
    value: "PERSONNALISE",
    label: "Délai personnalisé",
    jours: null,
    description: "Définir un délai spécifique",
    couleur: "amber",
  },
];

const MOTIFS = [
  "Nouvelle AMM",
  "Renouvellement AMM",
  "Extension d'indication",
  "Modification de dossier",
  "Transfert d'AMM",
  "Ouverture d'établissement",
  "Extension d'activité",
  "Préalable réglementaire",
  "Autre",
];

const ETAT_INITIAL = {
  numeroDossier:      "",
  nomEtablissement:   "",
  typeDelaiLegal:     "SGG_30J",
  nbJoursPersonnalise: "",
  motifDemande:       "",
  nomDemandeur:       "",
  dateDepot:          new Date().toISOString().split("T")[0],
};

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function genererNumeroDossier() {
  const annee = new Date().getFullYear();
  const rand   = String(Math.floor(Math.random() * 900) + 100);
  return `DOS-${annee}-${rand}`;
}

function validerFormulaire(form) {
  const erreurs = {};

  if (!form.numeroDossier.trim())
    erreurs.numeroDossier = "Le numéro de dossier est requis.";
  else if (!/^[A-Z]{2,5}-\d{4}-\d{3,6}$/.test(form.numeroDossier.trim()))
    erreurs.numeroDossier = "Format attendu : DOS-2026-001";

  if (!form.nomEtablissement.trim())
    erreurs.nomEtablissement = "Le nom de l'établissement est requis.";
  else if (form.nomEtablissement.trim().length < 3)
    erreurs.nomEtablissement = "Minimum 3 caractères.";

  if (!form.typeDelaiLegal)
    erreurs.typeDelaiLegal = "Sélectionnez un type de délai.";

  if (form.typeDelaiLegal === "PERSONNALISE") {
    const n = parseInt(form.nbJoursPersonnalise, 10);
    if (!n || n <= 0)
      erreurs.nbJoursPersonnalise = "Entrez un nombre de jours valide (> 0).";
    else if (n > 365)
      erreurs.nbJoursPersonnalise = "Le délai ne peut pas dépasser 365 jours.";
  }

  if (!form.motifDemande)
    erreurs.motifDemande = "Sélectionnez un motif de demande.";

  if (!form.nomDemandeur.trim())
    erreurs.nomDemandeur = "Le nom du demandeur est requis.";

  if (!form.dateDepot)
    erreurs.dateDepot = "La date de dépôt est requise.";
  else {
    const depot     = new Date(form.dateDepot);
    const aujourdhui = new Date();
    aujourdhui.setHours(23, 59, 59, 999);
    if (depot > aujourdhui)
      erreurs.dateDepot = "La date de dépôt ne peut pas être dans le futur.";
  }

  return erreurs;
}

// ─── Composants atomiques ─────────────────────────────────────────────────────

function SectionCard({ titre, description, icon: Icon, couleur = "slate", children }) {
  const couleurs = {
    slate:   { border: "border-slate-200", icon: "bg-slate-100 text-slate-500" },
    emerald: { border: "border-emerald-100", icon: "bg-emerald-50 text-emerald-600" },
    sky:     { border: "border-sky-100", icon: "bg-sky-50 text-sky-600" },
    amber:   { border: "border-amber-100", icon: "bg-amber-50 text-amber-600" },
  };
  const cfg = couleurs[couleur] ?? couleurs.slate;

  return (
    <div className={`rounded-xl border ${cfg.border} bg-white shadow-sm`}>
      {/* En-tête de carte */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center
                          rounded-lg ${cfg.icon}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{titre}</p>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
      </div>
      {/* Contenu */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function FieldWrapper({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-semibold
                         uppercase tracking-wider text-slate-500">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="flex items-center gap-1 text-xs text-slate-400">
          <Info className="h-3 w-3 shrink-0" />
          {hint}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError) => `
  w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800
  placeholder:text-slate-400 focus:outline-none transition-all duration-150
  ${hasError
    ? "border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-2 focus:ring-red-100"
    : "border-slate-200 bg-slate-50 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"}
`;

// ─── Sélecteur de type de délai ───────────────────────────────────────────────

function TypeDelaiSelector({ value, onChange, error }) {
  const couleurs = {
    emerald: {
      actif:   "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100",
      inactif: "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30",
      badge:   "bg-emerald-100 text-emerald-700",
      check:   "text-emerald-500",
    },
    sky: {
      actif:   "border-sky-400 bg-sky-50 ring-2 ring-sky-100",
      inactif: "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30",
      badge:   "bg-sky-100 text-sky-700",
      check:   "text-sky-500",
    },
    amber: {
      actif:   "border-amber-400 bg-amber-50 ring-2 ring-amber-100",
      inactif: "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30",
      badge:   "bg-amber-100 text-amber-700",
      check:   "text-amber-500",
    },
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TYPES_DELAI.map((type) => {
          const cfg    = couleurs[type.couleur];
          const actif  = value === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`
                relative flex flex-col gap-1.5 rounded-xl border p-3.5
                text-left transition-all duration-150
                ${actif ? cfg.actif : cfg.inactif}
              `}
            >
              {/* Check */}
              {actif && (
                <CheckCircle2
                  className={`absolute right-3 top-3 h-4 w-4 ${cfg.check}`}
                  strokeWidth={2.5}
                />
              )}

              {/* Badge jours */}
              {type.jours && (
                <span className={`inline-flex w-fit items-center rounded-full
                                  px-2 py-0.5 text-xs font-bold ${cfg.badge}`}>
                  {type.jours}j
                </span>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {type.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {type.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Encart récapitulatif ─────────────────────────────────────────────────────

function RecapitulatifDelai({ form }) {
  const typeSelectionne = TYPES_DELAI.find((t) => t.value === form.typeDelaiLegal);
  const nbJours =
    form.typeDelaiLegal === "PERSONNALISE"
      ? parseInt(form.nbJoursPersonnalise, 10) || null
      : typeSelectionne?.jours;

  if (!nbJours || !form.dateDepot) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200
                    bg-slate-50/80 px-4 py-3.5">
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="text-xs text-slate-600">
        <p className="font-semibold text-slate-700">
          Délai légal applicable : {nbJours} jours
        </p>
        <p className="mt-0.5 text-slate-500">
          Le compteur démarrera à la date de réception par l'AMMPS,
          pas à la date de dépôt. Les suspensions seront ajoutées
          automatiquement par le moteur de calcul.
        </p>
      </div>
    </div>
  );
}

// ─── Barre de progression des étapes ─────────────────────────────────────────

function BarreProgression({ etapeActuelle, totalEtapes }) {
  const pct = Math.round((etapeActuelle / totalEtapes) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Complétion du formulaire</span>
        <span className="font-semibold text-slate-600">{pct}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full bg-slate-800 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * NouveauDossierForm — Formulaire de création d'un dossier AMMPS V2.0
 *
 * Props :
 *   onSuccess(demande) — appelé après création réussie avec le DTO retourné
 *   onCancel()         — appelé sur "Annuler"
 *   onToastSuccess(msg) — fonction de notification (useToast ou prop directe)
 */
export default function NouveauDossierForm({
  onSuccess,
  onCancel,
  onToastSuccess,
}) {
  const [form,    setForm]    = useState(ETAT_INITIAL);
  const [erreurs, setErreurs] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState(null);

  // ── Mise à jour d'un champ ──────────────────────────────────────────────────

  const set = useCallback((champ, valeur) => {
    setForm((prev) => ({ ...prev, [champ]: valeur }));
    setErreurs((prev) => ({ ...prev, [champ]: undefined }));
    setApiErr(null);
  }, []);

  // ── Génération automatique du numéro ───────────────────────────────────────

  const genererNumero = useCallback(() => {
    set("numeroDossier", genererNumeroDossier());
  }, [set]);

  // ── Calcul progression ─────────────────────────────────────────────────────

  const champsRemplis = [
    form.numeroDossier.trim(),
    form.nomEtablissement.trim(),
    form.typeDelaiLegal,
    form.typeDelaiLegal !== "PERSONNALISE" || form.nbJoursPersonnalise,
    form.motifDemande,
    form.nomDemandeur.trim(),
    form.dateDepot,
  ].filter(Boolean).length;

  // ── Soumission ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const errValidation = validerFormulaire(form);
    setErreurs(errValidation);
    if (Object.keys(errValidation).length > 0) return;

    setLoading(true);
    setApiErr(null);

    try {
      const payload = {
        numeroDossier:    form.numeroDossier.trim(),
        nomEtablissement: form.nomEtablissement.trim(),
        typeMotifDemande: form.motifDemande,
        dateDepot:        form.dateDepot,
        typeDelaiLegal:   form.typeDelaiLegal,
        demandeurNom:     form.nomDemandeur.trim(),
        ...(form.typeDelaiLegal === "PERSONNALISE" && {
          nbJoursPersonnalise: parseInt(form.nbJoursPersonnalise, 10),
        }),
      };

      const demande = await demandeService.create(payload);

      onToastSuccess?.(
        `Dossier ${demande.numeroDossier} créé avec succès.`
      );
      onSuccess?.(demande);

    } catch (err) {
      setApiErr(
        err?.message ?? "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }

// ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    // 1. حاوية رئيسية بارتفاع أقصى (75% من الشاشة)
    <div className="flex flex-col max-h-[75vh]">

      {/* 2. منطقة المحتوى القابلة للتمرير (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto pr-3 space-y-5 pb-4">
        
        {/* Barre de progression */}
        <BarreProgression etapeActuelle={champsRemplis} totalEtapes={7} />

        {/* Erreur API globale */}
        {apiErr && (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Erreur lors de la création</p>
              <p className="mt-0.5 text-xs opacity-80">{apiErr}</p>
            </div>
          </div>
        )}

        {/* ── Section 1 : Identification du dossier ── */}
        <SectionCard titre="Identification du dossier" description="Référence unique et établissement concerné" icon={FileText} couleur="slate">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrapper label="Numéro de dossier" required error={erreurs.numeroDossier} hint="Format : DOS-2026-001">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.numeroDossier} onChange={(e) => set("numeroDossier", e.target.value.toUpperCase())} placeholder="DOS-2026-001" className={`${inputCls(!!erreurs.numeroDossier)} pl-9 font-mono`} />
                </div>
                <button type="button" onClick={genererNumero} title="Générer automatiquement" className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700">
                  <Sparkles className="h-3.5 w-3.5" /> Auto
                </button>
              </div>
            </FieldWrapper>
            <FieldWrapper label="Nom de l'établissement" required error={erreurs.nomEtablissement} hint="Raison sociale complète">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.nomEtablissement} onChange={(e) => set("nomEtablissement", e.target.value)} placeholder="Ex: Pharma Santé Maroc S.A." className={`${inputCls(!!erreurs.nomEtablissement)} pl-9`} />
              </div>
            </FieldWrapper>
          </div>
        </SectionCard>

        {/* ── Section 2 : Type de délai légal ── */}
        <SectionCard titre="Type de délai légal" description="Réglementation applicable à ce dossier" icon={Scale} couleur="emerald">
          <div className="space-y-4">
            <TypeDelaiSelector value={form.typeDelaiLegal} onChange={(v) => set("typeDelaiLegal", v)} error={erreurs.typeDelaiLegal} />
            {form.typeDelaiLegal === "PERSONNALISE" && (
              <FieldWrapper label="Nombre de jours personnalisé" required error={erreurs.nbJoursPersonnalise} hint="Entre 1 et 365 jours">
                <div className="relative max-w-xs">
                  <input type="number" min={1} max={365} value={form.nbJoursPersonnalise} onChange={(e) => set("nbJoursPersonnalise", e.target.value)} placeholder="Ex: 45" className={inputCls(!!erreurs.nbJoursPersonnalise)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">jours</span>
                </div>
              </FieldWrapper>
            )}
            <RecapitulatifDelai form={form} />
          </div>
        </SectionCard>

        {/* ── Section 3 : Motif et demandeur ── */}
        <SectionCard titre="Motif et demandeur" description="Nature de la demande et interlocuteur principal" icon={AlignLeft} couleur="sky">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrapper label="Motif de la demande" required error={erreurs.motifDemande}>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select value={form.motifDemande} onChange={(e) => set("motifDemande", e.target.value)} className={`${inputCls(!!erreurs.motifDemande)} pl-9 appearance-none`}>
                  <option value="">Sélectionner un motif…</option>
                  {MOTIFS.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </FieldWrapper>
            <FieldWrapper label="Nom du demandeur" required error={erreurs.nomDemandeur} hint="Responsable ou représentant légal">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.nomDemandeur} onChange={(e) => set("nomDemandeur", e.target.value)} placeholder="Ex: M. Hassan Benali" className={`${inputCls(!!erreurs.nomDemandeur)} pl-9`} />
              </div>
            </FieldWrapper>
          </div>
        </SectionCard>

        {/* ── Section 4 : Date de dépôt ── */}
        <SectionCard titre="Date de dépôt" description="Date officielle de réception du dossier" icon={CalendarDays} couleur="amber">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrapper label="Date de dépôt" required error={erreurs.dateDepot} hint="Date de remise physique ou électronique du dossier">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input type="date" value={form.dateDepot} max={new Date().toISOString().split("T")[0]} onChange={(e) => set("dateDepot", e.target.value)} className={`${inputCls(!!erreurs.dateDepot)} pl-9`} />
              </div>
            </FieldWrapper>
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div className="text-xs text-blue-700">
                <p className="font-semibold">Moteur AMMPS V2.0</p>
                <p className="mt-1 leading-relaxed opacity-80">Le délai légal est calculé à partir de la <strong> date de réception AMMPS</strong>, saisie ultérieurement. Les suspensions (compléments, visites) sont cumulées automatiquement.</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Récapitulatif final ── */}
        {form.nomEtablissement && form.numeroDossier && (
          <div className="rounded-xl border border-slate-200 bg-slate-800 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Récapitulatif</p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-3">
              {[
                { label: "Dossier", value: form.numeroDossier || "—" },
                { label: "Établissement", value: form.nomEtablissement || "—" },
                { label: "Délai", value: TYPES_DELAI.find(t => t.value === form.typeDelaiLegal)?.label ?? "—" },
                { label: "Motif", value: form.motifDemande || "—" },
                { label: "Demandeur", value: form.nomDemandeur || "—" },
                { label: "Dépôt", value: form.dateDepot ? new Date(form.dateDepot + "T00:00:00").toLocaleDateString("fr-MA") : "—" },
              ].map(({ label, value }) => (
                <div key={label}><span className="text-slate-500">{label} : </span><span className="font-medium text-slate-200">{value}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. منطقة الأزرار الثابتة في الأسفل (Fixed Footer) */}
      <div className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white pt-4 mt-2">
        <button type="button" onClick={onCancel} disabled={loading} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          Annuler
        </button>
        <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Création en cours…</>) : (<><CheckCircle2 className="h-4 w-4" /> Créer le dossier</>)}
        </button>
      </div>

    </div>
  );
}
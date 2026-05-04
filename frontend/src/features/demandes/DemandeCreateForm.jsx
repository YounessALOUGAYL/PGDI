// Chemin : frontend/src/features/demandes/DemandeCreateForm.jsx
import { useState } from "react";
import { Loader2, FilePlus } from "lucide-react";
import demandeService from "../../services/demande.service";
import { useAuth }    from "../../hooks/useAuth";

/**
 * Formulaire de création d'une nouvelle demande.
 * Utilisé dans la modale <DemandeCreateModal />.
 *
 * Props :
 *   onSuccess(demande) — callback après création réussie
 *   onCancel()         — ferme la modale sans action
 */
export default function DemandeCreateForm({ onSuccess, onCancel }) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    nomEtablissement:  "",
    typeMotifDemande:  "",
    dateDepot:         new Date().toISOString().split("T")[0], // aujourd'hui
    typeDelaiLegal:    "SGG_30J",
    nbJoursPersonnalise: "",
    demandeurId:       user?.id ?? "",
  });

  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── Validation locale ────────────────────────────────────────────────────

  function valider() {
    const e = {};
    if (!form.nomEtablissement.trim())
      e.nomEtablissement = "Le nom de l'établissement est requis";
    if (!form.typeMotifDemande.trim())
      e.typeMotifDemande = "Le type de motif est requis";
    if (!form.dateDepot)
      e.dateDepot = "La date de dépôt est requise";
    if (form.typeDelaiLegal === "PERSONNALISE") {
      const n = parseInt(form.nbJoursPersonnalise, 10);
      if (!n || n <= 0)
        e.nbJoursPersonnalise = "Nombre de jours valide requis (> 0)";
    }
    if (!form.demandeurId)
      e.demandeurId = "L'identifiant du demandeur est requis";
    return e;
  }

  // ── Soumission ────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const e = valider();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setApiError(null);
    try {
      const payload = {
        nomEtablissement:  form.nomEtablissement.trim(),
        typeMotifDemande:  form.typeMotifDemande.trim(),
        dateDepot:         form.dateDepot,
        typeDelaiLegal:    form.typeDelaiLegal,
        demandeurId:       Number(form.demandeurId),
        ...(form.typeDelaiLegal === "PERSONNALISE" && {
          nbJoursPersonnalise: parseInt(form.nbJoursPersonnalise, 10),
        }),
      };
      const demande = await demandeService.create(payload);
      onSuccess(demande);
    } catch (err) {
      setApiError(err?.message ?? "Erreur lors de la création du dossier");
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers UI ────────────────────────────────────────────────────────────

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const inputCls = (field) => `
    w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800
    placeholder:text-slate-400 focus:outline-none transition
    ${errors[field]
      ? "border-red-300 bg-red-50 focus:border-red-400"
      : "border-slate-200 bg-slate-50 focus:border-slate-400 focus:bg-white"}
  `;

  return (
    <div className="space-y-5">

      {/* Erreur API */}
      {apiError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100
                        bg-red-50 px-3 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0">⚠</span>
          {apiError}
        </div>
      )}

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Nom établissement */}
        <div className="sm:col-span-2">
          <Label htmlFor="nomEtab" required>Nom de l'établissement</Label>
          <input
            id="nomEtab"
            type="text"
            value={form.nomEtablissement}
            onChange={(e) => set("nomEtablissement", e.target.value)}
            placeholder="Ex: Clinique Al Amal"
            className={inputCls("nomEtablissement")}
          />
          <ErrMsg msg={errors.nomEtablissement} />
        </div>

        {/* Type de motif */}
        <div>
          <Label htmlFor="motif" required>Type de motif</Label>
          <select
            id="motif"
            value={form.typeMotifDemande}
            onChange={(e) => set("typeMotifDemande", e.target.value)}
            className={inputCls("typeMotifDemande") + " appearance-none"}
          >
            <option value="">Sélectionner…</option>
            <option value="Ouverture">Ouverture</option>
            <option value="Extension">Extension</option>
            <option value="Renouvellement">Renouvellement</option>
            <option value="Préalable">Préalable</option>
            <option value="Transfert">Transfert</option>
          </select>
          <ErrMsg msg={errors.typeMotifDemande} />
        </div>

        {/* Date de dépôt */}
        <div>
          <Label htmlFor="dateDepot" required>Date de dépôt</Label>
          <input
            id="dateDepot"
            type="date"
            value={form.dateDepot}
            onChange={(e) => set("dateDepot", e.target.value)}
            className={inputCls("dateDepot")}
          />
          <ErrMsg msg={errors.dateDepot} />
        </div>

        {/* Type de délai légal */}
        <div>
          <Label htmlFor="typeDelai" required>Type de délai légal</Label>
          <select
            id="typeDelai"
            value={form.typeDelaiLegal}
            onChange={(e) => set("typeDelaiLegal", e.target.value)}
            className={inputCls("typeDelaiLegal") + " appearance-none"}
          >
            <option value="SGG_30J">SGG — 30 jours</option>
            <option value="AMMPS_60J">AMMPS — 60 jours</option>
            <option value="PERSONNALISE">Personnalisé</option>
          </select>
        </div>

        {/* Jours personnalisés — conditionnel */}
        {form.typeDelaiLegal === "PERSONNALISE" && (
          <div>
            <Label htmlFor="nbJours" required>Nombre de jours</Label>
            <input
              id="nbJours"
              type="number"
              min={1}
              value={form.nbJoursPersonnalise}
              onChange={(e) => set("nbJoursPersonnalise", e.target.value)}
              placeholder="Ex: 45"
              className={inputCls("nbJoursPersonnalise")}
            />
            <ErrMsg msg={errors.nbJoursPersonnalise} />
          </div>
        )}

        {/* ID Demandeur */}
        <div className={form.typeDelaiLegal === "PERSONNALISE" ? "" : "sm:col-span-1"}>
          <Label htmlFor="demandeurId" required>ID Demandeur</Label>
          <input
            id="demandeurId"
            type="number"
            value={form.demandeurId}
            onChange={(e) => set("demandeurId", e.target.value)}
            placeholder="Ex: 3"
            className={inputCls("demandeurId")}
          />
          <ErrMsg msg={errors.demandeurId} />
          <p className="mt-1 text-xs text-slate-400">
            Identifiant de l'utilisateur ayant le rôle DEMANDEUR.
          </p>
        </div>

      </div>

      {/* Récapitulatif délai */}
      <DelaiInfo typeDelai={form.typeDelaiLegal} nbJours={form.nbJoursPersonnalise} />

      {/* Boutons */}
      <div className="flex gap-3 pt-1 border-t border-slate-100">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="
            flex flex-1 items-center justify-center gap-2 rounded-lg
            bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white
            shadow-sm transition hover:bg-slate-700
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Création…</>
          ) : (
            <><FilePlus className="h-4 w-4" /> Créer le dossier</>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="
            rounded-lg border border-slate-200 px-4 py-2.5 text-sm
            font-medium text-slate-600 transition hover:bg-slate-50
            disabled:opacity-50
          "
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ── Micro-composants ──────────────────────────────────────────────────────────

function Label({ htmlFor, required, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold uppercase
                 tracking-wider text-slate-500"
    >
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function ErrMsg({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function DelaiInfo({ typeDelai, nbJours }) {
  const labels = {
    SGG_30J:     { label: "SGG",    jours: 30,                     color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    AMMPS_60J:   { label: "AMMPS",  jours: 60,                     color: "bg-sky-50 text-sky-700 border-sky-100" },
    PERSONNALISE: { label: "Personnalisé", jours: parseInt(nbJours) || 0, color: "bg-amber-50 text-amber-700 border-amber-100" },
  };
  const info = labels[typeDelai];
  if (!info || (typeDelai === "PERSONNALISE" && !info.jours)) return null;

  return (
    <div className={`
      rounded-lg border px-3.5 py-3 text-xs ${info.color}
    `}>
      <span className="font-semibold">{info.label}</span>
      {" — "}
      Le délai légal applicable est de{" "}
      <span className="font-bold">{info.jours} jours</span> à partir
      de la date de réception par le pôle inspection.
    </div>
  );
}
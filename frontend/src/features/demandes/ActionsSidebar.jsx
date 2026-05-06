import { useState } from "react";
import {
  PlusCircle, MapPin, XCircle,
  ChevronDown, ChevronUp, Send,
  CalendarCheck, Loader2,
} from "lucide-react";
import complementService from "../../services/complement.service";
import visiteService     from "../../services/visite.service";
import { useToast }      from "../../context/ToastContext";

function ActionPanel({
  id, ouvert, onToggle, label, description,
  icon: Icon, couleur, disabled, disabledReason, children,
}) {
  const colors = {
    amber:   { btn: "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-100",       icon: "text-amber-500"   },
    sky:     { btn: "text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-100",               icon: "text-sky-500"     },
    emerald: { btn: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100", icon: "text-emerald-500" },
  }[couleur];

  return (
    <div className="rounded-lg overflow-hidden">
      <button
        onClick={!disabled ? onToggle : undefined}
        disabled={disabled}
        title={disabledReason}
        className={`
          w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg
          border transition-all duration-150
          ${disabled
            ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-400"
            : `${colors.btn} cursor-pointer`}
        `}
      >
        <Icon className={`h-4 w-4 shrink-0 ${disabled ? "text-slate-300" : colors.icon}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-xs opacity-70 truncate">
            {disabled && disabledReason ? disabledReason : description}
          </p>
        </div>
        {!disabled && (
          ouvert
            ? <ChevronUp   className="h-3.5 w-3.5 shrink-0 opacity-60" />
            : <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        )}
      </button>
      {ouvert && !disabled && (
        <div className="mt-1 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

const inputCls = `
  w-full rounded-lg border border-slate-200 bg-white px-3 py-2
  text-sm text-slate-800 placeholder:text-slate-400
  focus:border-slate-400 focus:outline-none transition
`;

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function FormWrapper({ children, error, loading, onSubmit, onCancel, submitLabel, submitIcon: SubmitIcon }) {
  return (
    <div className="space-y-3">
      {children}
      {error && (
        <p className="flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
          <span className="shrink-0">⚠</span> {error}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SubmitIcon className="h-3.5 w-3.5" />}
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function ComplementForm({ suiviId, onSuccess, onCancel }) {
  const [dateEnvoi, setDateEnvoi] = useState("");
  const [produits,  setProduits]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const { success, error: toastError } = useToast();

  async function soumettre() {
    if (!dateEnvoi) { setError("La date d'envoi est requise"); return; }
    setLoading(true); setError(null);
    try {
      await complementService.creer({
        suiviId,
        dateEnvoiCpl: dateEnvoi,
        produits: produits ? produits.split(",").map((p) => p.trim()).filter(Boolean) : [],
      });
      success("La suspension est active. Le délai est gelé.", "Complément créé");
      onSuccess();
    } catch (err) {
      const msg = err?.message ?? "Erreur lors de la création";
      setError(msg);
      toastError(msg, "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormWrapper error={error} loading={loading} onSubmit={soumettre} onCancel={onCancel} submitLabel="Créer et suspendre" submitIcon={Send}>
      <Field label="Date d'envoi *"><input type="date" value={dateEnvoi} onChange={(e) => setDateEnvoi(e.target.value)} className={inputCls} /></Field>
      <Field label="Produits demandés (séparés par virgule)"><input type="text" value={produits} placeholder="ex: plan masse, AF" onChange={(e) => setProduits(e.target.value)} className={inputCls} /></Field>
    </FormWrapper>
  );
}

function VisiteForm({ suiviId, onSuccess, onCancel }) {
  const [dateVisite, setDateVisite] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const { success, error: toastError } = useToast();

  async function soumettre() {
    if (!dateVisite) { setError("La date de visite est requise"); return; }
    setLoading(true); setError(null);
    try {
      await visiteService.planifier(suiviId, dateVisite);
      success("La visite est planifiée. Le délai est suspendu.", "Visite planifiée");
      onSuccess();
    } catch (err) {
      const msg = err?.message ?? "Erreur lors de la planification";
      setError(msg);
      toastError(msg, "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormWrapper error={error} loading={loading} onSubmit={soumettre} onCancel={onCancel} submitLabel="Planifier et suspendre" submitIcon={CalendarCheck}>
      <Field label="Date de la visite *"><input type="date" value={dateVisite} onChange={(e) => setDateVisite(e.target.value)} className={inputCls} /></Field>
    </FormWrapper>
  );
}

function ClotureForm({ demande, onSuccess, onCancel }) {
  const [dateReception, setDateReception] = useState("");
  const [produits,      setProduits]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const { success, error: toastError } = useToast();

  // 1. التعديل الجوهري: البحث عن التكملة النشطة في المصفوفة الجديدة V2.0
  const activeComplement = demande?.complements?.find((c) => c.suspensionActive);

  async function soumettre() {
    if (!dateReception) { setError("La date de réception est requise"); return; }
    if (!activeComplement) { setError("Aucune suspension de complément active trouvée"); return; }
    
    setLoading(true); setError(null);
    try {
      // 2. إرسال ID التكملة النشطة للـ Backend
      await complementService.cloturerComplement(activeComplement.id, {
        dateReceptionCpl: dateReception,
        produits: produits ? produits.split(",").map((p) => p.trim()).filter(Boolean) : undefined,
      });
      
      success("La suspension est levée. Le délai a repris.", "Suspension clôturée");
      onSuccess();
    } catch (err) {
      const msg = err?.message ?? "Erreur lors de la clôture";
      setError(msg);
      toastError(msg, "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormWrapper error={error} loading={loading} onSubmit={soumettre} onCancel={onCancel} submitLabel="Clôturer et reprendre" submitIcon={XCircle}>
      <Field label="Date de réception *"><input type="date" value={dateReception} onChange={(e) => setDateReception(e.target.value)} className={inputCls} /></Field>
      <Field label="Produits reçus (AF, AdF… séparés par virgule)">
        <input type="text" value={produits} placeholder="ex: AF" onChange={(e) => setProduits(e.target.value)} className={inputCls} />
        <p className="mt-1 text-xs text-slate-400">Saisir "AF" ou "AdF" clôturera définitivement le dossier.</p>
      </Field>
    </FormWrapper>
  );
}

export default function ActionsSidebar({ suivi, demande, onSuccess }) {
  const [ouvert, setOuvert] = useState(null);
  if (!suivi || !demande) return null;

  // 💡 الحل الذكي: نبحث بأنفسنا لنتأكد هل توجد تكملة قيد الانتظار أم لا!
  const activeComplement = demande?.complements?.find((c) => c.suspensionActive);
  
  // نفعل الزر إذا وجدنا تكملة نشطة، أو إذا كان السيرفر يقول ذلك
  const suspensionActive = !!activeComplement || demande.suspensionActive || suivi.suspensionActive;
  
  const estCloture = suivi.stadeInstruction === "CLOTURE";
  const toggle = (p) => setOuvert((prev) => (prev === p ? null : p));

  return (
    <div className="space-y-3 lg:sticky lg:top-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Actions</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {estCloture ? "Dossier clôturé — aucune action disponible" : suspensionActive ? "Délai suspendu — clôturez la suspension pour reprendre" : "Sélectionnez une action à effectuer"}
          </p>
        </div>
        <div className="divide-y divide-slate-50 px-4 py-3 space-y-1">
          <ActionPanel id="complement" ouvert={ouvert === "complement"} onToggle={() => toggle("complement")} label="Demander un complément" description="Ouvre une suspension et gèle le délai" icon={PlusCircle} couleur="amber" disabled={estCloture || suspensionActive} disabledReason={estCloture ? "Dossier clôturé" : suspensionActive ? "Suspension déjà active" : null}>
            <ComplementForm suiviId={suivi.id} onSuccess={() => { setOuvert(null); onSuccess(); }} onCancel={() => setOuvert(null)} />
          </ActionPanel>
          <ActionPanel id="visite" ouvert={ouvert === "visite"} onToggle={() => toggle("visite")} label="Planifier une visite" description="Programme une visite de conformité" icon={MapPin} couleur="sky" disabled={estCloture || suspensionActive} disabledReason={estCloture ? "Dossier clôturé" : suspensionActive ? "Suspension déjà active" : null}>
            <VisiteForm suiviId={suivi.id} onSuccess={() => { setOuvert(null); onSuccess(); }} onCancel={() => setOuvert(null)} />
          </ActionPanel>
          <ActionPanel id="cloture" ouvert={ouvert === "cloture"} onToggle={() => toggle("cloture")} label="Clôturer la suspension" description="Enregistre la réponse et reprend le délai" icon={XCircle} couleur="emerald" disabled={estCloture || !suspensionActive} disabledReason={estCloture ? "Dossier clôturé" : !suspensionActive ? "Aucune suspension active" : null}>
            {/* تم تمرير demande بدلاً من suivi لكي نتمكن من استخراج التكملة النشطة */}
            <ClotureForm demande={demande} onSuccess={() => { setOuvert(null); onSuccess(); }} onCancel={() => setOuvert(null)} />
          </ActionPanel>
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Règles de suspension</p>
        <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
          {["Une seule suspension active à la fois", "Les jours suspendus s'ajoutent à l'échéancier", "Complément AF/AdF → clôture définitive"].map((r) => (
            <li key={r} className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
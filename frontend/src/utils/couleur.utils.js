// Chemin : frontend/src/utils/couleur.utils.js

/**
 * Source unique de vérité pour le mapping couleurStatut → tokens Tailwind.
 * Le Backend envoie : "VERT" | "ORANGE" | "ROUGE" | "GRIS"
 * Ce fichier traduit ces valeurs en classes CSS utilisables dans les composants.
 */

const COULEUR_MAP = {
  VERT: {
    badge:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot:     "bg-emerald-500",
    row:     "hover:bg-emerald-50/40",
    kpi:     "bg-emerald-500",
    light:   "bg-emerald-50",
    text:    "text-emerald-600",
    border:  "border-emerald-100",
    label:   "En cours",
    icon:    "check-circle",
  },
  ORANGE: {
    badge:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot:     "bg-amber-400",
    row:     "hover:bg-amber-50/40",
    kpi:     "bg-amber-400",
    light:   "bg-amber-50",
    text:    "text-amber-600",
    border:  "border-amber-100",
    label:   "Instruit",
    icon:    "clock",
  },
  ROUGE: {
    badge:   "bg-red-50 text-red-700 ring-1 ring-red-200",
    dot:     "bg-red-500",
    row:     "hover:bg-red-50/40",
    kpi:     "bg-red-500",
    light:   "bg-red-50",
    text:    "text-red-600",
    border:  "border-red-100",
    label:   "En retard",
    icon:    "alert-circle",
  },
  GRIS: {
    badge:   "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    dot:     "bg-slate-400",
    row:     "hover:bg-slate-50/40",
    kpi:     "bg-slate-400",
    light:   "bg-slate-50",
    text:    "text-slate-500",
    border:  "border-slate-100",
    label:   "Clôturé",
    icon:    "archive",
  },
};

/**
 * Retourne l'ensemble des tokens pour une couleur donnée.
 * Retombe sur GRIS si la couleur n'est pas reconnue.
 */
export function getCouleurTokens(couleur) {
  return COULEUR_MAP[couleur] ?? COULEUR_MAP.GRIS;
}

/** Raccourci — classes du badge uniquement. */
export function getBadgeClasses(couleur) {
  return getCouleurTokens(couleur).badge;
}

/**
 * Formate un délai restant (Integer) en texte lisible.
 *   null      → "—"
 *   négatif   → "Xj de retard"
 *   0         → "Échéance aujourd'hui"
 *   positif   → "Xj restants"
 */
export function formatDelaiRestant(jours) {
  if (jours == null)  return "—";
  if (jours < 0)      return `${Math.abs(jours)}j de retard`;
  if (jours === 0)    return "Échéance aujourd'hui";
  return `${jours}j restants`;
}

/**
 * Dérive la couleur depuis le délai restant — fallback côté Frontend
 * si le Backend n'a pas encore calculé couleurStatut.
 */
export function couleurFromDelai(jours) {
  if (jours == null) return "GRIS";
  if (jours < 0)     return "ROUGE";
  if (jours <= 5)    return "ORANGE";
  return "VERT";
}

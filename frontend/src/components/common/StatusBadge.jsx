// Chemin : frontend/src/components/common/StatusBadge.jsx
import { getCouleurTokens } from "../../utils/couleur.utils";

/**
 * Badge de statut coloré — réutilisé dans tous les tableaux et fiches.
 *
 * Props :
 *   couleur  — "VERT" | "ORANGE" | "ROUGE" | "GRIS"  (vient du Backend)
 *   label    — override du label (sinon utilise le label par défaut du mapping)
 *   size     — "sm" | "md" (défaut : "md")
 *   pulse    — true → animation de pulsation sur le dot (retards actifs)
 */
export default function StatusBadge({
  couleur,
  label,
  size = "md",
  pulse = false,
}) {
  const tokens       = getCouleurTokens(couleur);
  const displayLabel = label ?? tokens.label;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1.5"
      : "text-xs font-medium px-2.5 py-1 gap-2";

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClasses} ${tokens.badge}
      `}
    >
      {/* Dot avec animation de pulsation optionnelle */}
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span
            className={`
              animate-ping absolute inline-flex h-full w-full
              rounded-full opacity-75 ${tokens.dot}
            `}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${tokens.dot}`}
        />
      </span>
      {displayLabel}
    </span>
  );
}

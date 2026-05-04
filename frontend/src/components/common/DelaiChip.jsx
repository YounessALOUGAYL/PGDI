// Chemin : frontend/src/components/common/DelaiChip.jsx
import { formatDelaiRestant, getCouleurTokens } from "../../utils/couleur.utils";

/**
 * Chip affichant le délai restant formaté.
 * Utilisé dans les tableaux du Dashboard et de la liste des dossiers.
 *
 * Props :
 *   jours   — Integer | null  (vient de SuiviResponseDTO.delaiRestant)
 *   couleur — "VERT" | "ORANGE" | "ROUGE" | "GRIS"
 */
export default function DelaiChip({ jours, couleur }) {
  const tokens = getCouleurTokens(couleur);
  const texte  = formatDelaiRestant(jours);
  const isLate = jours != null && jours < 0;

  return (
    <span
      className={`
        inline-flex items-center gap-1 text-xs font-mono font-semibold
        tabular-nums whitespace-nowrap
        ${
          isLate
            ? `${tokens.badge} px-2 py-0.5 rounded-full`
            : "text-slate-600"
        }
      `}
    >
      {texte}
    </span>
  );
}
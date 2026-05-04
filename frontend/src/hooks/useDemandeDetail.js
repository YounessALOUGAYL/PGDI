// Chemin : frontend/src/hooks/useDemandeDetail.js
import { useState, useEffect, useCallback } from "react";
import demandeService from "../services/demande.service";
import suiviService   from "../services/suivi.service";

/**
 * Hook de la fiche dossier.
 *
 * Charge séquentiellement :
 *  1. La Demande via GET /demandes/:id
 *  2. Le Suivi lié via GET /suivis/:suiviId (si suiviId existe)
 *
 * Expose refresh() pour forcer le rechargement après toute action métier
 * (ouverture/clôture de suspension, etc.).
 *
 * @param {string|number} demandeId — ID de la demande (depuis useParams)
 *
 * Retourne :
 *   demande  — DemandeResponseDTO | null
 *   suivi    — SuiviResponseDTO | null
 *   loading  — boolean
 *   error    — string | null
 *   refresh  — () => void
 */
export function useDemandeDetail(demandeId) {
  const [demande,  setDemande]  = useState(null);
  const [suivi,    setSuivi]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const charger = useCallback(async () => {
    if (!demandeId) return;
    setLoading(true);
    setError(null);

    try {
      // Étape 1 : Demande
      const dem = await demandeService.getById(demandeId);
      setDemande(dem);

      // Étape 2 : Suivi lié (si existe)
      if (dem.suiviId) {
        const suv = await suiviService.getById(dem.suiviId);
        setSuivi(suv);
      } else {
        setSuivi(null);
      }
    } catch (err) {
      setError(err?.message ?? "Impossible de charger le dossier");
    } finally {
      setLoading(false);
    }
  }, [demandeId]);

  useEffect(() => {
    charger();
  }, [charger]);

  return { demande, suivi, loading, error, refresh: charger };
}

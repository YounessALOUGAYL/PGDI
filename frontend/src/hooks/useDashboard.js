// Chemin : frontend/src/hooks/useDashboard.js
import { useState, useEffect, useCallback } from "react";
import suiviService from "../services/suivi.service";

/**
 * Hook dédié à la page Dashboard.
 * Charge en parallèle les dossiers en retard et les dossiers en alerte.
 *
 * @param {number} joursAlerte - Fenêtre d'alerte préventive (défaut : 5)
 *
 * Retourne :
 *   retards       — SuiviResponseDTO[] (délai dépassé)
 *   alertes       — SuiviResponseDTO[] (échéance dans joursAlerte jours)
 *   loading       — boolean
 *   error         — string | null
 *   lastRefreshed — Date | null
 *   refresh()     — recharge les deux listes
 */
export function useDashboard(joursAlerte = 5) {
  const [state, setState] = useState({
    retards:       [],
    alertes:       [],
    loading:       true,
    error:         null,
    lastRefreshed: null,
  });

  const charger = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Appels en parallèle — pas de waterfall
      const [retards, alertes] = await Promise.all([
        suiviService.getEnRetard(),
        suiviService.getEnAlerte(joursAlerte),
      ]);
      setState({
        retards,
        alertes,
        loading:       false,
        error:         null,
        lastRefreshed: new Date(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:   err?.message ?? "Erreur lors du chargement du tableau de bord",
      }));
    }
  }, [joursAlerte]);

  useEffect(() => {
    charger();
  }, [charger]);

  return { ...state, refresh: charger };
}

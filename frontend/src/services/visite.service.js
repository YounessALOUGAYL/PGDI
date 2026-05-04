// Chemin : frontend/src/services/visite.service.js
import apiClient from "./api.service";
import { API_CONFIG } from "../config/api.config";

const BASE = API_CONFIG.ENDPOINTS.VISITES;

const visiteService = {

  /**
   * POST /visites?suiviId=X&dateVisite1=YYYY-MM-DD
   * Planifie une visite de conformité et ouvre la suspension.
   * @param {number} suiviId
   * @param {string} dateVisite1 - "YYYY-MM-DD"
   * @returns {SuiviResponseDTO} — suivi mis à jour
   */
  async planifier(suiviId, dateVisite1) {
    const { data } = await apiClient.post(BASE, null, {
      params: { suiviId, dateVisite1 },
    });
    return data;
  },

  /**
   * PUT /visites/:id/cloture?resultat=CONFORME
   * Enregistre dateVisite2 et clôture la suspension.
   * Si resultat = NON_CONFORME → une nouvelle visite peut être planifiée.
   * @param {number} id - ID de la VisiteConformite
   * @param {Object} payload - { dateReception: "YYYY-MM-DD" }
   * @param {string} resultat - "CONFORME" | "NON_CONFORME" | "EN_ATTENTE"
   * @returns {SuiviResponseDTO} — suivi mis à jour
   */
  async cloturerVisite(id, payload, resultat = "CONFORME") {
    const { data } = await apiClient.put(
      `${BASE}/${id}/cloture`,
      { dateReception: payload.dateReception },
      { params: { resultat } }
    );
    return data;
  },
};

export default visiteService;

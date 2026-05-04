// Chemin : frontend/src/services/suivi.service.js
import apiClient from "./api.service";
import { API_CONFIG } from "../config/api.config";

const BASE = API_CONFIG.ENDPOINTS.SUIVIS;

const suiviService = {

  /** GET /suivis/:id — Suivi complet avec suspensions */
  async getById(id) {
    const { data } = await apiClient.get(`${BASE}/${id}`);
    return data; // SuiviResponseDTO
  },

  /** GET /suivis/demande/:demandeId — Suivi lié à une demande */
  async getByDemandeId(demandeId) {
    const { data } = await apiClient.get(`${BASE}/demande/${demandeId}`);
    return data; // SuiviResponseDTO
  },

  /**
   * GET /suivis/en-retard
   * Tous les suivis dont le délai légal est dépassé (non clôturés).
   */
  async getEnRetard() {
    const { data } = await apiClient.get(`${BASE}/en-retard`);
    return data; // SuiviResponseDTO[]
  },

  /**
   * GET /suivis/alerte?jours=N
   * Suivis dont l'échéance arrive dans moins de N jours.
   * @param {number} jours - Fenêtre d'alerte (défaut : 5)
   */
  async getEnAlerte(jours = 5) {
    const { data } = await apiClient.get(`${BASE}/alerte`, {
      params: { jours },
    });
    return data; // SuiviResponseDTO[]
  },

  /**
   * PATCH /suivis/:id/date-reception
   * Enregistre la dateReceptionDMP — démarre le compteur du délai.
   * @param {number} id
   * @param {string} dateReception - "YYYY-MM-DD"
   */
  async enregistrerDateReception(id, dateReception) {
    const { data } = await apiClient.patch(
      `${BASE}/${id}/date-reception`,
      { dateReception }
    );
    return data; // SuiviResponseDTO mis à jour
  },

  /**
   * POST /suivis/:id/cloture
   * Clôture définitive manuelle du dossier.
   */
  async cloturerDossier(id) {
    const { data } = await apiClient.post(`${BASE}/${id}/cloture`);
    return data; // SuiviResponseDTO mis à jour
  },
};

export default suiviService;

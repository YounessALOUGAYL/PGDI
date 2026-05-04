// Chemin : frontend/src/services/complement.service.js
import apiClient from "./api.service";
import { API_CONFIG } from "../config/api.config";

const BASE = API_CONFIG.ENDPOINTS.COMPLEMENTS;

const complementService = {

  /**
   * POST /complements
   * Crée un complément ET ouvre la suspension du délai.
   * @param {Object} payload - ComplementRequestDTO
   * {
   *   suiviId: number,
   *   dateEnvoiCpl: "YYYY-MM-DD",
   *   produits?: string[]
   * }
   * @returns {SuiviResponseDTO} — suivi mis à jour (délai suspendu)
   */
  async creer(payload) {
    const { data } = await apiClient.post(BASE, payload);
    return data;
  },

  /**
   * PUT /complements/:id/cloture
   * Enregistre la réponse au complément et ferme la suspension.
   * Si produits contient "AF" ou "AdF" → dossier clôturé définitivement.
   * @param {number} id - ID du Complement
   * @param {Object} payload - ComplementReceptionDTO
   * {
   *   dateReceptionCpl: "YYYY-MM-DD",
   *   produits?: string[]
   * }
   * @returns {SuiviResponseDTO} — suivi mis à jour (délai repris)
   */
  async cloturerComplement(id, payload) {
    const { data } = await apiClient.put(`${BASE}/${id}/cloture`, payload);
    return data;
  },
};

export default complementService;

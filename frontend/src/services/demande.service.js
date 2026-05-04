// Chemin : frontend/src/services/demande.service.js
import apiClient from "./api.service";
import { API_CONFIG } from "../config/api.config";

const BASE = API_CONFIG.ENDPOINTS.DEMANDES;

const demandeService = {

  /** GET /demandes — Liste complète des demandes */
  async getAll() {
    const { data } = await apiClient.get(BASE);
    return data; // DemandeResponseDTO[]
  },

  /** GET /demandes/:id — Détail d'une demande */
  async getById(id) {
    const { data } = await apiClient.get(`${BASE}/${id}`);
    return data; // DemandeResponseDTO
  },

  /** GET /demandes/dossier/:numero — Recherche par numéro de dossier */
  async getByNumeroDossier(numero) {
    const { data } = await apiClient.get(`${BASE}/dossier/${numero}`);
    return data;
  },

  /**
   * POST /demandes — Création d'un nouveau dossier
   * @param {Object} payload - DemandeRequestDTO
   * {
   *   nomEtablissement: string,
   *   typeMotifDemande: string,
   *   dateDepot: "YYYY-MM-DD",
   *   typeDelaiLegal: "SGG_30J" | "AMMPS_60J" | "PERSONNALISE",
   *   nbJoursPersonnalise?: number,
   *   demandeurId: number
   * }
   */
  async create(payload) {
    const { data } = await apiClient.post(BASE, payload);
    return data; // DemandeResponseDTO
  },
};

export default demandeService;
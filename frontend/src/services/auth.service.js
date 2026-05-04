// Chemin : frontend/src/services/auth.service.js
import apiClient from "./api.service";
import { API_CONFIG } from "../config/api.config";
import { setTokens, clearTokens, decodePayload } from "../utils/jwt.utils";

const { AUTH } = API_CONFIG.ENDPOINTS;

const authService = {

  /**
   * POST /auth/login
   * Authentifie l'utilisateur et stocke les tokens dans localStorage.
   * Retourne le payload décodé du JWT : { id, nom, email, role, exp }
   */
  async login(email, motDePasse) {
    const { data } = await apiClient.post(AUTH.LOGIN, { email, motDePasse });
    // data = AuthResponseDTO { accessToken, refreshToken, id, nom, email, role }
    setTokens(data.accessToken, data.refreshToken);
    // On retourne le profil depuis le DTO directement (plus fiable que décoder)
    return {
      id:    data.id,
      nom:   data.nom,
      email: data.email,
      role:  data.role,
    };
  },

  /**
   * POST /auth/logout
   * Informe le serveur (logs d'audit), puis nettoie localStorage.
   * On nettoie quoi qu'il arrive (finally) — même si le serveur est injoignable.
   */
  async logout() {
    try {
      await apiClient.post(AUTH.LOGOUT);
    } finally {
      clearTokens();
    }
  },

  /**
   * GET /auth/me
   * Récupère le profil frais de l'utilisateur connecté depuis le serveur.
   * Appelé au montage de AuthProvider pour hydrater le contexte.
   */
  async fetchMe() {
    const { data } = await apiClient.get(AUTH.ME);
    // data = AuthResponseDTO { id, nom, email, role } (sans tokens)
    return {
      id:    data.id,
      nom:   data.nom,
      email: data.email,
      role:  data.role,
    };
  },
};

export default authService;

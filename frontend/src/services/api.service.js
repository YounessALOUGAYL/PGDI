// Chemin : frontend/src/services/api.service.js
import axios from "axios";
import { API_CONFIG } from "../config/api.config";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
} from "../utils/jwt.utils";

// ─── Instance Axios partagée ──────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// ─── File d'attente pour les requêtes bloquées pendant le refresh ─────────────
// Évite d'envoyer N appels /refresh simultanés si plusieurs requêtes expirent
// en même temps (ex : dashboard qui charge 3 ressources en parallèle).

let isRefreshing = false;
let pendingQueue = []; // [{ resolve, reject }]

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
}

// ─── Intercepteur REQUEST ── injecte le JWT ───────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Intercepteur RESPONSE ── gère les 401 et le refresh silencieux ───────────

apiClient.interceptors.response.use(
  // Réponse 2xx — on laisse passer tel quel
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Cas non-401 ou requête déjà retentée → propagation immédiate
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(normalizeError(error));
    }

    const refreshToken = getRefreshToken();

    // Pas de refresh token valide → déconnexion forcée
    if (!refreshToken || isTokenExpired(refreshToken)) {
      handleForcedLogout();
      return Promise.reject(normalizeError(error));
    }

    // Un refresh est déjà en cours → mise en file d'attente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    // Démarrage du refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefresh } = data;
      setTokens(accessToken, newRefresh);
      flushQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);

    } catch (refreshError) {
      flushQueue(refreshError);
      handleForcedLogout();
      return Promise.reject(normalizeError(refreshError));

    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Déconnexion forcée ───────────────────────────────────────────────────────
// Publie un événement custom écouté par AuthContext.
// Évite une dépendance circulaire entre api.service et AuthContext.

function handleForcedLogout() {
  clearTokens();
  window.dispatchEvent(new CustomEvent("auth:force-logout"));
}

// ─── Normalisation des erreurs ────────────────────────────────────────────────
// Garantit que chaque erreur rejetée a toujours la même forme,
// identique à ApiErrorDTO côté Backend :
// { status, message, path?, timestamp? }

function normalizeError(error) {
  if (error.response?.data && typeof error.response.data === "object") {
    return error.response.data;
  }
  if (error.code === "ECONNABORTED") {
    return { status: 408, message: "La requête a expiré. Vérifiez votre connexion." };
  }
  if (!error.response) {
    return { status: 0, message: "Impossible de joindre le serveur (http://localhost:8080)." };
  }
  return {
    status:  error.response.status,
    message: "Une erreur inattendue est survenue.",
  };
}

export default apiClient;

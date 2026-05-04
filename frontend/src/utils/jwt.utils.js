// Chemin : frontend/src/utils/jwt.utils.js
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "../config/api.config";

/**
 * Décode le payload JWT (base64url) sans vérification de signature.
 * Retourne null si le token est invalide ou absent.
 */
export function decodePayload(token) {
  if (!token) return null;
  try {
    const base64 = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Retourne true si le token est expiré ou structurellement invalide.
 * exp est en secondes dans le payload JWT.
 */
export function isTokenExpired(token) {
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  // Marge de 10 secondes pour éviter les race conditions
  return payload.exp * 1000 < Date.now() - 10_000;
}

/** Lecture depuis localStorage. */
export const getAccessToken  = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

/** Écriture dans localStorage. */
export function setTokens(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/** Suppression complète des tokens (logout ou expiration). */
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

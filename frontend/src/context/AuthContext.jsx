// Chemin : frontend/src/context/AuthContext.jsx
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import authService from "../services/auth.service";
import { getAccessToken, isTokenExpired, clearTokens } from "../utils/jwt.utils";

export const AuthContext = createContext(null);

/**
 * Provider d'authentification.
 *
 * État de `user` :
 *   null  → hydratation en cours (loading = true)
 *   false → chargé, utilisateur non connecté
 *   {...} → { id, nom, email, role } — utilisateur connecté
 */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Hydratation initiale ──────────────────────────────────────────────────
  // Au montage du Provider, on vérifie si un token valide existe en localStorage.
  // Si oui → on rafraîchit le profil depuis le serveur (données fraîches).
  // Si non → utilisateur non connecté.

  useEffect(() => {
    async function hydrater() {
      const token = getAccessToken();

      if (!token || isTokenExpired(token)) {
        clearTokens();
        setUser(false);
        setLoading(false);
        return;
      }

      try {
        // Token valide → récupération du profil depuis /auth/me
        const profile = await authService.fetchMe();
        setUser(profile);
      } catch {
        // /auth/me a échoué (token révoqué côté serveur, compte désactivé…)
        clearTokens();
        setUser(false);
      } finally {
        setLoading(false);
      }
    }

    hydrater();
  }, []);

  // ── Écoute la déconnexion forcée de l'intercepteur Axios ─────────────────
  // api.service.js dispatch "auth:force-logout" quand le refresh token expire.
  // AuthContext réagit sans couplage direct avec Axios.

  useEffect(() => {
    function onForceLogout() {
      setUser(false);
    }
    window.addEventListener("auth:force-logout", onForceLogout);
    return () => window.removeEventListener("auth:force-logout", onForceLogout);
  }, []);

  // ── Actions exposées ──────────────────────────────────────────────────────

  const login = useCallback(async (email, motDePasse) => {
    const profile = await authService.login(email, motDePasse);
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(false);
  }, []);

  // ── Helpers de rôle ───────────────────────────────────────────────────────
  // Centralisés ici — les composants n'accèdent jamais à user.role directement.

  const hasRole = useCallback(
    (role) => user && user.role === role,
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles) => user && roles.includes(user.role),
    [user]
  );

  // ── Valeur mémoïsée ───────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole,
      hasAnyRole,
    }),
    [user, loading, login, logout, hasRole, hasAnyRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

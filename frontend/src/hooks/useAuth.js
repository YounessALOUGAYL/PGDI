// Chemin : frontend/src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook d'accès au contexte d'authentification.
 *
 * Lève une erreur explicite si utilisé en dehors d'un <AuthProvider>.
 *
 * Usage :
 *   const { user, isAuthenticated, hasRole, hasAnyRole, login, logout } = useAuth();
 *
 * Valeurs retournées :
 *   user            — { id, nom, email, role } | false | null
 *   loading         — true pendant l'hydratation initiale
 *   isAuthenticated — boolean (false si user = false ou null)
 *   hasRole(role)   — true si user.role === role
 *   hasAnyRole(...) — true si user.role est dans la liste
 *   login(email, mdp) — Promise → profile
 *   logout()          — Promise → void
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      "[useAuth] Ce hook doit être utilisé à l'intérieur d'un <AuthProvider>.\n" +
      "Vérifie que <AuthProvider> englobe ton <App /> dans main.jsx."
    );
  }

  return context;
}

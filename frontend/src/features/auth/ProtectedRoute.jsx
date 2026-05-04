// Chemin : frontend/src/features/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Garde de route — vérifie authentification et rôle.
 *
 * Usage :
 *   // Tout utilisateur connecté
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 *
 *   // Rôles spécifiques
 *   <Route element={<ProtectedRoute allowedRoles={["ADMIN", "EVALUATEUR"]} />}>
 *     <Route path="/admin" element={<AdminPage />} />
 *   </Route>
 *
 * Props :
 *   allowedRoles — string[] (défaut : [] = tout rôle connecté autorisé)
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  // Pendant l'hydratation initiale → spinner pleine page
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2
                          border-slate-200 border-t-slate-600" />
          <span className="text-xs text-slate-400">Chargement…</span>
        </div>
      </div>
    );
  }

  // Non authentifié → /login en conservant l'URL cible
  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  // Rôle insuffisant → /unauthorized
  if (allowedRoles.length > 0 && !hasAnyRole(...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
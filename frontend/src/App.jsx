// Chemin : frontend/src/App.jsx  — version mise à jour
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";   // ← ajout
import ProtectedRoute    from "./features/auth/ProtectedRoute";
import AppLayout         from "./components/layout/AppLayout";
import LoginPage         from "./features/auth/LoginPage";
import DashboardPage     from "./features/dashboard/DashboardPage";
import DemandesListPage  from "./features/demandes/DemandesListPage";
import DemandeDetailPage from "./features/demandes/DemandeDetailPage";

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-4xl font-bold text-slate-200">403</p>
        <p className="mt-2 font-semibold text-slate-700">Accès refusé</p>
        <p className="mt-1 text-sm text-slate-400">
          Vous n'avez pas les droits pour accéder à cette page.
        </p>
        <a href="/dashboard"
           className="mt-4 inline-block text-sm text-slate-500 underline
                      underline-offset-2 hover:text-slate-700">
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>                      {/* ← enveloppe toute l'app */}
          <Routes>
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                <Route element={
                  <ProtectedRoute allowedRoles={["ADMIN","EVALUATEUR","AGENT"]} />
                }>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                <Route element={
                  <ProtectedRoute
                    allowedRoles={["ADMIN","EVALUATEUR","AGENT","DEMANDEUR"]}
                  />
                }>
                  <Route path="/demandes"     element={<DemandesListPage />} />
                  <Route path="/demandes/:id" element={<DemandeDetailPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
// Chemin : frontend/src/features/auth/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email,      setEmail]      = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible,    setVisible]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !motDePasse) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), motDePasse);
      // La redirection est gérée par le useEffect ci-dessus
    } catch (err) {
      setError(err?.message ?? "Identifiants invalides. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center
                    bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center
                          rounded-2xl bg-slate-900 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">GestionDélais</h1>
          <p className="text-sm text-slate-500">
            Plateforme de suivi des délais d'instruction
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="rounded-2xl border border-slate-200 bg-white
                        p-8 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-slate-800">
            Connexion à votre espace
          </h2>

          {/* Erreur */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg
                            bg-red-50 px-3 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase
                           tracking-wider text-slate-500"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.ma"
                className="
                  w-full rounded-lg border border-slate-200 bg-slate-50
                  px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400
                  focus:border-slate-500 focus:bg-white focus:outline-none
                  transition
                "
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label
                htmlFor="motDePasse"
                className="block text-xs font-semibold uppercase
                           tracking-wider text-slate-500"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="motDePasse"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="
                    w-full rounded-lg border border-slate-200 bg-slate-50
                    py-2.5 pl-3 pr-10 text-sm text-slate-800
                    focus:border-slate-500 focus:bg-white focus:outline-none
                    transition
                  "
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600"
                >
                  {visible
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="
                mt-2 flex w-full items-center justify-center gap-2
                rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold
                text-white shadow-sm transition hover:bg-slate-700
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Connexion…</>
                : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Accès réservé au personnel autorisé.
        </p>
      </div>
    </div>
  );
}
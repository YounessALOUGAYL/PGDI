// Chemin : frontend/src/features/demandes/DemandesListPage.jsx
import { useState } from "react";
import {
  Search, SlidersHorizontal, RefreshCw, ChevronUp,
  ChevronDown, ChevronsUpDown, ArrowUpRight,
  FileText, AlertTriangle, X, Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemandes }          from "../../hooks/useDemandes";
import { useToast }             from "../../context/ToastContext";
import { useAuth }              from "../../hooks/useAuth";
import StatusBadge              from "../../components/common/StatusBadge";
import DelaiChip                from "../../components/common/DelaiChip";
import DemandeCreateModal       from "./DemandeCreateModal";
import { getCouleurTokens }     from "../../utils/couleur.utils";

// ── Constantes ────────────────────────────────────────────────────────────────

const STADES = [
  { value: "TOUS",      label: "Tous les stades" },
  { value: "INSTRUIT",  label: "Instruit"         },
  { value: "EN_COURS",  label: "En cours"         },
  { value: "EN_RETARD", label: "En retard"        },
  { value: "CLOTURE",   label: "Clôturé"          },
];

const COULEURS = [
  { value: "TOUS",   label: "Toutes les couleurs" },
  { value: "VERT",   label: "🟢  En cours"         },
  { value: "ORANGE", label: "🟡  Instruit"          },
  { value: "ROUGE",  label: "🔴  En retard"         },
  { value: "GRIS",   label: "⚫  Clôturé"           },
];

const COLONNES = [
  { key: "numeroDossier",    label: "N° Dossier",    sortable: true  },
  { key: "nomEtablissement", label: "Établissement", sortable: true  },
  { key: "typeDelaiLegal",   label: "Type",          sortable: false },
  { key: "dateDepot",        label: "Dépôt",         sortable: true  },
  { key: "echeancierAMMPS",    label: "Échéance",      sortable: true  },
  { key: "delaiRestant",     label: "Délai restant", sortable: true  },
  { key: "stadeInstruction", label: "Statut",        sortable: false },
  { key: "evaluateurNom",    label: "Évaluateur",    sortable: true  },
  { key: "_action",          label: "",              sortable: false },
];

// ── Sous-composants ───────────────────────────────────────────────────────────

function ThSortable({ col, tri, onToggle }) {
  const actif = tri.colonne === col.key;
  const Icon  =
    actif
      ? tri.direction === "asc" ? ChevronUp : ChevronDown
      : ChevronsUpDown;

  return (
    <th
      onClick={() => col.sortable && onToggle(col.key)}
      className={`
        px-3 py-3 text-left text-xs font-semibold uppercase
        tracking-wider whitespace-nowrap select-none
        ${col.sortable ? "cursor-pointer hover:text-slate-700" : ""}
        ${actif ? "text-slate-700" : "text-slate-400"}
      `}
    >
      <span className="inline-flex items-center gap-1">
        {col.label}
        {col.sortable && (
          <Icon className={`h-3 w-3 ${actif ? "text-slate-600" : "text-slate-300"}`} />
        )}
      </span>
    </th>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      {COLONNES.map((c) => (
        <td key={c.key} className="px-3 py-3.5">
          <div
            className="h-3 rounded bg-slate-100"
            style={{ width: c.key === "_action" ? 16 : "70%" }}
          />
        </td>
      ))}
    </tr>
  );
}

function fmtDate(iso) {
  if (!iso) return <span className="text-slate-300">—</span>;
  const [y, m, d] = iso.split("-");
  return <span className="tabular-nums text-slate-600">{d}/{m}/{y}</span>;
}

function Pagination({ page, totalPages, total, pageSize, onPage }) {
  if (totalPages <= 1) return null;
  const debut = (page - 1) * pageSize + 1;
  const fin   = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-400">
        {debut}–{fin} sur{" "}
        <strong className="text-slate-600">{total}</strong> dossiers
      </p>
      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onPage(page - 1)} disabled={page === 1}>‹</PagBtn>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <PagBtn key={p} onClick={() => onPage(p)} active={p === page}>{p}</PagBtn>
        ))}
        <PagBtn onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</PagBtn>
      </div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        h-7 min-w-[1.75rem] rounded px-2 text-xs font-medium transition
        ${active
          ? "bg-slate-800 text-white"
          : "text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"}
      `}
    >
      {children}
    </button>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DemandesListPage() {
  const navigate   = useNavigate();
  const { success } = useToast();
  const { hasAnyRole } = useAuth();

  const {
    données, total, totalDossiers,
    recherche, setRecherche,
    filtreStade, setFiltreStade,
    filtreCouleur, setFiltreCouleur,
    tri, toggleTri,
    page, setPage, totalPages, pageSize,
    loading, error, refresh,
  } = useDemandes();

  const [modalCreate, setModalCreate] = useState(false);

  const filtresActifs =
    recherche !== "" || filtreStade !== "TOUS" || filtreCouleur !== "TOUS";

  const resetFiltres = () => {
    setRecherche("");
    setFiltreStade("TOUS");
    setFiltreCouleur("TOUS");
  };

  function handleCreated(demande) {
    setModalCreate(false);
    success(
      `Le dossier ${demande.numeroDossier} a été créé avec succès.`,
      "Dossier créé"
    );
    refresh();
  }

  // Seuls ADMIN, EVALUATEUR et AGENT peuvent créer
  const peutCreer = hasAnyRole("ADMIN", "EVALUATEUR", "AGENT");

  return (
    <div className="page-enter min-h-screen bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dossiers
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Chargement…"
                : `${totalDossiers} dossier${totalDossiers !== 1 ? "s" : ""} au total`}
            </p>
          </div>

          {/* Actions en-tête */}
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="
                inline-flex items-center gap-1.5 rounded-lg border border-slate-200
                bg-white px-3 py-1.5 text-xs font-medium text-slate-600
                shadow-sm transition hover:bg-slate-50 disabled:opacity-50
              "
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>

            {/* Bouton "Nouveau dossier" — conditionnel selon le rôle */}
            {peutCreer && (
              <button
                onClick={() => setModalCreate(true)}
                className="
                  inline-flex items-center gap-1.5 rounded-lg bg-slate-900
                  px-3 py-1.5 text-xs font-semibold text-white shadow-sm
                  transition hover:bg-slate-700
                "
              >
                <Plus className="h-3.5 w-3.5" />
                Nouveau dossier
              </button>
            )}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border
                          border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Carte tableau */}
        <div className="overflow-hidden rounded-xl border border-slate-200
                        bg-white shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3
                          border-b border-slate-100 px-4 py-3">
            {/* Recherche */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5
                                 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="N° dossier ou établissement…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="
                  w-full rounded-lg border border-slate-200 bg-slate-50
                  py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400
                  focus:border-slate-400 focus:bg-white focus:outline-none transition
                "
              />
              {recherche && (
                <button
                  onClick={() => setRecherche("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Filtre stade */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={filtreStade}
                onChange={(e) => setFiltreStade(e.target.value)}
                className="
                  rounded-lg border border-slate-200 bg-slate-50 py-2
                  pl-2.5 pr-7 text-sm text-slate-700 focus:border-slate-400
                  focus:bg-white focus:outline-none transition appearance-none
                "
              >
                {STADES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Filtre couleur */}
            <select
              value={filtreCouleur}
              onChange={(e) => setFiltreCouleur(e.target.value)}
              className="
                rounded-lg border border-slate-200 bg-slate-50 py-2
                pl-2.5 pr-7 text-sm text-slate-700 focus:border-slate-400
                focus:bg-white focus:outline-none transition appearance-none
              "
            >
              {COULEURS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {filtresActifs && (
              <button
                onClick={resetFiltres}
                className="
                  inline-flex items-center gap-1 rounded-lg border border-slate-200
                  px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50
                  hover:text-slate-700 transition
                "
              >
                <X className="h-3 w-3" />
                Réinitialiser
              </button>
            )}

            <span className="ml-auto text-xs text-slate-400">
              {filtresActifs
                ? `${total} résultat${total !== 1 ? "s" : ""}`
                : `${total} dossier${total !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60">
                <tr>
                  {COLONNES.map((c) => (
                    <ThSortable key={c.key} col={c} tri={tri} onToggle={toggleTri} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">

                {loading && Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

                {!loading && données.map((d) => {
                  const tokens = getCouleurTokens(d.couleurStatut);
                  const isLate = d.couleurStatut === "ROUGE";
                  return (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/demandes/${d.id}`)}
                      className={`
                        group cursor-pointer border-b border-slate-50/80
                        transition-colors duration-100
                        ${tokens.row} ${isLate ? "bg-red-50/20" : ""}
                      `}
                    >
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-300
                                               group-hover:text-slate-400 transition-colors" />
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {d.numeroDossier}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 max-w-[200px]">
                        <p className="truncate font-medium text-slate-800">
                          {d.nomEtablissement}
                        </p>
                        {d.typeMotifDemande && (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {d.typeMotifDemande}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5
                                         text-xs font-medium text-slate-500">
                          {d.typeDelaiLegal?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-xs">{fmtDate(d.dateDepot)}</td>
                      <td className="px-3 py-3.5 text-xs">{fmtDate(d.echeancierAMMPS)}</td>
                      <td className="px-3 py-3.5">
                        <DelaiChip jours={d.delaiRestant} couleur={d.couleurStatut} />
                        {d.suspensionActive && (
                          <span className="ml-1.5 text-xs italic text-slate-400">
                            suspendu
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge
                          couleur={d.couleurStatut}
                          pulse={isLate}
                          size="sm"
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-xs text-slate-500">
                          {d.evaluateurNom ?? (
                            <span className="italic text-slate-300">Non assigné</span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-200
                                                  group-hover:text-slate-400 transition-colors" />
                      </td>
                    </tr>
                  );
                })}

                {!loading && données.length === 0 && (
                  <tr>
                    <td colSpan={COLONNES.length} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Search className="h-8 w-8 opacity-30" />
                        <p className="text-sm font-medium">Aucun dossier trouvé</p>
                        {filtresActifs && (
                          <button
                            onClick={resetFiltres}
                            className="mt-1 text-xs text-slate-500 underline
                                       underline-offset-2 hover:text-slate-700"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                        {peutCreer && !filtresActifs && (
                          <button
                            onClick={() => setModalCreate(true)}
                            className="
                              mt-2 inline-flex items-center gap-1.5 rounded-lg
                              bg-slate-900 px-3 py-1.5 text-xs font-semibold
                              text-white transition hover:bg-slate-700
                            "
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Créer le premier dossier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPage={setPage}
            />
          )}
        </div>
      </div>

      {/* Modale création */}
      <DemandeCreateModal
        isOpen={modalCreate}
        onClose={() => setModalCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
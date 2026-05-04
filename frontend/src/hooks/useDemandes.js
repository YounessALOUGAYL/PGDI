// Chemin : frontend/src/hooks/useDemandes.js
import { useState, useEffect, useCallback, useMemo } from "react";
import demandeService from "../services/demande.service";

/**
 * Hook de la liste des demandes.
 *
 * Responsabilités :
 *  - Chargement de toutes les demandes depuis GET /demandes
 *  - Filtrage local (recherche textuelle + filtre stade + filtre couleur)
 *  - Tri multi-colonnes local
 *  - Pagination locale (PAGE_SIZE = 15)
 *
 * Retourne :
 *   données         — DemandeResponseDTO[] (page courante)
 *   total           — nombre de résultats filtrés
 *   totalDossiers   — nombre total sans filtre
 *   recherche / setRecherche
 *   filtreStade / setFiltreStade
 *   filtreCouleur / setFiltreCouleur
 *   tri / toggleTri
 *   page / setPage / totalPages / pageSize
 *   loading / error / refresh
 */
export function useDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [recherche,     setRecherche]     = useState("");
  const [filtreStade,   setFiltreStade]   = useState("TOUS");
  const [filtreCouleur, setFiltreCouleur] = useState("TOUS");
  const [tri,           setTri]           = useState({
    colonne:   "delaiRestant",
    direction: "asc",
  });

  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);

  // ── Chargement ─────────────────────────────────────────────────────────────

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await demandeService.getAll();
      // Normalise les données en ligne de tableau
      const lignes = data.map((d) => ({
        id:               d.id,
        suiviId:          d.suiviId          ?? null,
        numeroDossier:    d.numeroDossier,
        nomEtablissement: d.nomEtablissement,
        typeMotifDemande: d.typeMotifDemande  ?? null,
        dateDepot:        d.dateDepot,
        typeDelaiLegal:   d.typeDelaiLegal,
        demandeurNom:     d.demandeurNom      ?? null,
        stadeInstruction: d.stadeInstruction  ?? "INSTRUIT",
        delaiRestant:     d.delaiRestant      ?? null,
        echeancierDMP:    d.echeancierDMP     ?? null,
        couleurStatut:    d.couleurStatut     ?? "GRIS",
        evaluateurNom:    d.evaluateurNom     ?? null,
        suspensionActive: d.suspensionActive  ?? false,
      }));
      setDemandes(lignes);
    } catch (err) {
      setError(err?.message ?? "Impossible de charger les dossiers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // Remet à la page 1 à chaque changement de filtre
  useEffect(() => {
    setPage(1);
  }, [recherche, filtreStade, filtreCouleur]);

  // ── Filtrage local ─────────────────────────────────────────────────────────

  const filtrés = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return demandes.filter((d) => {
      const matchRecherche =
        !q ||
        d.numeroDossier?.toLowerCase().includes(q) ||
        d.nomEtablissement?.toLowerCase().includes(q) ||
        d.evaluateurNom?.toLowerCase().includes(q);

      const matchStade =
        filtreStade === "TOUS" || d.stadeInstruction === filtreStade;

      const matchCouleur =
        filtreCouleur === "TOUS" || d.couleurStatut === filtreCouleur;

      return matchRecherche && matchStade && matchCouleur;
    });
  }, [demandes, recherche, filtreStade, filtreCouleur]);

  // ── Tri local ──────────────────────────────────────────────────────────────

  const triés = useMemo(() => {
    const { colonne, direction } = tri;
    return [...filtrés].sort((a, b) => {
      let va = a[colonne];
      let vb = b[colonne];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number") {
        return direction === "asc" ? va - vb : vb - va;
      }
      const cmp = String(va).localeCompare(String(vb), "fr");
      return direction === "asc" ? cmp : -cmp;
    });
  }, [filtrés, tri]);

  // ── Pagination locale ──────────────────────────────────────────────────────

  const totalPages   = Math.max(1, Math.ceil(triés.length / PAGE_SIZE));
  const pageCourante = Math.min(page, totalPages);
  const données      = triés.slice(
    (pageCourante - 1) * PAGE_SIZE,
    pageCourante * PAGE_SIZE
  );

  const toggleTri = useCallback((colonne) => {
    setTri((prev) =>
      prev.colonne === colonne
        ? { colonne, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { colonne, direction: "asc" }
    );
  }, []);

  return {
    données,
    total:         triés.length,
    totalDossiers: demandes.length,
    recherche,    setRecherche,
    filtreStade,  setFiltreStade,
    filtreCouleur, setFiltreCouleur,
    tri,          toggleTri,
    page: pageCourante, setPage, totalPages, pageSize: PAGE_SIZE,
    loading,      error,         refresh: charger,
  };
}
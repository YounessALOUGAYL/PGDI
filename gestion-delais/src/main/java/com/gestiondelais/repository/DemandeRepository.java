// Chemin : backend/src/main/java/com/gestiondelais/repository/DemandeRepository.java
package com.gestiondelais.repository;

import com.gestiondelais.model.Demande;
import com.gestiondelais.model.enums.StatutFinalEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeRepository extends JpaRepository<Demande, Long> {

    Optional<Demande> findByNumeroDossier(String numeroDossier);
    List<Demande>     findByDemandeurId(Long demandeurId);
    List<Demande>     findByStatutFinal(StatutFinalEnum statutFinal);
    boolean           existsByNumeroDossier(String numeroDossier);

    /**
     * Charge toutes les demandes avec :
     *   - Suivi + Évaluateur + Demandeur  → évite N+1 sur les champs calculés
     *   - Suivi.complements               → nécessaire pour ComplementDTO dans la liste
     *
     * Note : on ne peut pas JOIN FETCH deux collections en parallèle (MultipleBagFetchException).
     * On fait donc deux requêtes séparées via @EntityGraph ou deux passes JPQL.
     * Solution retenue : JOIN FETCH complements dans une requête dédiée,
     * chargement des suspensions laissé LAZY (non nécessaire pour la liste).
     */
    @Query("""
        SELECT DISTINCT d FROM Demande d
        LEFT JOIN FETCH d.demandeur
        LEFT JOIN FETCH d.suivi s
        LEFT JOIN FETCH s.evaluateur
        ORDER BY d.id DESC
    """)
    List<Demande> findAllAvecSuivi();

    /**
     * Charge une demande avec son Suivi, ses Compléments et ses Visites
     * pour la vue détail — utilisé dans getDemande(:id).
     *
     * Stratégie : deux requêtes JPQL séquentielles pour éviter
     * MultipleBagFetchException (on ne peut JOIN FETCH qu'une seule
     * collection par requête avec Hibernate).
     *
     * La première requête charge Suivi + Évaluateur + Demandeur.
     * Hibernate peuple ensuite automatiquement complements via
     * le second appel findComplementsByDemandeId.
     */
    @Query("""
        SELECT d FROM Demande d
        LEFT JOIN FETCH d.demandeur
        LEFT JOIN FETCH d.suivi s
        LEFT JOIN FETCH s.evaluateur
        WHERE d.id = :id
    """)
    Optional<Demande> findByIdAvecSuivi(@Param("id") Long id);

    /**
     * Charge les compléments d'une demande séparément pour éviter
     * MultipleBagFetchException.
     * Appelé juste après findByIdAvecSuivi() dans le Controller détail.
     */
    @Query("""
        SELECT d FROM Demande d
        LEFT JOIN FETCH d.suivi s
        LEFT JOIN FETCH s.complements
        WHERE d.id = :id
    """)
    Optional<Demande> findByIdAvecComplements(@Param("id") Long id);
}

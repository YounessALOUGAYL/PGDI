// Chemin : backend/src/main/java/com/gestiondelais/repository/DemandeRepository.java
package com.gestiondelais.repository;

import com.gestiondelais.model.Demande;
import com.gestiondelais.model.enums.StatutFinalEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
     * Charge toutes les demandes avec leur Suivi et l'Évaluateur du Suivi
     * en une seule requête SQL (JOIN FETCH).
     *
     * Sans ce JOIN FETCH, Hibernate génère N+1 requêtes en accédant à
     * suivi.getDelaiRestant(), suivi.getEvaluateur() etc. pour chaque ligne.
     *
     * LEFT JOIN FETCH → inclut les demandes sans Suivi (ne devrait pas arriver
     * en production mais sécurise la migration).
     */
    @Query("""
        SELECT d FROM Demande d
        LEFT JOIN FETCH d.suivi s
        LEFT JOIN FETCH s.evaluateur
        LEFT JOIN FETCH d.demandeur
        ORDER BY d.id DESC
    """)
    List<Demande> findAllAvecSuivi();

    /**
     * Idem pour une demande unitaire — utilisé dans getDemande(:id)
     * pour éviter les lazy load en dehors d'une transaction ouverte.
     */
    @Query("""
        SELECT d FROM Demande d
        LEFT JOIN FETCH d.suivi s
        LEFT JOIN FETCH s.evaluateur
        LEFT JOIN FETCH d.demandeur
        WHERE d.id = :id
    """)
    Optional<Demande> findByIdAvecSuivi(Long id);
}
// Chemin : backend/src/main/java/com/gestiondelais/repository/SuiviRepository.java
package com.gestiondelais.repository;

import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.enums.StadeEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SuiviRepository extends JpaRepository<Suivi, Long> {

    Optional<Suivi> findByDemandeId(Long demandeId);
    List<Suivi>     findByEvaluateurId(Long evaluateurId);
    List<Suivi>     findByStadeInstruction(StadeEnum stade);

    @Query("""
        SELECT s FROM Suivi s
        WHERE s.echeancierDMP < :aujourdhui
          AND s.stadeInstruction != com.gestiondelais.model.enums.StadeEnum.CLOTURE
    """)
    List<Suivi> findSuivisEnRetard(@Param("aujourdhui") LocalDate aujourdhui);

    @Query("""
        SELECT s FROM Suivi s
        WHERE s.echeancierDMP BETWEEN :aujourdhui AND :limite
          AND s.stadeInstruction != com.gestiondelais.model.enums.StadeEnum.CLOTURE
    """)
    List<Suivi> findSuivisProchesEcheance(
        @Param("aujourdhui") LocalDate aujourdhui,
        @Param("limite")     LocalDate limite
    );

    @Query("""
        SELECT s FROM Suivi s
        JOIN FETCH s.demande d
        WHERE s.stadeInstruction != com.gestiondelais.model.enums.StadeEnum.CLOTURE
          AND s.dateReceptionDMP IS NOT NULL
    """)
    List<Suivi> findSuivisEligiblesRecalcul();
}
// Chemin : backend/src/main/java/com/gestiondelais/repository/SuspensionDelaiRepository.java
package com.gestiondelais.repository;

import com.gestiondelais.model.SuspensionDelai;
import com.gestiondelais.model.enums.MotifSuspensionEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuspensionDelaiRepository extends JpaRepository<SuspensionDelai, Long> {

    List<SuspensionDelai> findBySuiviId(Long suiviId);

    @Query("""
        SELECT s FROM SuspensionDelai s
        WHERE s.suivi.id = :suiviId
          AND s.dateFin IS NULL
    """)
    Optional<SuspensionDelai> findSuspensionActiveParSuivi(@Param("suiviId") Long suiviId);

    @Query("""
        SELECT COALESCE(SUM(DATEDIFF(s.dateFin, s.dateDebut)), 0)
        FROM SuspensionDelai s
        WHERE s.suivi.id = :suiviId
          AND s.dateFin IS NOT NULL
    """)
    int calculerTotalJoursSuspendusTermines(@Param("suiviId") Long suiviId);

    List<SuspensionDelai> findBySuiviIdAndMotif(Long suiviId, MotifSuspensionEnum motif);
}
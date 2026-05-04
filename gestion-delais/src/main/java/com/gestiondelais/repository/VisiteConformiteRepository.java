// Chemin : backend/src/main/java/com/gestiondelais/repository/VisiteConformiteRepository.java
package com.gestiondelais.repository;

import com.gestiondelais.model.VisiteConformite;
import com.gestiondelais.model.enums.ResultatVisiteEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisiteConformiteRepository extends JpaRepository<VisiteConformite, Long> {

    List<VisiteConformite> findBySuiviIdOrderByIdDesc(Long suiviId);

    @Query("""
        SELECT v FROM VisiteConformite v
        WHERE v.suivi.id = :suiviId
        ORDER BY v.id DESC
        LIMIT 1
    """)
    Optional<VisiteConformite> findDerniereVisiteBySuiviId(@Param("suiviId") Long suiviId);

    @Query("""
        SELECT v FROM VisiteConformite v
        WHERE v.suivi.id = :suiviId
          AND v.dateVisite1 IS NOT NULL
          AND v.dateVisite2 IS NULL
          AND v.nonApplicable = false
    """)
    Optional<VisiteConformite> findVisiteEnCoursBySuiviId(@Param("suiviId") Long suiviId);

    List<VisiteConformite> findBySuiviIdAndResultat(Long suiviId, ResultatVisiteEnum resultat);
}
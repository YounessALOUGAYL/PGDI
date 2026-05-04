// Chemin : backend/src/main/java/com/gestiondelais/repository/ComplementRepository.java
package com.gestiondelais.repository;

import com.gestiondelais.model.Complement;
import com.gestiondelais.model.enums.StatutCplEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplementRepository extends JpaRepository<Complement, Long> {

    List<Complement> findBySuiviIdOrderByIdDesc(Long suiviId);

    @Query("""
        SELECT c FROM Complement c
        WHERE c.suivi.id = :suiviId
        ORDER BY c.id DESC
        LIMIT 1
    """)
    Optional<Complement> findDernierComplementBySuiviId(@Param("suiviId") Long suiviId);

    @Query("""
        SELECT c FROM Complement c
        WHERE c.suivi.id = :suiviId
          AND c.statutCpl = com.gestiondelais.model.enums.StatutCplEnum.EN_ATTENTE
    """)
    Optional<Complement> findComplementEnAttenteBySuiviId(@Param("suiviId") Long suiviId);

    List<Complement> findBySuiviIdAndStatutCpl(Long suiviId, StatutCplEnum statut);
}
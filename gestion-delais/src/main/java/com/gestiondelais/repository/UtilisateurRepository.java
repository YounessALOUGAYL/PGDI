// Chemin : backend/src/main/java/com/gestiondelais/repository/UtilisateurRepository.java
package com.gestiondelais.repository;

import com.gestiondelais.model.Utilisateur;
import com.gestiondelais.model.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
    List<Utilisateur>     findByRole(RoleEnum role);
    boolean               existsByEmail(String email);
}
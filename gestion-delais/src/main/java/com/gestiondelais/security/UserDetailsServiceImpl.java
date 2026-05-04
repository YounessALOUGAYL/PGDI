// Chemin : backend/src/main/java/com/gestiondelais/security/UserDetailsServiceImpl.java
package com.gestiondelais.security;

import com.gestiondelais.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return utilisateurRepository.findByEmail(email)
            .filter(u -> {
                if (!u.isActif()) {
                    log.warn("Compte inactif : {}", email);
                    throw new UsernameNotFoundException("Compte désactivé");
                }
                return true;
            })
            .map(UserDetailsImpl::new)
            .orElseThrow(() -> {
                log.warn("Email inconnu : {}", email);
                return new UsernameNotFoundException("Identifiants invalides");
            });
    }
}
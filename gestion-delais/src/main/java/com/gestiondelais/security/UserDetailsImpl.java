// Chemin : backend/src/main/java/com/gestiondelais/security/UserDetailsImpl.java
package com.gestiondelais.security;

import com.gestiondelais.model.Utilisateur;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class UserDetailsImpl implements UserDetails {

    private final Long   id;
    private final String email;
    private final String motDePasse;
    private final String nom;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Utilisateur u) {
        this.id         = u.getId();
        this.email      = u.getEmail();
        this.motDePasse = u.getMotDePasse();
        this.nom        = u.getNom();
        this.role       = u.getRole().name();
        this.authorities = List.of(
            new SimpleGrantedAuthority("ROLE_" + u.getRole().name())
        );
    }

    @Override public String  getUsername()                { return email; }
    @Override public String  getPassword()                { return motDePasse; }
    @Override public boolean isAccountNonExpired()        { return true; }
    @Override public boolean isAccountNonLocked()         { return true; }
    @Override public boolean isCredentialsNonExpired()    { return true; }
    @Override public boolean isEnabled()                  { return true; }
}
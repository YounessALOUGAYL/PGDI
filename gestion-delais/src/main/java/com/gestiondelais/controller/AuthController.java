// Chemin : backend/src/main/java/com/gestiondelais/controller/AuthController.java
package com.gestiondelais.controller;

import com.gestiondelais.dto.request.LoginRequestDTO;
import com.gestiondelais.dto.request.RefreshTokenRequestDTO;
import com.gestiondelais.dto.response.AuthResponseDTO;
import com.gestiondelais.model.Utilisateur;
import com.gestiondelais.repository.UtilisateurRepository;
import com.gestiondelais.security.JwtUtils;
import com.gestiondelais.security.UserDetailsImpl;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtils              jwtUtils;
    private final UtilisateurRepository utilisateurRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO dto) {
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getMotDePasse()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();

        return ResponseEntity.ok(AuthResponseDTO.builder()
            .accessToken(jwtUtils.genererAccessToken(
                u.getId(), u.getEmail(), u.getNom(),
                com.gestiondelais.model.enums.RoleEnum.valueOf(u.getRole())))
            .refreshToken(jwtUtils.genererRefreshToken(u.getEmail()))
            .id(u.getId()).nom(u.getNom()).email(u.getEmail()).role(u.getRole())
            .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(
            @Valid @RequestBody RefreshTokenRequestDTO dto) {
        if (!jwtUtils.validerRefreshToken(dto.getRefreshToken()))
            throw new IllegalStateException("Refresh token invalide ou expiré");

        String email = jwtUtils.extraireEmail(dto.getRefreshToken());
        Utilisateur u = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        if (!u.isActif()) throw new IllegalStateException("Compte désactivé");

        return ResponseEntity.ok(AuthResponseDTO.builder()
            .accessToken(jwtUtils.genererAccessToken(
                u.getId(), u.getEmail(), u.getNom(), u.getRole()))
            .refreshToken(jwtUtils.genererRefreshToken(u.getEmail()))
            .id(u.getId()).nom(u.getNom()).email(u.getEmail()).role(u.getRole().name())
            .build());
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponseDTO> me(
            @AuthenticationPrincipal UserDetailsImpl u) {
        return ResponseEntity.ok(AuthResponseDTO.builder()
            .id(u.getId()).nom(u.getNom()).email(u.getEmail()).role(u.getRole())
            .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserDetailsImpl u) {
        if (u != null) log.info("Logout — {}", u.getEmail());
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
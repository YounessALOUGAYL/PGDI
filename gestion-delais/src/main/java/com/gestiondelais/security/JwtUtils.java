// Chemin : backend/src/main/java/com/gestiondelais/security/JwtUtils.java
package com.gestiondelais.security;

import com.gestiondelais.model.enums.RoleEnum;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Slf4j
@Component
public class JwtUtils {

    private final SecretKey secretKey;
    private final long      accessTokenExpMs;
    private final long      refreshTokenExpMs;

    public JwtUtils(
        @Value("${app.jwt.secret}")                      String secret,
        @Value("${app.jwt.access-token-expiration-ms}")  long   accessTokenExpMs,
        @Value("${app.jwt.refresh-token-expiration-ms}") long   refreshTokenExpMs
    ) {
        byte[] keyBytes = secret.length() >= 64
            ? Decoders.BASE64.decode(secret)
            : secret.getBytes();
        this.secretKey         = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpMs  = accessTokenExpMs;
        this.refreshTokenExpMs = refreshTokenExpMs;
    }

    public String genererAccessToken(Long id, String email, String nom, RoleEnum role) {
        return Jwts.builder()
            .subject(email)
            .claims(Map.of("id", id, "nom", nom, "role", role.name(), "type", "ACCESS"))
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessTokenExpMs))
            .signWith(secretKey)
            .compact();
    }

    public String genererRefreshToken(String email) {
        return Jwts.builder()
            .subject(email)
            .claims(Map.of("type", "REFRESH"))
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshTokenExpMs))
            .signWith(secretKey)
            .compact();
    }

    public String extraireEmail(String token) {
        return extraireClaims(token).getSubject();
    }

    public String extraireRole(String token) {
        return extraireClaims(token).get("role", String.class);
    }

    private Claims extraireClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean validerToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e)      { log.debug("JWT expiré : {}", e.getMessage()); }
        catch (SignatureException e)          { log.warn("Signature invalide : {}", e.getMessage()); }
        catch (MalformedJwtException e)       { log.warn("JWT malformé : {}", e.getMessage()); }
        catch (UnsupportedJwtException e)     { log.warn("JWT non supporté : {}", e.getMessage()); }
        catch (IllegalArgumentException e)    { log.warn("JWT vide : {}", e.getMessage()); }
        return false;
    }

    public boolean validerRefreshToken(String token) {
        if (!validerToken(token)) return false;
        try {
            String type = extraireClaims(token).get("type", String.class);
            return "REFRESH".equals(type);
        } catch (Exception e) { return false; }
    }
}
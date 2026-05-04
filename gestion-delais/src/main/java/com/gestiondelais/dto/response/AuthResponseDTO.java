// Chemin : backend/src/main/java/com/gestiondelais/dto/response/AuthResponseDTO.java
package com.gestiondelais.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private Long   id;
    private String nom;
    private String email;
    private String role;
}
// Chemin : backend/src/main/java/com/gestiondelais/dto/request/RefreshTokenRequestDTO.java
package com.gestiondelais.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequestDTO {
    @NotBlank
    private String refreshToken;
}
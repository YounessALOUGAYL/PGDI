// Chemin : backend/src/main/java/com/gestiondelais/dto/response/ApiErrorDTO.java
package com.gestiondelais.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class ApiErrorDTO {
    private int           status;
    private String        error;
    private String        message;
    private String        path;
    private LocalDateTime timestamp;
}
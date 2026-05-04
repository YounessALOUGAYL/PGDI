// Chemin : backend/src/main/java/com/gestiondelais/dto/request/ComplementRequestDTO.java
package com.gestiondelais.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ComplementRequestDTO {
    @NotNull private Long      suiviId;
    @NotNull private LocalDate dateEnvoiCpl;
    private List<String> produits;
}
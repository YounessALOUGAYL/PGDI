// Chemin : backend/src/main/java/com/gestiondelais/dto/request/ComplementReceptionDTO.java
package com.gestiondelais.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ComplementReceptionDTO {
    @NotNull private LocalDate dateReceptionCpl;
    private List<String> produits;
}
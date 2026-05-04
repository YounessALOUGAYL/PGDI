// Chemin : backend/src/main/java/com/gestiondelais/dto/request/DemandeRequestDTO.java
package com.gestiondelais.dto.request;

import com.gestiondelais.model.enums.TypeDelaiEnum;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DemandeRequestDTO {
    @NotBlank
    private String nomEtablissement;
    @NotBlank
    private String typeMotifDemande;
    @NotNull @PastOrPresent
    private LocalDate dateDepot;
    @NotNull
    private TypeDelaiEnum typeDelaiLegal;
    @Min(1)
    private Integer nbJoursPersonnalise;
    @NotNull
    private Long demandeurId;
}
// Chemin : backend/src/main/java/com/gestiondelais/dto/request/DateReceptionRequestDTO.java
package com.gestiondelais.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DateReceptionRequestDTO {
    @NotNull private LocalDate dateReception;
}
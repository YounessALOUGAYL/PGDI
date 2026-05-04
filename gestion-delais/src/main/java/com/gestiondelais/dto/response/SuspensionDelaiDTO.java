// Chemin : backend/src/main/java/com/gestiondelais/dto/response/SuspensionDelaiDTO.java
package com.gestiondelais.dto.response;

import com.gestiondelais.model.SuspensionDelai;
import com.gestiondelais.model.enums.MotifSuspensionEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data @Builder
public class SuspensionDelaiDTO {
    private Long               id;
    private MotifSuspensionEnum motif;
    private LocalDate          dateDebut;
    private LocalDate          dateFin;
    private long               nbJoursSuspendu;
    private boolean            enCours;
    private String             sourceType;
    private Long               sourceId;

    public static SuspensionDelaiDTO from(SuspensionDelai s) {
        return SuspensionDelaiDTO.builder()
            .id(s.getId()).motif(s.getMotif())
            .dateDebut(s.getDateDebut()).dateFin(s.getDateFin())
            .nbJoursSuspendu(s.getNbJoursSuspendu())
            .enCours(s.isEnCours())
            .sourceType(s.getSourceType()).sourceId(s.getSourceId())
            .build();
    }
}
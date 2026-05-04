// Chemin : backend/src/main/java/com/gestiondelais/dto/response/SuiviResponseDTO.java
package com.gestiondelais.dto.response;

import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.enums.StadeEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data @Builder
public class SuiviResponseDTO {
    private Long      id;
    private Long      demandeId;
    private String    numeroDossier;
    private String    nomEtablissement;
    private LocalDate dateReceptionDMP;
    private LocalDate echeancierDMP;
    private Integer   delaiRestant;
    private Integer   totalJoursSuspendu;
    private StadeEnum stadeInstruction;
    private String    couleurStatut;
    private Long      evaluateurId;
    private String    evaluateurNom;
    private int       nbComplements;
    private boolean   suspensionActive;
    private List<SuspensionDelaiDTO> suspensions;

    public static SuiviResponseDTO from(Suivi suivi, boolean suspensionActive) {
        SuiviResponseDTOBuilder b = SuiviResponseDTO.builder()
            .id(suivi.getId())
            .demandeId(suivi.getDemande().getId())
            .numeroDossier(suivi.getDemande().getNumeroDossier())
            .nomEtablissement(suivi.getDemande().getNomEtablissement())
            .dateReceptionDMP(suivi.getDateReceptionDMP())
            .echeancierDMP(suivi.getEcheancierDMP())
            .delaiRestant(suivi.getDelaiRestant())
            .totalJoursSuspendu(suivi.getTotalJoursSuspendu())
            .stadeInstruction(suivi.getStadeInstruction())
            .couleurStatut(resoudreCouleur(suivi.getStadeInstruction(), suivi.getDelaiRestant()))
            .nbComplements(suivi.getComplements().size())
            .suspensionActive(suspensionActive)
            .suspensions(suivi.getSuspensions().stream()
                .map(SuspensionDelaiDTO::from).toList());
        if (suivi.getEvaluateur() != null)
            b.evaluateurId(suivi.getEvaluateur().getId())
             .evaluateurNom(suivi.getEvaluateur().getNom());
        return b.build();
    }

    private static String resoudreCouleur(StadeEnum stade, Integer delaiRestant) {
        if (stade == StadeEnum.CLOTURE)   return "GRIS";
        if (stade == StadeEnum.EN_RETARD) return "ROUGE";
        if (stade == StadeEnum.INSTRUIT)  return "ORANGE";
        if (delaiRestant != null) {
            if (delaiRestant <= 0) return "ROUGE";
            if (delaiRestant <= 5) return "ORANGE";
        }
        return "VERT";
    }
}
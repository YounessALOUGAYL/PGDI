// Chemin : backend/src/main/java/com/gestiondelais/dto/response/DemandeResponseDTO.java
package com.gestiondelais.dto.response;

import com.gestiondelais.model.Demande;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.enums.StatutFinalEnum;
import com.gestiondelais.model.enums.TypeDelaiEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Data
@Builder
public class DemandeResponseDTO {

    // ── Champs Demande ────────────────────────────────────────────────────────
    private Long            id;
    private String          numeroDossier;
    private String          nomEtablissement;
    private String          typeMotifDemande;
    private LocalDate       dateDepot;
    private TypeDelaiEnum   typeDelaiLegal;
    private Integer         nbJoursPersonnalise;
    private StatutFinalEnum statutFinal;
    private String          infoStatutFinal;
    private Long            demandeurId;
    private String          demandeurNom;

    // ── Champs Suivi ──────────────────────────────────────────────────────────
    private Long      suiviId;
    private String    stadeInstruction;
    private String    couleurStatut;
    private Integer   delaiRestant;
    private Integer   totalJoursSuspendu;
    private boolean   suspensionActive;
    private LocalDate dateReceptionAMMPS;
    private LocalDate echeancierAMMPS;
    private Long      evaluateurId;
    private String    evaluateurNom;

    /**
     * Historique complet des compléments — trié par dateEnvoiCpl ASC.
     * Utilisé par la DelaiTimeline côté React pour afficher tous les
     * allers-retours (N compléments possibles).
     * Liste vide (jamais null) si aucun complément.
     */
    private List<ComplementDTO> complements;

    // ── Mapper principal ──────────────────────────────────────────────────────

    public static DemandeResponseDTO from(Demande demande, boolean suspensionActive) {
        DemandeResponseDTOBuilder b = DemandeResponseDTO.builder()
            .id(demande.getId())
            .numeroDossier(demande.getNumeroDossier())
            .nomEtablissement(demande.getNomEtablissement())
            .typeMotifDemande(demande.getTypeMotifDemande())
            .dateDepot(demande.getDateDepot())
            .typeDelaiLegal(demande.getTypeDelaiLegal())
            .nbJoursPersonnalise(demande.getNbJoursPersonnalise())
            .statutFinal(demande.getStatutFinal())
            .infoStatutFinal(demande.getInfoStatutFinal())
            .demandeurId(demande.getDemandeur().getId())
            .demandeurNom(demande.getDemandeur().getNom());

        Suivi suivi = demande.getSuivi();
        if (suivi != null) {
            b.suiviId(suivi.getId())
             .stadeInstruction(suivi.getStadeInstruction().name())
             .couleurStatut(resoudreCouleur(suivi))
             .delaiRestant(suivi.getDelaiRestant())
             .totalJoursSuspendu(suivi.getTotalJoursSuspendu())
             .suspensionActive(suspensionActive)
             .dateReceptionAMMPS(suivi.getDateReceptionDMP())
             .echeancierAMMPS(suivi.getEcheancierDMP())
             // Compléments triés chronologiquement — jamais null
             .complements(
                 suivi.getComplements() == null
                     ? Collections.emptyList()
                     : suivi.getComplements().stream()
                         .sorted(Comparator.comparing(
                             c -> c.getDateEnvoiCpl() != null
                                 ? c.getDateEnvoiCpl()
                                 : LocalDate.MIN
                         ))
                         .map(ComplementDTO::from)
                         .toList()
             );

            if (suivi.getEvaluateur() != null) {
                b.evaluateurId(suivi.getEvaluateur().getId())
                 .evaluateurNom(suivi.getEvaluateur().getNom());
            }
        } else {
            b.stadeInstruction("INSTRUIT")
             .couleurStatut("GRIS")
             .suspensionActive(false)
             .complements(Collections.emptyList());
        }

        return b.build();
    }

    public static DemandeResponseDTO from(Demande demande) {
        return from(demande, false);
    }

    // ── Logique couleur ───────────────────────────────────────────────────────

    private static String resoudreCouleur(Suivi suivi) {
        if (suivi == null) return "GRIS";
        switch (suivi.getStadeInstruction()) {
            case CLOTURE   -> { return "GRIS";   }
            case EN_RETARD -> { return "ROUGE";  }
            case INSTRUIT  -> { return "ORANGE"; }
            default        -> { /* EN_COURS */ }
        }
        Integer delai = suivi.getDelaiRestant();
        if (delai == null) return "GRIS";
        if (delai <= 0)    return "ROUGE";
        if (delai <= 5)    return "ORANGE";
        return "VERT";
    }
}

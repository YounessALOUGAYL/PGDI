// Chemin : backend/src/main/java/com/gestiondelais/dto/response/DemandeResponseDTO.java
package com.gestiondelais.dto.response;

import com.gestiondelais.model.Demande;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.enums.StatutFinalEnum;
import com.gestiondelais.model.enums.TypeDelaiEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

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

    // Demandeur
    private Long   demandeurId;
    private String demandeurNom;

    // ── Champs Suivi (hydratés depuis l'entité Suivi liée) ────────────────────
    // Ces champs sont attendus par useDemandes.js côté React pour
    // afficher correctement delaiRestant, couleurStatut, stadeInstruction,
    // evaluateurNom dans le tableau DemandesListPage.

    private Long      suiviId;
    private String    stadeInstruction;   // "INSTRUIT" | "EN_COURS" | "EN_RETARD" | "CLOTURE"
    private String    couleurStatut;      // "VERT" | "ORANGE" | "ROUGE" | "GRIS"
    private Integer   delaiRestant;       // nb de jours (négatif = retard)
    private Integer   totalJoursSuspendu;
    private boolean   suspensionActive;

    // Renommé AMMPS dans votre contexte (était DMP dans les entités)
    private LocalDate dateReceptionAMMPS; // = Suivi.dateReceptionDMP
    private LocalDate echeancierAMMPS;    // = Suivi.echeancierDMP

    // Évaluateur
    private Long   evaluateurId;
    private String evaluateurNom;

    // ── Mapper statique ───────────────────────────────────────────────────────

    /**
     * Mapper principal — utilisé dans DemandeController.listerDemandes()
     * et DemandeController.getDemande().
     *
     * Reçoit l'entité Demande avec son Suivi déjà chargé (JOIN FETCH dans
     * la requête repository) et le flag suspensionActive calculé par le service.
     *
     * @param demande          entité Demande (avec demande.getSuivi() non null)
     * @param suspensionActive true si une SuspensionDelai active existe pour ce suivi
     */
    public static DemandeResponseDTO from(Demande demande, boolean suspensionActive) {
        DemandeResponseDTOBuilder b = DemandeResponseDTO.builder()
            // Champs Demande
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

        // Hydratation des champs Suivi
        Suivi suivi = demande.getSuivi();
        if (suivi != null) {
            b.suiviId(suivi.getId())
             .stadeInstruction(suivi.getStadeInstruction().name())
             .couleurStatut(resoudreCouleur(suivi))
             .delaiRestant(suivi.getDelaiRestant())
             .totalJoursSuspendu(suivi.getTotalJoursSuspendu())
             .suspensionActive(suspensionActive)
             .dateReceptionAMMPS(suivi.getDateReceptionDMP())   // alias AMMPS
             .echeancierAMMPS(suivi.getEcheancierDMP());        // alias AMMPS

            if (suivi.getEvaluateur() != null) {
                b.evaluateurId(suivi.getEvaluateur().getId())
                 .evaluateurNom(suivi.getEvaluateur().getNom());
            }
        } else {
            // Suivi non encore initialisé — valeurs neutres explicites
            b.stadeInstruction("INSTRUIT")
             .couleurStatut("GRIS")
             .suspensionActive(false);
        }

        return b.build();
    }

    /**
     * Surcharge sans suspensionActive (lecture unitaire rapide).
     * Utilisé pour GET /demandes/:id quand on ne veut pas faire
     * un appel SuspensionDelai supplémentaire.
     */
    public static DemandeResponseDTO from(Demande demande) {
        return from(demande, false);
    }

    // ── Logique couleur — miroir de SuiviResponseDTO.resoudreCouleur() ────────

    /**
     * Centralise le calcul de la couleur dans le DTO pour éviter
     * toute divergence entre la vue liste et la vue détail.
     *
     * Règles (identiques à SuiviResponseDTO) :
     *  CLOTURE               → GRIS
     *  EN_RETARD             → ROUGE
     *  INSTRUIT (suspension) → ORANGE
     *  delaiRestant ≤ 0      → ROUGE
     *  delaiRestant ≤ 5      → ORANGE (alerte préventive)
     *  sinon                 → VERT
     */
    private static String resoudreCouleur(Suivi suivi) {
        if (suivi == null) return "GRIS";

        switch (suivi.getStadeInstruction()) {
            case CLOTURE   -> { return "GRIS";   }
            case EN_RETARD -> { return "ROUGE";  }
            case INSTRUIT  -> { return "ORANGE"; }
            default        -> { /* EN_COURS — on vérifie le délai */ }
        }

        Integer delai = suivi.getDelaiRestant();
        if (delai == null)  return "GRIS";
        if (delai <= 0)     return "ROUGE";
        if (delai <= 5)     return "ORANGE";
        return "VERT";
    }
}
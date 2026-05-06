// Chemin : backend/src/main/java/com/gestiondelais/dto/response/ComplementDTO.java
package com.gestiondelais.dto.response;

import com.gestiondelais.model.Complement;
import com.gestiondelais.model.enums.StatutCplEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Data
@Builder
public class ComplementDTO {

    private Long          id;
    private Long          suiviId;

    // Dates clés — nommées AMMPS dans votre contexte métier
    private LocalDate     dateEnvoiCpl;       // début de la suspension
    private LocalDate     dateReceptionCpl;   // fin de la suspension (null = en attente)

    private List<String>  produits;
    private StatutCplEnum statutCpl;
    private boolean       estCloture;

    /**
     * Durée de la suspension en jours.
     * Calculée jusqu'à aujourd'hui si la suspension est encore active.
     * Null si dateEnvoiCpl n'est pas renseigné.
     */
    private Long joursSuspendu;

    /**
     * true si ce complément a une SuspensionDelai active associée
     * (dateEnvoiCpl renseigné, dateReceptionCpl null, statut EN_ATTENTE).
     */
    private boolean suspensionActive;

    // ── Mapper ────────────────────────────────────────────────────────────────

    public static ComplementDTO from(Complement c) {
        long jours = 0;
        boolean suspActive = false;

        if (c.getDateEnvoiCpl() != null) {
            LocalDate fin = c.getDateReceptionCpl() != null
                ? c.getDateReceptionCpl()
                : LocalDate.now();
            jours = ChronoUnit.DAYS.between(c.getDateEnvoiCpl(), fin);
            suspActive = c.getDateReceptionCpl() == null
                && c.getStatutCpl() == StatutCplEnum.EN_ATTENTE;
        }

        return ComplementDTO.builder()
            .id(c.getId())
            .suiviId(c.getSuivi() != null ? c.getSuivi().getId() : null)
            .dateEnvoiCpl(c.getDateEnvoiCpl())
            .dateReceptionCpl(c.getDateReceptionCpl())
            .produits(c.getProduits())
            .statutCpl(c.getStatutCpl())
            .estCloture(c.isEstCloture())
            .joursSuspendu(jours)
            .suspensionActive(suspActive)
            .build();
    }
}

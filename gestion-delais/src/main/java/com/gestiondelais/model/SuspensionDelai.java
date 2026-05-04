// Chemin : backend/src/main/java/com/gestiondelais/model/SuspensionDelai.java
package com.gestiondelais.model;

import com.gestiondelais.model.enums.MotifSuspensionEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "suspensions_delai")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "suivi")
@ToString(exclude = "suivi")
public class SuspensionDelai {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suivi_id", nullable = false)
    private Suivi suivi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MotifSuspensionEnum motif;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "source_type", length = 20)
    private String sourceType;

    public long getNbJoursSuspendu() {
        LocalDate fin = (dateFin != null) ? dateFin : LocalDate.now();
        return ChronoUnit.DAYS.between(dateDebut, fin);
    }

    public boolean isEnCours()   { return dateFin == null; }
    public boolean isTerminee()  { return dateFin != null; }
}
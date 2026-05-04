// Chemin : backend/src/main/java/com/gestiondelais/model/VisiteConformite.java
package com.gestiondelais.model;

import com.gestiondelais.model.enums.ResultatVisiteEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "visites_conformite")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "suivi")
@ToString(exclude = "suivi")
public class VisiteConformite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suivi_id", nullable = false)
    private Suivi suivi;

    @Column(name = "date_visite1")
    private LocalDate dateVisite1;

    @Column(name = "date_visite2")
    private LocalDate dateVisite2;

    @Enumerated(EnumType.STRING)
    @Column(name = "resultat")
    @Builder.Default
    private ResultatVisiteEnum resultat = ResultatVisiteEnum.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String remarques;

    @Column(name = "non_applicable")
    @Builder.Default
    private boolean nonApplicable = false;
}
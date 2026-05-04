// Chemin : backend/src/main/java/com/gestiondelais/model/Suivi.java
package com.gestiondelais.model;

import com.gestiondelais.model.enums.StadeEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "suivis")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"complements", "suspensions", "visites"})
@ToString(exclude = {"complements", "suspensions", "visites"})
public class Suivi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false, unique = true)
    private Demande demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluateur_id")
    private Utilisateur evaluateur;

    @Column(name = "date_reception_dmp")
    private LocalDate dateReceptionDMP;

    @Column(name = "echeancier_dmp")
    private LocalDate echeancierDMP;

    @Column(name = "delai_restant")
    private Integer delaiRestant;

    @Column(name = "total_jours_suspendu")
    @Builder.Default
    private Integer totalJoursSuspendu = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "stade_instruction")
    @Builder.Default
    private StadeEnum stadeInstruction = StadeEnum.INSTRUIT;

    @OneToMany(mappedBy = "suivi", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Complement> complements = new ArrayList<>();

    // OneToMany — permet les contre-visites (NON_CONFORME → nouvelle visite)
    @OneToMany(mappedBy = "suivi", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<VisiteConformite> visites = new ArrayList<>();

    @OneToMany(mappedBy = "suivi", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<SuspensionDelai> suspensions = new ArrayList<>();
}
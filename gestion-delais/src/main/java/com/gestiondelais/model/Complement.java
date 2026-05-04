// Chemin : backend/src/main/java/com/gestiondelais/model/Complement.java
package com.gestiondelais.model;

import com.gestiondelais.model.enums.StatutCplEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "complements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "suivi")
@ToString(exclude = "suivi")
public class Complement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suivi_id", nullable = false)
    private Suivi suivi;

    @Column(name = "date_envoi_cpl")
    private LocalDate dateEnvoiCpl;

    @Column(name = "date_reception_cpl")
    private LocalDate dateReceptionCpl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "complement_produits",
        joinColumns = @JoinColumn(name = "complement_id")
    )
    @Column(name = "produit")
    @Builder.Default
    private List<String> produits = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_cpl")
    @Builder.Default
    private StatutCplEnum statutCpl = StatutCplEnum.EN_ATTENTE;

    @Column(name = "est_cloture")
    @Builder.Default
    private boolean estCloture = false;
}
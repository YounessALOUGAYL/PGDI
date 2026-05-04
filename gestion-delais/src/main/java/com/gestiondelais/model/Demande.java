// Chemin : backend/src/main/java/com/gestiondelais/model/Demande.java
package com.gestiondelais.model;

import com.gestiondelais.model.enums.StatutFinalEnum;
import com.gestiondelais.model.enums.TypeDelaiEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "demandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Demande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_dossier", nullable = false, unique = true)
    private String numeroDossier;

    @Column(name = "nom_etablissement", nullable = false)
    private String nomEtablissement;

    @Column(name = "type_motif_demande")
    private String typeMotifDemande;

    @Column(name = "date_depot", nullable = false)
    private LocalDate dateDepot;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_delai_legal", nullable = false)
    private TypeDelaiEnum typeDelaiLegal;

    // Utilisé uniquement si typeDelaiLegal == PERSONNALISE
    @Column(name = "nb_jours_personnalise")
    private Integer nbJoursPersonnalise;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_final")
    private StatutFinalEnum statutFinal;

    @Column(name = "info_statut_final")
    private String infoStatutFinal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private Utilisateur demandeur;

    @OneToOne(mappedBy = "demande", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Suivi suivi;
}
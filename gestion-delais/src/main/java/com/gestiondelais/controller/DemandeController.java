// Chemin : backend/src/main/java/com/gestiondelais/controller/DemandeController.java
package com.gestiondelais.controller;

import com.gestiondelais.dto.request.DemandeRequestDTO;
import com.gestiondelais.dto.response.DemandeResponseDTO;
import com.gestiondelais.model.Demande;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.Utilisateur;
import com.gestiondelais.model.enums.TypeDelaiEnum;
import com.gestiondelais.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeRepository         demandeRepository;
    private final UtilisateurRepository     utilisateurRepository;
    private final SuiviRepository           suiviRepository;
    private final SuspensionDelaiRepository suspensionDelaiRepository;

    // ── Utilitaire ────────────────────────────────────────────────────────────

    private boolean hasSuspensionActive(Demande demande) {
        if (demande.getSuivi() == null) return false;
        return suspensionDelaiRepository
            .findSuspensionActiveParSuivi(demande.getSuivi().getId())
            .isPresent();
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<DemandeResponseDTO> creerDemande(
            @Valid @RequestBody DemandeRequestDTO dto) {

        if (dto.getTypeDelaiLegal() == TypeDelaiEnum.PERSONNALISE
                && dto.getNbJoursPersonnalise() == null)
            throw new IllegalStateException(
                "nbJoursPersonnalise requis pour le type PERSONNALISE");

        Utilisateur demandeur = utilisateurRepository.findById(dto.getDemandeurId())
            .orElseThrow(() -> new EntityNotFoundException(
                "Demandeur introuvable : " + dto.getDemandeurId()));

        Demande demande = Demande.builder()
            .numeroDossier(genererNumeroDossier())
            .nomEtablissement(dto.getNomEtablissement())
            .typeMotifDemande(dto.getTypeMotifDemande())
            .dateDepot(dto.getDateDepot())
            .typeDelaiLegal(dto.getTypeDelaiLegal())
            .nbJoursPersonnalise(dto.getNbJoursPersonnalise())
            .demandeur(demandeur)
            .build();

        Demande saved = demandeRepository.save(demande);
        suiviRepository.save(Suivi.builder().demande(saved).build());

        Demande reloaded = demandeRepository.findByIdAvecSuivi(saved.getId())
            .orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(DemandeResponseDTO.from(reloaded, false));
    }

    /**
     * GET /api/v1/demandes
     * Liste sans les compléments (trop volumineux pour un tableau).
     * Utilise findAllAvecSuivi() → une seule requête SQL.
     */
    @GetMapping
    public ResponseEntity<List<DemandeResponseDTO>> listerDemandes() {
        return ResponseEntity.ok(
            demandeRepository.findAllAvecSuivi()
                .stream()
                .map(d -> DemandeResponseDTO.from(d, hasSuspensionActive(d)))
                .toList()
        );
    }

    /**
     * GET /api/v1/demandes/:id
     * Détail complet incluant la liste des compléments.
     *
     * Stratégie deux passes pour éviter MultipleBagFetchException :
     *  Passe 1 — findByIdAvecSuivi()       → charge Suivi + Évaluateur
     *  Passe 2 — findByIdAvecComplements() → Hibernate peuple
     *             suivi.complements dans le même contexte JPA
     */
    @GetMapping("/{id}")
    public ResponseEntity<DemandeResponseDTO> getDemande(@PathVariable Long id) {
        // Passe 1 : Suivi + Évaluateur
        Demande demande = demandeRepository.findByIdAvecSuivi(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Demande introuvable : " + id));

        // Passe 2 : Compléments (Hibernate les injecte dans la même entité
        // déjà présente dans le contexte de persistance)
        demandeRepository.findByIdAvecComplements(id);

        return ResponseEntity.ok(
            DemandeResponseDTO.from(demande, hasSuspensionActive(demande))
        );
    }

    @GetMapping("/dossier/{numero}")
    public ResponseEntity<DemandeResponseDTO> getDemandeByNumero(
            @PathVariable String numero) {
        Demande demande = demandeRepository.findByNumeroDossier(numero)
            .orElseThrow(() -> new EntityNotFoundException(
                "Dossier introuvable : " + numero));
        Long id = demande.getId();
        demandeRepository.findByIdAvecSuivi(id);
        demandeRepository.findByIdAvecComplements(id);
        Demande avecTout = demandeRepository.findByIdAvecSuivi(id).orElseThrow();
        return ResponseEntity.ok(
            DemandeResponseDTO.from(avecTout, hasSuspensionActive(avecTout))
        );
    }

    private String genererNumeroDossier() {
        return String.format("DEM-%d-%05d",
            java.time.Year.now().getValue(),
            demandeRepository.count() + 1);
    }
}

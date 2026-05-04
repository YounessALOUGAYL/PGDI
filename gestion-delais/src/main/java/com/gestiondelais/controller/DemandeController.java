// Chemin : backend/src/main/java/com/gestiondelais/controller/DemandeController.java
package com.gestiondelais.controller;

import com.gestiondelais.dto.request.DemandeRequestDTO;
import com.gestiondelais.dto.response.DemandeResponseDTO;
import com.gestiondelais.model.Demande;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.Utilisateur;
import com.gestiondelais.model.enums.TypeDelaiEnum;
import com.gestiondelais.repository.DemandeRepository;
import com.gestiondelais.repository.SuiviRepository;
import com.gestiondelais.repository.SuspensionDelaiRepository;
import com.gestiondelais.repository.UtilisateurRepository;
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

    private final DemandeRepository     demandeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SuiviRepository       suiviRepository;
    private final SuspensionDelaiRepository suspensionDelaiRepository;

    // ── Utilitaire privé ─────────────────────────────────────────────────────

    /**
     * Détermine si le suivi d'une demande a une suspension active.
     * Retourne false si le suivi est null (demande sans suivi initialisé).
     */
    private boolean hasSuspensionActive(Demande demande) {
        if (demande.getSuivi() == null) return false;
        return suspensionDelaiRepository
            .findSuspensionActiveParSuivi(demande.getSuivi().getId())
            .isPresent();
    }

    // ── Endpoints ────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/demandes
     * Crée une Demande et initialise son Suivi vide.
     */
    @PostMapping
    public ResponseEntity<DemandeResponseDTO> creerDemande(
            @Valid @RequestBody DemandeRequestDTO dto) {

        if (dto.getTypeDelaiLegal() == TypeDelaiEnum.PERSONNALISE
                && dto.getNbJoursPersonnalise() == null) {
            throw new IllegalStateException(
                "nbJoursPersonnalise requis pour le type PERSONNALISE");
        }

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

        // Recharge avec JOIN FETCH pour hydrater le DTO proprement
        Demande reloaded = demandeRepository.findByIdAvecSuivi(saved.getId())
            .orElseThrow();

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(DemandeResponseDTO.from(reloaded, false));
    }

    /**
     * GET /api/v1/demandes
     * Retourne la liste complète des demandes avec les champs Suivi hydratés :
     * stadeInstruction, couleurStatut, delaiRestant, evaluateurNom, etc.
     *
     * Utilise findAllAvecSuivi() pour éviter N+1 et charger Suivi + Evaluateur
     * en une seule requête SQL.
     */
    @GetMapping
    public ResponseEntity<List<DemandeResponseDTO>> listerDemandes() {
        List<Demande> demandes = demandeRepository.findAllAvecSuivi();

        List<DemandeResponseDTO> result = demandes.stream()
            .map(d -> DemandeResponseDTO.from(d, hasSuspensionActive(d)))
            .toList();

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/demandes/:id
     * Retourne le détail d'une demande avec les champs Suivi hydratés.
     */
    @GetMapping("/{id}")
    public ResponseEntity<DemandeResponseDTO> getDemande(@PathVariable Long id) {
        Demande demande = demandeRepository.findByIdAvecSuivi(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Demande introuvable : " + id));

        return ResponseEntity.ok(
            DemandeResponseDTO.from(demande, hasSuspensionActive(demande))
        );
    }

    /**
     * GET /api/v1/demandes/dossier/:numero
     */
    @GetMapping("/dossier/{numero}")
    public ResponseEntity<DemandeResponseDTO> getDemandeByNumero(
            @PathVariable String numero) {
        Demande demande = demandeRepository.findByNumeroDossier(numero)
            .orElseThrow(() -> new EntityNotFoundException(
                "Dossier introuvable : " + numero));

        // Recharge avec JOIN FETCH
        Demande avecSuivi = demandeRepository.findByIdAvecSuivi(demande.getId())
            .orElseThrow();

        return ResponseEntity.ok(
            DemandeResponseDTO.from(avecSuivi, hasSuspensionActive(avecSuivi))
        );
    }

    // ── Utilitaires privés ───────────────────────────────────────────────────

    private String genererNumeroDossier() {
        return String.format("DEM-%d-%05d",
            java.time.Year.now().getValue(),
            demandeRepository.count() + 1);
    }
}
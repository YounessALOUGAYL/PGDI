// Chemin : backend/src/main/java/com/gestiondelais/controller/SuiviController.java
package com.gestiondelais.controller;

import com.gestiondelais.dto.request.DateReceptionRequestDTO;
import com.gestiondelais.dto.response.SuiviResponseDTO;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.repository.SuiviRepository;
import com.gestiondelais.repository.SuspensionDelaiRepository;
import com.gestiondelais.service.DelaiCalculService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/suivis")
@RequiredArgsConstructor
public class SuiviController {

    private final SuiviRepository          suiviRepository;
    private final SuspensionDelaiRepository suspensionDelaiRepository;
    private final DelaiCalculService        delaiCalculService;

    private SuiviResponseDTO toDto(Suivi s) {
        return SuiviResponseDTO.from(s,
            suspensionDelaiRepository.findSuspensionActiveParSuivi(s.getId()).isPresent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuiviResponseDTO> getSuivi(@PathVariable Long id) {
        return ResponseEntity.ok(toDto(suiviRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Suivi introuvable : " + id))));
    }

    @GetMapping("/demande/{demandeId}")
    public ResponseEntity<SuiviResponseDTO> getSuiviByDemande(@PathVariable Long demandeId) {
        return ResponseEntity.ok(toDto(suiviRepository.findByDemandeId(demandeId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Suivi introuvable pour demande : " + demandeId))));
    }

    @GetMapping("/en-retard")
    public ResponseEntity<List<SuiviResponseDTO>> getSuivisEnRetard() {
        return ResponseEntity.ok(suiviRepository.findSuivisEnRetard(LocalDate.now())
            .stream().map(this::toDto).toList());
    }

    @GetMapping("/alerte")
    public ResponseEntity<List<SuiviResponseDTO>> getSuivisEnAlerte(
            @RequestParam(defaultValue = "5") int jours) {
        LocalDate aujourd_hui = LocalDate.now();
        return ResponseEntity.ok(suiviRepository
            .findSuivisProchesEcheance(aujourd_hui, aujourd_hui.plusDays(jours))
            .stream().map(this::toDto).toList());
    }

    @PatchMapping("/{id}/date-reception")
    public ResponseEntity<SuiviResponseDTO> enregistrerDateReception(
            @PathVariable Long id, @Valid @RequestBody DateReceptionRequestDTO dto) {
        Suivi suivi = suiviRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Suivi introuvable : " + id));
        suivi.setDateReceptionDMP(dto.getDateReception());
        suiviRepository.save(suivi);
        delaiCalculService.recalculerDelai(id);
        return ResponseEntity.ok(toDto(suiviRepository.findById(id).orElseThrow()));
    }

    @PostMapping("/{id}/cloture")
    public ResponseEntity<SuiviResponseDTO> cloturerDossier(@PathVariable Long id) {
        delaiCalculService.cloturerDossier(id);
        return ResponseEntity.ok(toDto(suiviRepository.findById(id).orElseThrow()));
    }
}
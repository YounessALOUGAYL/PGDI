// Chemin : backend/src/main/java/com/gestiondelais/controller/VisiteController.java
package com.gestiondelais.controller;

import com.gestiondelais.dto.request.DateReceptionRequestDTO;
import com.gestiondelais.dto.response.SuiviResponseDTO;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.VisiteConformite;
import com.gestiondelais.model.enums.ResultatVisiteEnum;
import com.gestiondelais.repository.SuiviRepository;
import com.gestiondelais.repository.SuspensionDelaiRepository;
import com.gestiondelais.repository.VisiteConformiteRepository;
import com.gestiondelais.service.DelaiCalculService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/visites")
@RequiredArgsConstructor
public class VisiteController {

    private final VisiteConformiteRepository visiteRepository;
    private final SuiviRepository            suiviRepository;
    private final SuspensionDelaiRepository  suspensionDelaiRepository;
    private final DelaiCalculService         delaiCalculService;

    private SuiviResponseDTO toDto(Suivi s) {
        return SuiviResponseDTO.from(s,
            suspensionDelaiRepository.findSuspensionActiveParSuivi(s.getId()).isPresent());
    }

    @PostMapping
    public ResponseEntity<SuiviResponseDTO> planifierVisite(
            @RequestParam Long   suiviId,
            @RequestParam String dateVisite1) {
        Suivi suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new EntityNotFoundException("Suivi introuvable : " + suiviId));

        VisiteConformite saved = visiteRepository.save(VisiteConformite.builder()
            .suivi(suivi)
            .dateVisite1(LocalDate.parse(dateVisite1))
            .resultat(ResultatVisiteEnum.EN_ATTENTE)
            .build());

        delaiCalculService.ouvrirSuspensionVisite(saved.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(toDto(suiviRepository.findById(suiviId).orElseThrow()));
    }

    @PutMapping("/{id}/cloture")
    public ResponseEntity<SuiviResponseDTO> cloturerVisite(
            @PathVariable Long id,
            @Valid @RequestBody DateReceptionRequestDTO dto,
            @RequestParam ResultatVisiteEnum resultat) {
        VisiteConformite visite = visiteRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Visite introuvable : " + id));

        visite.setDateVisite2(dto.getDateReception());
        visite.setResultat(resultat);
        visiteRepository.save(visite);
        delaiCalculService.cloturerSuspensionVisite(id);

        return ResponseEntity.ok(toDto(
            suiviRepository.findById(visite.getSuivi().getId()).orElseThrow()));
    }
}
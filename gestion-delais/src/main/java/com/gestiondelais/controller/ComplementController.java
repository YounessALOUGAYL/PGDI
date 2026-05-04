// Chemin : backend/src/main/java/com/gestiondelais/controller/ComplementController.java
package com.gestiondelais.controller;

import com.gestiondelais.dto.request.ComplementReceptionDTO;
import com.gestiondelais.dto.request.ComplementRequestDTO;
import com.gestiondelais.dto.response.SuiviResponseDTO;
import com.gestiondelais.model.Complement;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.enums.StatutCplEnum;
import com.gestiondelais.repository.ComplementRepository;
import com.gestiondelais.repository.SuiviRepository;
import com.gestiondelais.repository.SuspensionDelaiRepository;
import com.gestiondelais.service.DelaiCalculService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/complements")
@RequiredArgsConstructor
public class ComplementController {

    private final ComplementRepository      complementRepository;
    private final SuiviRepository           suiviRepository;
    private final SuspensionDelaiRepository suspensionDelaiRepository;
    private final DelaiCalculService        delaiCalculService;

    private SuiviResponseDTO toDto(Suivi s) {
        return SuiviResponseDTO.from(s,
            suspensionDelaiRepository.findSuspensionActiveParSuivi(s.getId()).isPresent());
    }

    @PostMapping
    public ResponseEntity<SuiviResponseDTO> creerComplement(
            @Valid @RequestBody ComplementRequestDTO dto) {
        Suivi suivi = suiviRepository.findById(dto.getSuiviId())
            .orElseThrow(() -> new EntityNotFoundException(
                "Suivi introuvable : " + dto.getSuiviId()));

        Complement saved = complementRepository.save(Complement.builder()
            .suivi(suivi)
            .dateEnvoiCpl(dto.getDateEnvoiCpl())
            .produits(dto.getProduits() != null ? dto.getProduits() : List.of())
            .statutCpl(StatutCplEnum.EN_ATTENTE)
            .build());

        delaiCalculService.ouvrirSuspensionComplement(saved.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(toDto(suiviRepository.findById(suivi.getId()).orElseThrow()));
    }

    @PutMapping("/{id}/cloture")
    public ResponseEntity<SuiviResponseDTO> cloturerComplement(
            @PathVariable Long id, @Valid @RequestBody ComplementReceptionDTO dto) {
        Complement complement = complementRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Complément introuvable : " + id));

        complement.setDateReceptionCpl(dto.getDateReceptionCpl());
        if (dto.getProduits() != null) {
            complement.getProduits().clear();
            complement.getProduits().addAll(dto.getProduits());
        }
        complementRepository.save(complement);
        delaiCalculService.cloturerSuspensionComplement(id);

        return ResponseEntity.ok(toDto(
            suiviRepository.findById(complement.getSuivi().getId()).orElseThrow()));
    }
}
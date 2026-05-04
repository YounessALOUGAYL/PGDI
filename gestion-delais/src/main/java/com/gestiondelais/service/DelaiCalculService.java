// Chemin : backend/src/main/java/com/gestiondelais/service/DelaiCalculService.java
package com.gestiondelais.service;

import com.gestiondelais.model.*;
import com.gestiondelais.model.enums.*;
import com.gestiondelais.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class DelaiCalculService {

    private final SuiviRepository          suiviRepository;
    private final SuspensionDelaiRepository suspensionDelaiRepository;
    private final ComplementRepository      complementRepository;
    private final VisiteConformiteRepository visiteConformiteRepository;

    // ── 1. Recalcul principal ────────────────────────────────────────────────

    @Transactional
    public void recalculerDelai(Long suiviId) {
        Suivi suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new EntityNotFoundException("Suivi introuvable : " + suiviId));

        if (suivi.getDateReceptionDMP() == null
                || suivi.getStadeInstruction() == StadeEnum.CLOTURE) return;

        int nbJoursLegaux      = resoudreNbJoursLegaux(suivi.getDemande());
        int totalJoursSuspendus = calculerTotalJoursSuspendus(suivi);

        LocalDate echeancier = suivi.getDateReceptionDMP()
            .plusDays(nbJoursLegaux)
            .plusDays(totalJoursSuspendus);

        int delaiRestant = (int) ChronoUnit.DAYS.between(LocalDate.now(), echeancier);

        suivi.setEcheancierDMP(echeancier);
        suivi.setDelaiRestant(delaiRestant);
        suivi.setTotalJoursSuspendu(totalJoursSuspendus);
        suivi.setStadeInstruction(determinerStade(suivi, delaiRestant));
        suiviRepository.save(suivi);

        log.info("Suivi {} recalculé → échéance={}, restant={}j, stade={}",
            suiviId, echeancier, delaiRestant, suivi.getStadeInstruction());
    }

    private int resoudreNbJoursLegaux(Demande demande) {
        if (demande.getTypeDelaiLegal() == TypeDelaiEnum.PERSONNALISE) {
            if (demande.getNbJoursPersonnalise() == null || demande.getNbJoursPersonnalise() <= 0)
                throw new IllegalStateException(
                    "nbJoursPersonnalise manquant pour demande " + demande.getId());
            return demande.getNbJoursPersonnalise();
        }
        return demande.getTypeDelaiLegal().getNbJours();
    }

    private int calculerTotalJoursSuspendus(Suivi suivi) {
        return suspensionDelaiRepository
            .calculerTotalJoursSuspendusTermines(suivi.getId());
    }

    private StadeEnum determinerStade(Suivi suivi, int delaiRestant) {
        boolean suspensionActive = suspensionDelaiRepository
            .findSuspensionActiveParSuivi(suivi.getId()).isPresent();
        if (suspensionActive)   return StadeEnum.INSTRUIT;
        return (delaiRestant < 0) ? StadeEnum.EN_RETARD : StadeEnum.EN_COURS;
    }

    // ── 2. Ouverture de suspensions ──────────────────────────────────────────

    @Transactional
    public SuspensionDelai ouvrirSuspensionComplement(Long complementId) {
        Complement complement = complementRepository.findById(complementId)
            .orElseThrow(() -> new EntityNotFoundException("Complément introuvable : " + complementId));

        validerPasDeSuspensionActive(complement.getSuivi().getId());
        if (complement.getDateEnvoiCpl() == null)
            throw new IllegalStateException("dateEnvoiCpl requise");

        SuspensionDelai suspension = SuspensionDelai.builder()
            .suivi(complement.getSuivi())
            .motif(MotifSuspensionEnum.COMPLEMENT_DOSSIER)
            .dateDebut(complement.getDateEnvoiCpl())
            .sourceId(complement.getId())
            .sourceType("COMPLEMENT")
            .build();

        SuspensionDelai saved = suspensionDelaiRepository.save(suspension);
        complement.setStatutCpl(StatutCplEnum.EN_ATTENTE);
        complementRepository.save(complement);
        recalculerDelai(complement.getSuivi().getId());

        log.info("Suspension COMPLEMENT ouverte — suivi={}", complement.getSuivi().getId());
        return saved;
    }

    @Transactional
    public SuspensionDelai ouvrirSuspensionVisite(Long visiteId) {
        VisiteConformite visite = visiteConformiteRepository.findById(visiteId)
            .orElseThrow(() -> new EntityNotFoundException("Visite introuvable : " + visiteId));

        validerPasDeSuspensionActive(visite.getSuivi().getId());
        if (visite.getDateVisite1() == null)
            throw new IllegalStateException("dateVisite1 requise");
        if (visite.isNonApplicable())
            throw new IllegalStateException("Visite non-applicable");

        SuspensionDelai suspension = SuspensionDelai.builder()
            .suivi(visite.getSuivi())
            .motif(MotifSuspensionEnum.VISITE_CONFORMITE)
            .dateDebut(visite.getDateVisite1())
            .sourceId(visite.getId())
            .sourceType("VISITE")
            .build();

        SuspensionDelai saved = suspensionDelaiRepository.save(suspension);
        recalculerDelai(visite.getSuivi().getId());
        return saved;
    }

    // ── 3. Clôture de suspensions ────────────────────────────────────────────

    @Transactional
    public void cloturerSuspensionComplement(Long complementId) {
        Complement complement = complementRepository.findById(complementId)
            .orElseThrow(() -> new EntityNotFoundException("Complément introuvable : " + complementId));

        if (complement.getDateReceptionCpl() == null)
            throw new IllegalStateException("dateReceptionCpl requise");

        SuspensionDelai suspension = suspensionDelaiRepository
            .findSuspensionActiveParSuivi(complement.getSuivi().getId())
            .orElseThrow(() -> new IllegalStateException("Aucune suspension active"));

        suspension.setDateFin(complement.getDateReceptionCpl());
        suspensionDelaiRepository.save(suspension);

        if (estDossierCloture(complement)) {
            complement.setEstCloture(true);
            complement.setStatutCpl(StatutCplEnum.CLOTURE);
            complementRepository.save(complement);
            cloturerDossier(complement.getSuivi().getId());
            return;
        }

        complement.setStatutCpl(StatutCplEnum.EN_COURS);
        complementRepository.save(complement);
        recalculerDelai(complement.getSuivi().getId());
    }

    @Transactional
    public void cloturerSuspensionVisite(Long visiteId) {
        VisiteConformite visite = visiteConformiteRepository.findById(visiteId)
            .orElseThrow(() -> new EntityNotFoundException("Visite introuvable : " + visiteId));

        if (visite.getDateVisite2() == null)
            throw new IllegalStateException("dateVisite2 requise");

        SuspensionDelai suspension = suspensionDelaiRepository
            .findSuspensionActiveParSuivi(visite.getSuivi().getId())
            .orElseThrow(() -> new IllegalStateException("Aucune suspension active"));

        suspension.setDateFin(visite.getDateVisite2());
        suspensionDelaiRepository.save(suspension);
        recalculerDelai(visite.getSuivi().getId());
    }

    // ── 4. Clôture définitive ────────────────────────────────────────────────

    @Transactional
    public void cloturerDossier(Long suiviId) {
        Suivi suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new EntityNotFoundException("Suivi introuvable : " + suiviId));
        suivi.setStadeInstruction(StadeEnum.CLOTURE);
        suivi.setEcheancierDMP(null);
        suivi.setDelaiRestant(null);
        suiviRepository.save(suivi);
        log.info("Dossier clôturé — suivi={}", suiviId);
    }

    // ── Utilitaires privés ───────────────────────────────────────────────────

    private void validerPasDeSuspensionActive(Long suiviId) {
        suspensionDelaiRepository.findSuspensionActiveParSuivi(suiviId).ifPresent(s -> {
            throw new IllegalStateException(
                "Suspension déjà active pour le suivi " + suiviId);
        });
    }

    private boolean estDossierCloture(Complement complement) {
        return complement.getProduits().stream()
            .anyMatch(p -> p.equalsIgnoreCase("AF") || p.equalsIgnoreCase("AdF"));
    }
}
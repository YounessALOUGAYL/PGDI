// Chemin : backend/src/main/java/com/gestiondelais/batch/DelaiAlertJob.java
package com.gestiondelais.batch;

import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.enums.StadeEnum;
import com.gestiondelais.repository.SuiviRepository;
import com.gestiondelais.service.DelaiCalculService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
@RequiredArgsConstructor
public class DelaiAlertJob {

    private final SuiviRepository    suiviRepository;
    private final DelaiCalculService delaiCalculService;

    @Scheduled(cron = "0 0 0 * * ?")
    public void executerRecalculQuotidien() {
        LocalDateTime debut = LocalDateTime.now();
        log.info("═══ DelaiAlertJob démarré — {} ═══", debut);

        List<Suivi> suivisActifs = suiviRepository.findSuivisEligiblesRecalcul();

        if (suivisActifs.isEmpty()) {
            log.info("DelaiAlertJob — aucun dossier actif. Job terminé.");
            return;
        }

        AtomicInteger nbMisAJour        = new AtomicInteger(0);
        AtomicInteger nbNouveauxRetards = new AtomicInteger(0);
        AtomicInteger nbErreurs         = new AtomicInteger(0);
        List<String>  nouveauxRetards   = new ArrayList<>();
        List<String>  dossiersEnErreur  = new ArrayList<>();

        for (Suivi suivi : suivisActifs) {
            StadeEnum stadeAvant = suivi.getStadeInstruction();
            try {
                delaiCalculService.recalculerDelai(suivi.getId());
                nbMisAJour.incrementAndGet();

                suiviRepository.findById(suivi.getId()).ifPresent(r -> {
                    if (stadeAvant != StadeEnum.EN_RETARD
                            && r.getStadeInstruction() == StadeEnum.EN_RETARD) {
                        nbNouveauxRetards.incrementAndGet();
                        nouveauxRetards.add(String.format("[id=%d | %s | échéance=%s | %dj]",
                            r.getId(),
                            r.getDemande().getNumeroDossier(),
                            r.getEcheancierDMP(),
                            r.getDelaiRestant()));
                    }
                });
            } catch (Exception e) {
                nbErreurs.incrementAndGet();
                String ref = String.format("[id=%d | %s]", suivi.getId(),
                    suivi.getDemande() != null
                        ? suivi.getDemande().getNumeroDossier() : "N/A");
                dossiersEnErreur.add(ref);
                log.error("Erreur sur suivi {} : {}", ref, e.getMessage());
            }
        }

        long dureeMs = java.time.Duration.between(debut, LocalDateTime.now()).toMillis();
        log.info("═══ DelaiAlertJob terminé — {}ms | traités={} | màj={} | retards={} | erreurs={} ═══",
            dureeMs, suivisActifs.size(), nbMisAJour.get(),
            nbNouveauxRetards.get(), nbErreurs.get());

        nouveauxRetards.forEach(d -> log.warn("  ↳ Nouveau retard : {}", d));
        dossiersEnErreur.forEach(d -> log.error("  ↳ Erreur : {}", d));
    }
}
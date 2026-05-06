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
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DelaiCalculService {

    private final SuiviRepository            suiviRepository;
    private final SuspensionDelaiRepository  suspensionDelaiRepository;
    private final ComplementRepository       complementRepository;
    private final VisiteConformiteRepository visiteConformiteRepository;

    // ═══════════════════════════════════════════════════════════
    //  1. RECALCUL PRINCIPAL
    // ═══════════════════════════════════════════════════════════

    /**
     * Recalcule echeancierAMMPS, delaiRestant et stadeInstruction.
     *
     * Algorithme multi-compléments :
     *  1. Résoudre le nb de jours légaux (30, 60 ou personnalisé)
     *  2. Calculer le total des jours suspendus depuis TOUTES
     *     les SuspensionDelai terminées (compléments + visites)
     *  3. echeancier = dateReceptionAMMPS + nbJoursLegaux + totalJoursSuspendus
     *  4. delaiRestant = echeancier - aujourd'hui
     *  5. Dériver le stade
     */
    @Transactional
    public void recalculerDelai(Long suiviId) {
        Suivi suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Suivi introuvable : " + suiviId));

        if (suivi.getDateReceptionDMP() == null
                || suivi.getStadeInstruction() == StadeEnum.CLOTURE) return;

        int nbJoursLegaux       = resoudreNbJoursLegaux(suivi.getDemande());
        int totalJoursSuspendus = calculerTotalJoursSuspendus(suiviId);

        /*
         * Formule centrale :
         * echeancier = dateReception + jours_légaux + Σ(jours_suspendus_terminés)
         *
         * Exemple avec 2 compléments clôturés :
         *   dateReception = 01/01  |  légaux = 30j
         *   complément 1  = 5j suspendus (clôturé)
         *   complément 2  = 8j suspendus (clôturé)
         *   → echeancier = 01/01 + 30 + 5 + 8 = 13/02
         */
        LocalDate echeancier = suivi.getDateReceptionDMP()
            .plusDays(nbJoursLegaux)
            .plusDays(totalJoursSuspendus);

        int delaiRestant = (int) ChronoUnit.DAYS.between(LocalDate.now(), echeancier);

        suivi.setEcheancierDMP(echeancier);
        suivi.setDelaiRestant(delaiRestant);
        suivi.setTotalJoursSuspendu(totalJoursSuspendus);
        suivi.setStadeInstruction(determinerStade(suiviId, delaiRestant));
        suiviRepository.save(suivi);

        log.info("Suivi {} recalculé → échéance={}, restant={}j, "
                + "suspendus={}j, stade={}",
            suiviId, echeancier, delaiRestant,
            totalJoursSuspendus, suivi.getStadeInstruction());
    }

    private int resoudreNbJoursLegaux(Demande demande) {
        if (demande.getTypeDelaiLegal() == TypeDelaiEnum.PERSONNALISE) {
            if (demande.getNbJoursPersonnalise() == null
                    || demande.getNbJoursPersonnalise() <= 0)
                throw new IllegalStateException(
                    "nbJoursPersonnalise manquant — demande " + demande.getId());
            return demande.getNbJoursPersonnalise();
        }
        return demande.getTypeDelaiLegal().getNbJours();
    }

    /**
     * Calcule le total des jours suspendus sur toutes les suspensions
     * TERMINÉES (dateFin != null), toutes sources confondues
     * (compléments ET visites).
     *
     * Les suspensions EN COURS (dateFin == null) sont intentionnellement
     * exclues : le compteur est gelé pendant une suspension active —
     * les jours ne sont ajoutés à l'échéancier qu'à la clôture.
     */
    private int calculerTotalJoursSuspendus(Long suiviId) {
        return suspensionDelaiRepository
            .calculerTotalJoursSuspendusTermines(suiviId);
    }

    private StadeEnum determinerStade(Long suiviId, int delaiRestant) {
        boolean suspActive = suspensionDelaiRepository
            .findSuspensionActiveParSuivi(suiviId).isPresent();
        if (suspActive)           return StadeEnum.INSTRUIT;
        if (delaiRestant < 0)     return StadeEnum.EN_RETARD;
        return StadeEnum.EN_COURS;
    }

    // ═══════════════════════════════════════════════════════════
    //  2. OUVERTURE DE SUSPENSION — COMPLEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Ouvre une suspension suite à l'envoi d'un complément.
     *
     * Garde-fous (dans l'ordre d'évaluation) :
     *  1. Dossier non clôturé
     *  2. Aucun complément avec statut EN_ATTENTE (règle métier AMMPS)
     *     → message précis indiquant quel complément bloquer
     *  3. Aucune suspension active toutes sources confondues
     *     (couvre le cas d'une visite déjà en cours)
     *  4. dateEnvoiCpl renseigné
     */
    @Transactional
    public SuspensionDelai ouvrirSuspensionComplement(Long complementId) {
        Complement complement = complementRepository.findById(complementId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Complément introuvable : " + complementId));

        Suivi suivi = complement.getSuivi();

        // Garde-fou 1 — dossier clôturé
        if (suivi.getStadeInstruction() == StadeEnum.CLOTURE) {
            throw new IllegalStateException(
                "Impossible d'ajouter un complément : le dossier est clôturé.");
        }

        // Garde-fou 2 — complément EN_ATTENTE déjà présent (règle AMMPS)
        validerPasDeComplementEnAttente(suivi.getId());

        // Garde-fou 3 — suspension active toutes sources (visite en cours)
        validerPasDeSuspensionActive(suivi.getId());

        // Garde-fou 4 — date obligatoire
        if (complement.getDateEnvoiCpl() == null)
            throw new IllegalStateException(
                "dateEnvoiCpl est requise pour ouvrir une suspension.");

        SuspensionDelai suspension = SuspensionDelai.builder()
            .suivi(suivi)
            .motif(MotifSuspensionEnum.COMPLEMENT_DOSSIER)
            .dateDebut(complement.getDateEnvoiCpl())
            .sourceId(complement.getId())
            .sourceType("COMPLEMENT")
            .build();

        SuspensionDelai saved = suspensionDelaiRepository.save(suspension);
        complement.setStatutCpl(StatutCplEnum.EN_ATTENTE);
        complementRepository.save(complement);
        recalculerDelai(suivi.getId());

        log.info("Suspension COMPLEMENT #{} ouverte — suivi={}, début={}",
            complementId, suivi.getId(), suspension.getDateDebut());
        return saved;
    }

    // ═══════════════════════════════════════════════════════════
    //  3. OUVERTURE DE SUSPENSION — VISITE
    // ═══════════════════════════════════════════════════════════

    /**
     * Ouvre une suspension suite à la planification d'une visite.
     *
     * Garde-fous :
     *  1. Aucun complément EN_ATTENTE (on ne peut pas suspendre deux fois)
     *  2. Aucune suspension active toutes sources confondues
     *  3. Visite non marquée non-applicable
     *  4. dateVisite1 renseignée
     */
    @Transactional
    public SuspensionDelai ouvrirSuspensionVisite(Long visiteId) {
        VisiteConformite visite = visiteConformiteRepository.findById(visiteId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Visite introuvable : " + visiteId));

        Suivi suivi = visite.getSuivi();

        if (suivi.getStadeInstruction() == StadeEnum.CLOTURE)
            throw new IllegalStateException(
                "Impossible de planifier une visite : le dossier est clôturé.");

        validerPasDeComplementEnAttente(suivi.getId());
        validerPasDeSuspensionActive(suivi.getId());

        if (visite.isNonApplicable())
            throw new IllegalStateException(
                "Cette visite est marquée non-applicable (type Préalable).");

        if (visite.getDateVisite1() == null)
            throw new IllegalStateException(
                "dateVisite1 est requise pour ouvrir une suspension.");

        SuspensionDelai suspension = SuspensionDelai.builder()
            .suivi(suivi)
            .motif(MotifSuspensionEnum.VISITE_CONFORMITE)
            .dateDebut(visite.getDateVisite1())
            .sourceId(visite.getId())
            .sourceType("VISITE")
            .build();

        SuspensionDelai saved = suspensionDelaiRepository.save(suspension);
        recalculerDelai(suivi.getId());

        log.info("Suspension VISITE #{} ouverte — suivi={}, début={}",
            visiteId, suivi.getId(), suspension.getDateDebut());
        return saved;
    }

    // ═══════════════════════════════════════════════════════════
    //  4. CLÔTURE DE SUSPENSION — COMPLEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Clôture la suspension suite à la réception d'une réponse au complément.
     *
     * Après clôture, le délai reprend depuis la date de réception.
     * Si produits contient "AF" ou "AdF" → clôture définitive du dossier.
     *
     * Le total des jours suspendus est recalculé en base depuis toutes
     * les SuspensionDelai terminées (cumulatif multi-compléments).
     */
    @Transactional
    public void cloturerSuspensionComplement(Long complementId) {
        Complement complement = complementRepository.findById(complementId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Complément introuvable : " + complementId));

        if (complement.getDateReceptionCpl() == null)
            throw new IllegalStateException(
                "dateReceptionCpl est requise pour clôturer la suspension.");

        if (complement.getStatutCpl() != StatutCplEnum.EN_ATTENTE)
            throw new IllegalStateException(
                "Ce complément n'est pas en attente de réponse "
                + "(statut actuel : " + complement.getStatutCpl() + ").");

        Long suiviId = complement.getSuivi().getId();

        SuspensionDelai suspension = suspensionDelaiRepository
            .findSuspensionActiveParSuivi(suiviId)
            .orElseThrow(() -> new IllegalStateException(
                "Aucune suspension active trouvée pour le suivi " + suiviId
                + ". Le complément est EN_ATTENTE mais sa suspension est absente."));

        // Clôture de la suspension
        suspension.setDateFin(complement.getDateReceptionCpl());
        suspensionDelaiRepository.save(suspension);

        // Vérification clôture définitive (AF / AdF)
        if (estDossierCloture(complement)) {
            complement.setEstCloture(true);
            complement.setStatutCpl(StatutCplEnum.CLOTURE);
            complementRepository.save(complement);
            cloturerDossier(suiviId);
            log.info("Complément #{} → produit AF/AdF détecté — dossier clôturé",
                complementId);
            return;
        }

        // Reprise normale
        complement.setStatutCpl(StatutCplEnum.EN_COURS);
        complementRepository.save(complement);

        // Recalcul cumulatif — intègre maintenant cette suspension terminée
        recalculerDelai(suiviId);

        log.info("Suspension COMPLEMENT #{} clôturée — suivi={}, "
                + "reprise depuis {}, total suspendus recalculé",
            complementId, suiviId, complement.getDateReceptionCpl());
    }

    // ═══════════════════════════════════════════════════════════
    //  5. CLÔTURE DE SUSPENSION — VISITE
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public void cloturerSuspensionVisite(Long visiteId) {
        VisiteConformite visite = visiteConformiteRepository.findById(visiteId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Visite introuvable : " + visiteId));

        if (visite.getDateVisite2() == null)
            throw new IllegalStateException(
                "dateVisite2 est requise pour clôturer la suspension visite.");

        Long suiviId = visite.getSuivi().getId();

        SuspensionDelai suspension = suspensionDelaiRepository
            .findSuspensionActiveParSuivi(suiviId)
            .orElseThrow(() -> new IllegalStateException(
                "Aucune suspension active pour le suivi " + suiviId));

        suspension.setDateFin(visite.getDateVisite2());
        suspensionDelaiRepository.save(suspension);

        recalculerDelai(suiviId);

        log.info("Suspension VISITE #{} clôturée — suivi={}, reprise depuis {}",
            visiteId, suiviId, visite.getDateVisite2());
    }

    // ═══════════════════════════════════════════════════════════
    //  6. CLOTURE DEFINITIVE
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public void cloturerDossier(Long suiviId) {
        Suivi suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Suivi introuvable : " + suiviId));
        suivi.setStadeInstruction(StadeEnum.CLOTURE);
        suivi.setEcheancierDMP(null);
        suivi.setDelaiRestant(null);
        suiviRepository.save(suivi);
        log.info("Dossier clôturé définitivement — suivi={}", suiviId);
    }

    // ═══════════════════════════════════════════════════════════
    //  7. UTILITAIRES PRIVES
    // ═══════════════════════════════════════════════════════════

    /**
     * Garde-fou AMMPS — règle métier centrale :
     * Un seul complément EN_ATTENTE à la fois par dossier.
     *
     * Fournit un message d'erreur précis avec l'ID du complément bloquant,
     * contrairement à validerPasDeSuspensionActive() qui est plus générique.
     */
    private void validerPasDeComplementEnAttente(Long suiviId) {
        complementRepository
            .findComplementEnAttenteBySuiviId(suiviId)
            .ifPresent(c -> {
                throw new IllegalStateException(String.format(
                    "Impossible d'ajouter un nouveau complément : "
                    + "le complément #%d est encore EN_ATTENTE "
                    + "(envoyé le %s). Clôturez-le d'abord.",
                    c.getId(),
                    c.getDateEnvoiCpl()
                ));
            });
    }

    /**
     * Garde-fou général — aucune suspension active toutes sources confondues.
     * Couvre le cas d'une visite déjà en cours quand on tente un complément.
     */
    private void validerPasDeSuspensionActive(Long suiviId) {
        suspensionDelaiRepository
            .findSuspensionActiveParSuivi(suiviId)
            .ifPresent(s -> {
                throw new IllegalStateException(String.format(
                    "Une suspension est déjà active pour ce dossier "
                    + "(motif : %s, depuis le %s). "
                    + "Clôturez-la avant d'en ouvrir une nouvelle.",
                    s.getMotif(),
                    s.getDateDebut()
                ));
            });
    }

    private boolean estDossierCloture(Complement complement) {
        return complement.getProduits().stream()
            .anyMatch(p -> p.equalsIgnoreCase("AF")
                       || p.equalsIgnoreCase("AdF"));
    }
}

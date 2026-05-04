package com.gestiondelais.config;

import com.gestiondelais.model.enums.RoleEnum;
import com.gestiondelais.model.enums.StadeEnum;
import com.gestiondelais.model.enums.TypeDelaiEnum;
import com.gestiondelais.model.Demande;
import com.gestiondelais.model.Suivi;
import com.gestiondelais.model.Utilisateur;
import com.gestiondelais.repository.DemandeRepository;
import com.gestiondelais.repository.SuiviRepository;
import com.gestiondelais.repository.UtilisateurRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UtilisateurRepository utilisateurRepository,
                                   DemandeRepository demandeRepository,
                                   SuiviRepository suiviRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            // نتحقق إذا كانت قاعدة البيانات فارغة
            if (utilisateurRepository.count() == 0) {

                // 1. إنشاء الحسابات
                Utilisateur admin = new Utilisateur();
                admin.setNom("Administrateur Système");
                admin.setEmail("admin@ammps.ma");
                admin.setMotDePasse(passwordEncoder.encode("admin123"));
                admin.setRole(RoleEnum.ADMIN);
                admin.setActif(true);

                Utilisateur evaluateur = new Utilisateur();
                evaluateur.setNom("Dr. Évaluateur");
                evaluateur.setEmail("eval@ammps.ma");
                evaluateur.setMotDePasse(passwordEncoder.encode("eval123"));
                evaluateur.setRole(RoleEnum.EVALUATEUR);
                evaluateur.setActif(true);

                utilisateurRepository.save(admin);
                utilisateurRepository.save(evaluateur);

                // 2. إنشاء ملف متأخر جداً (لون أحمر 🔴)
                Demande d1 = new Demande();
                d1.setNumeroDossier("DOS-2026-001");
                d1.setNomEtablissement("Pharma Santé Maroc");
                d1.setTypeMotifDemande("Renouvellement AMM");
                d1.setDateDepot(LocalDate.now().minusDays(40));
                d1.setTypeDelaiLegal(TypeDelaiEnum.SGG_30J);
                d1.setDemandeur(admin);
                demandeRepository.save(d1);

                Suivi s1 = new Suivi();
                s1.setDemande(d1);
                s1.setEvaluateur(evaluateur);
                s1.setDateReceptionDMP(LocalDate.now().minusDays(38));
                s1.setStadeInstruction(StadeEnum.EN_RETARD);
                s1.setDelaiRestant(-8); // 8 أيام تأخير
                s1.setEcheancierDMP(LocalDate.now().minusDays(8));
                suiviRepository.save(s1);

                // 3. إنشاء ملف اقترب موعده (لون برتقالي 🟡)
                Demande d2 = new Demande();
                d2.setNumeroDossier("DOS-2026-045");
                d2.setNomEtablissement("BioLab Industries");
                d2.setTypeMotifDemande("Nouvelle AMM");
                d2.setDateDepot(LocalDate.now().minusDays(25));
                d2.setTypeDelaiLegal(TypeDelaiEnum.SGG_30J);
                d2.setDemandeur(admin);
                demandeRepository.save(d2);

                Suivi s2 = new Suivi();
                s2.setDemande(d2);
                s2.setEvaluateur(evaluateur);
                s2.setDateReceptionDMP(LocalDate.now().minusDays(25));
                s2.setStadeInstruction(StadeEnum.EN_COURS);
                s2.setDelaiRestant(5); // متبقي 5 أيام
                s2.setEcheancierDMP(LocalDate.now().plusDays(5));
                suiviRepository.save(s2);

                // 4. إنشاء ملف جديد وسليم (لون أخضر 🟢)
                Demande d3 = new Demande();
                d3.setNumeroDossier("DOS-2026-089");
                d3.setNomEtablissement("Médicaments Atlas");
                d3.setTypeMotifDemande("Variation Mineure");
                d3.setDateDepot(LocalDate.now().minusDays(2));
                d3.setTypeDelaiLegal(TypeDelaiEnum.AMMPS_60J);
                d3.setDemandeur(admin);
                demandeRepository.save(d3);

                Suivi s3 = new Suivi();
                s3.setDemande(d3);
                s3.setEvaluateur(evaluateur);
                s3.setDateReceptionDMP(LocalDate.now().minusDays(1));
                s3.setStadeInstruction(StadeEnum.EN_COURS);
                s3.setDelaiRestant(59); // متبقي 59 يوماً
                s3.setEcheancierDMP(LocalDate.now().plusDays(59));
                suiviRepository.save(s3);

                System.out.println("✅ Données de test (Rouge, Orange, Vert) créées avec succès !");
            }
        };
    }
}
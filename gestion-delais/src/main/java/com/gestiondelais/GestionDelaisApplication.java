// Chemin : backend/src/main/java/com/gestiondelais/GestionDelaisApplication.java
package com.gestiondelais;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GestionDelaisApplication {
    public static void main(String[] args) {
        SpringApplication.run(GestionDelaisApplication.class, args);
    }
}
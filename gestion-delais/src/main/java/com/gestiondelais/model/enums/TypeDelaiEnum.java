// Chemin : backend/src/main/java/com/gestiondelais/model/enums/TypeDelaiEnum.java
package com.gestiondelais.model.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TypeDelaiEnum {
    SGG_30J(30, "SGG — 30 jours"),
    AMMPS_60J(60, "AMMPS — 60 jours"),
    PERSONNALISE(0, "Délai personnalisé");

    private final int    nbJours;
    private final String libelle;
}
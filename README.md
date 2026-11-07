# sol-renforce

Vérification d'un **mur vertical en sol renforcé** (feuillards d'acier ou nappes géosynthétiques) selon
l'**EN 1997** et l'**EN 1990**, dans leurs **deux générations** : stabilité interne (rupture et
arrachement de chaque lit), stabilité externe (glissement, portance, basculement, excentricité) et
stabilité générale par Bishop, forces des armatures comprises. Un bouton bascule d'une génération à
l'autre **sans rien ressaisir**.

Fait partie de la suite [Aedificium web](https://henri421.github.io/WebAedificium/).
Page publiée : <https://henri421.github.io/sol-renforce/> (en anglais : `/en/`).

> **Aide au calcul. L'outil constate, il ne prescrit pas.** Valeurs recommandées des normes. En
> 1ʳᵉ génération, ni l'EN 1997-1:2004 ni l'ANB 2022 ne donnent les coefficients internes : l'utilisateur
> saisit γRt et γR,po, sans valeur par défaut. La 2ᵉ génération n'est applicable qu'une fois son annexe
> nationale publiée. **Les valeurs ont été comparées à un calcul indépendant, pas encore à un logiciel du
> commerce.** La vérification finale incombe à l'ingénieur du projet.

## Ce que l'outil rend

- **Stabilité interne** : effort T = K·σv·Sv dans chaque lit, résistance à la rupture (section après
  corrosion pour l'acier, EN 1997-3:2025, 9.3.4) et à l'arrachement au-delà de la ligne des tractions
  maximales. Acier : gravité cohérente (F.3.2), profil K/Ka et coefficients μpo modifiables, valeurs par
  défaut FHWA-NHI-10-024 citées. Géosynthétique : coin de Rankine (F.3.3).
- **2ᵉ génération** : interne par l'approche des matériaux (VC3 + M2) ou des résistances (VC1),
  tableau 9.4 de l'EN 1997-3:2025 ; externe en (a) + (b), (c) ou (d) ; basculement VC2(a) et VC2(b) ;
  excentricité (tableau 5.3) ; classes de conséquences CC1 à CC3.
- **1ʳᵉ génération** : DA1, DA2, DA3 pour l'externe et la stabilité générale, EQU pour le basculement,
  profil recommandé ou NBN EN 1997-1 ANB:2022.
- **Stabilité générale et mixte** : Bishop simplifié à 200 tranches, armatures coupées à leur résistance
  de calcul, cercle critique recherché (sortie au pied ou devant) ou imposé.
- **Coupe** à l'échelle réelle : massif, lits, ligne des tractions maximales, cercle et efforts des
  armatures coupées ; **tableau des lits** ; un taux par vérification, sans verdict global.
- **Sorties** : note de calcul HTML produite par les mêmes fonctions que l'écran, coupe (SVG),
  résultats (CSV), saisie enregistrée (JSON, format `sol-renforce/1`).

## Choix déclarés

- Massif rectangulaire à parement vertical, armatures horizontales de longueur uniforme ; alerte si
  L < 0,7·H (longueur minimale usuelle, FHWA), sans refus.
- Poussée du remblai retenu horizontale (Rankine) sur la hauteur H ; contrainte verticale au lit γ·z + q,
  sans répartition de Meyerhof ; surcharge variable non comptée dans les résistances.
- Section réduite sous 50 % de A0 après corrosion, ou fy au-delà de 500 MPa (non galvanisé) et 600 MPa (galvanisé) : refus (9.3.4).

## Hors périmètre

Parement incliné, talus renforcés et renforcement de base, armatures de longueurs variables, nappe
phréatique dans le massif, séisme, états limites de service.

## Origine des moteurs

Ce dépôt appelle deux paquets de la suite : `sol-ec7` (coefficients partiels, portance, Bishop avec
zones et armatures) et `aedificium-ui` (interface et note). L'assemblage est dans `src/mur.ts`.

## Développement

```bash
npm install
npm run typecheck
npm test
npm run build
```

Licence MIT.

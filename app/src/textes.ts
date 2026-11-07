/**
 * Les textes affiches, en francais et en anglais. PUR.
 * Aucun texte ne se lit au chargement d'un module : toujours `textes()` ou `phrase()` au moment du rendu.
 * Les indices s'ecrivent en notation (`F_d`, `γ_R,po`) : `notationHtml` les met en `<sub>` au rendu.
 *
 * SQUELETTE (T0) : `messages`, `clauses`, `verifications` et `note` sont ecrits et ne changent pas
 * (note.ts les lit). Les autres textes (saisie, verdicts, volets, dessin, refus) s'ajoutent a
 * FR et a EN aux taches T1 a T3 ; les regles de `phrase` (phrases du noyau en anglais) a T5.
 */

import { langueCourante, traducteur } from 'aedificium-ui';

const FR = {
  messages: {
    rienAExporter: 'Aucun calcul valide à exporter : corriger la saisie.',
    nouvelleVersion: 'Une nouvelle version est disponible. Recharger maintenant ?',
  },
  /** Clauses par generation et par verification (verdicts et note). */
  clauses: {
    '1re': {
      stabilite: 'EN 1997-1 §11.5.1',
      interne: 'coefficients saisis',
      glissement: 'EN 1997-1 §6.5.3',
      portance: 'EN 1997-1 §6.5.2',
      renversement: 'EN 1997-1 §2.4.7.2',
      excentricite: '',
    },
    '2e': {
      stabilite: 'EN 1997-3 §4.6.3, F.3.1',
      interne: 'EN 1997-3 §9.6, tableau 9.4',
      glissement: 'EN 1997-3 §5.6',
      portance: 'EN 1997-3 §5.6, B.4',
      renversement: 'EN 1990 tableau A.1.8',
      excentricite: 'EN 1997-3 tableau 5.3',
    },
  },
  /** Noms des verifications, sans norme. */
  verifications: {
    stabilite: 'Stabilité générale',
    interne: 'Rupture et arrachement',
    glissement: 'Glissement',
    portance: 'Portance',
    renversement: 'Basculement',
    excentricite: 'Excentricité',
  },
  note: {
    element: 'Mur en sol renforcé',
    titreEntrees: 'Données d’entrée',
    legendeCoupe: 'Coupe du mur à l’échelle, lits, ligne des tractions maximales et cercle de la combinaison gouvernante.',
    coefficients: 'Coefficients partiels',
    combinaisons: {
      '1re': [
        'Externe et stabilité générale : approche de calcul retenue (EN 1997-1:2004, annexe A).',
        'Basculement : état limite EQU.',
        'Interne : actions de l’approche retenue ; diviseurs γ_Rt (rupture) et γ_R,po (arrachement) saisis, la norme n’en donnant pas.',
      ],
      '2e': [
        'Interne : tableau 9.4 de l’EN 1997-3:2025, approche par les matériaux (VC3 + M2) ou par les résistances (VC1).',
        'Externe : cas (a) + (b), (c) ou (d) du tableau 5.2 de l’EN 1997-3:2025.',
        'Basculement : VC2(a) et VC2(b), le plus défavorable (EN 1990:2023, tableau A.1.8).',
        'Excentricité de la résultante : tableau 5.3 de l’EN 1997-3:2025.',
        'Stabilité générale : VC3 + M2, forces des armatures coupées à leur résistance de calcul (F.3.1).',
      ],
    },
    hypotheses: [
      'Massif rectangulaire à parement vertical ; armatures horizontales de longueur L uniforme.',
      'Poussée du remblai retenu horizontale (Rankine), appliquée sur la hauteur H du massif.',
      'Contrainte verticale au lit : γ·z + q, sans répartition de Meyerhof.',
      'Surcharges uniformes sur toute la crête ; la variable n’entre pas dans les résistances (arrachement, glissement).',
      'Stabilité générale : Bishop simplifié, 200 tranches ; le terrain devant le parement est compté en remblai retenu ; la recherche ne garde que les cercles qui sortent au pied ou devant.',
    ],
    tractions: {
      acier: 'Feuillards d’acier : gravité cohérente (F.3.2), ligne des tractions maximales bilinéaire (0,3·H), profil K/Ka saisi.',
      geosynthetique: 'Géosynthétique : coin de Rankine (F.3.3), ligne des tractions maximales à 45° − φ/2.',
    },
    lits: (combinaison: string) => `Lits d’armatures, ${combinaison}`,
    colonnesLits: ['h (m)', 'z (m)', 'K', 'σ_v (kPa)', 'T (kN/m)', 'L_a (m)', 'L_e (m)', 'R_t (kN/m)', 'R_po (kN/m)', 'Taux'],
    corrosion: (deltaE: string, Ar: string, pourcent: string) =>
      `Section après corrosion (EN 1997-3:2025, 9.3.4) : Δe = ${deltaE} mm par face, A_r = ${Ar} mm² par feuillard, soit ${pourcent} % de A_0.`,
  },
};

export type Textes = typeof FR;

const EN: Textes = {
  messages: {
    rienAExporter: 'No valid calculation to export: correct the input.',
    nouvelleVersion: 'A new version is available. Reload now?',
  },
  clauses: {
    '1re': {
      stabilite: 'EN 1997-1 §11.5.1',
      interne: 'factors entered by the user',
      glissement: 'EN 1997-1 §6.5.3',
      portance: 'EN 1997-1 §6.5.2',
      renversement: 'EN 1997-1 §2.4.7.2',
      excentricite: '',
    },
    '2e': {
      stabilite: 'EN 1997-3 §4.6.3, F.3.1',
      interne: 'EN 1997-3 §9.6, table 9.4',
      glissement: 'EN 1997-3 §5.6',
      portance: 'EN 1997-3 §5.6, B.4',
      renversement: 'EN 1990 table A.1.8',
      excentricite: 'EN 1997-3 table 5.3',
    },
  },
  verifications: {
    stabilite: 'Overall stability',
    interne: 'Rupture and pull-out',
    glissement: 'Sliding',
    portance: 'Bearing',
    renversement: 'Overturning',
    excentricite: 'Eccentricity',
  },
  note: {
    element: 'Reinforced soil wall',
    titreEntrees: 'Input data',
    legendeCoupe: 'Section of the wall to scale, layers, line of maximum tension and circle of the governing combination.',
    coefficients: 'Partial factors',
    combinaisons: {
      '1re': [
        'External and overall stability: chosen design approach (EN 1997-1:2004, annex A).',
        'Overturning: EQU limit state.',
        'Internal: actions of the chosen approach; divisors γ_Rt (rupture) and γ_R,po (pull-out) entered by the user, as the standard gives none.',
      ],
      '2e': [
        'Internal: table 9.4 of EN 1997-3:2025, material factor approach (VC3 + M2) or resistance factor approach (VC1).',
        'External: case (a) + (b), (c) or (d) of table 5.2 of EN 1997-3:2025.',
        'Overturning: VC2(a) and VC2(b), the more unfavourable (EN 1990:2023, table A.1.8).',
        'Eccentricity of the resultant: table 5.3 of EN 1997-3:2025.',
        'Overall stability: VC3 + M2, forces of the cut reinforcements at their design resistance (F.3.1).',
      ],
    },
    hypotheses: [
      'Rectangular block with a vertical face; horizontal reinforcements of uniform length L.',
      'Thrust of the retained fill horizontal (Rankine), applied over the height H of the block.',
      'Vertical stress at a layer: γ·z + q, without Meyerhof distribution.',
      'Uniform surcharges over the whole crest; the variable one is not counted in the resistances (pull-out, sliding).',
      'Overall stability: simplified Bishop, 200 slices; the ground in front of the face is counted as retained fill; the search keeps only circles exiting at or in front of the toe.',
    ],
    tractions: {
      acier: 'Steel strips: coherent gravity (F.3.2), bilinear line of maximum tension (0.3·H), K/Ka profile as entered.',
      geosynthetique: 'Geosynthetic: Rankine wedge (F.3.3), line of maximum tension at 45° − φ/2.',
    },
    lits: (combinaison: string) => `Reinforcement layers, ${combinaison}`,
    colonnesLits: ['h (m)', 'z (m)', 'K', 'σ_v (kPa)', 'T (kN/m)', 'L_a (m)', 'L_e (m)', 'R_t (kN/m)', 'R_po (kN/m)', 'Ratio'],
    corrosion: (deltaE: string, Ar: string, pourcent: string) =>
      `Section after corrosion (EN 1997-3:2025, 9.3.4): Δe = ${deltaE} mm per face, A_r = ${Ar} mm² per strip, i.e. ${pourcent} % of A_0.`,
  },
};

export function textes(): Textes {
  return langueCourante() === 'en' ? EN : FR;
}

/**
 * Ponctuation de la langue courante : les assemblages « a : b » et « a ; b » portent
 * l'espace francaise ; en anglais, les deux-points et le point-virgule se collent au mot.
 */
export function ponctuer(s: string): string {
  return langueCourante() === 'en' ? s.replace(/ ([:;])(?=\s)/g, '$1') : s;
}

// --- Phrases du noyau : traduites en anglais seulement ; en francais, phrase() rend le texte intact --

/** Phrases exactes du noyau (sources, alertes, refus). A completer en T5. */
const EXACTES: Record<string, string> = {};

/** Regles par motif, la derniere attrape tout. A completer en T5. */
const REGLES: [RegExp, (_m: string, ...g: string[]) => string][] = [];

/** Traduction d'une phrase du noyau, ou de la saisie, au rendu seulement. */
export const phrase = traducteur(EXACTES, REGLES);

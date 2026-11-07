/**
 * La saisie, en chaines, et sa conversion en donnees du noyau. PUR.
 *
 * Une seule saisie pour les deux generations et les deux armatures : basculer ne change
 * aucune valeur saisie. Les champs propres a un choix restent saisis quand l'autre est
 * actif ; seuls ceux du choix retenu sont lus.
 *
 * SQUELETTE (T0) : types imposes par PLAN-interface.md, fonctions a ecrire (T1).
 */

import type { Approche, Approche2e, ClasseConsequences, Risque } from 'sol-ec7';
import type { DonneesMur, ResultatMur } from '../../src/mur';

export type Generation = '1re' | '2e';

/** Une seule saisie : tout est du texte (virgule decimale acceptee), sauf les choix. */
export interface Saisie {
  generation: Generation;
  /** 1re generation. */
  profilNormatif: 'recommande' | 'anb2022';
  risque: Risque;
  approche1: Approche;
  /** Diviseurs internes de 1re generation : vides par defaut, a saisir. */
  gRt: string;
  gRpo: string;
  /** 2e generation. */
  consequences: ClasseConsequences;
  approche2e: Approche2e;
  facteurInterne: 'materiaux' | 'resistances';
  /** Geometrie (m). */
  H: string;
  L: string;
  D: string;
  premierLit: string;
  Sv: string;
  /** Remblai renforce et remblai retenu. */
  gammaR: string;
  phiR: string;
  gammaB: string;
  phiB: string;
  /** Sol de fondation. */
  drainageF: 'draine' | 'non_draine';
  gammaF: string;
  phiF: string;
  cF: string;
  cuF: string;
  /** Surcharges sur la crete (kPa). */
  qG: string;
  qQ: string;
  armature: 'acier' | 'geosynthetique';
  /** Feuillards d'acier. */
  nbParMetre: string;
  largeur: string;
  epaisseur: string;
  fy: string;
  galvanise: boolean;
  milieu: 'terrestre' | 'eau_douce';
  dureeVie: string;
  repartition: 'uniforme' | 'non_uniforme';
  KsurKa0: string;
  KsurKaZ0: string;
  z0: string;
  muPo0: string;
  muPoZ0: string;
  /** Geosynthetique. */
  Tk: string;
  etaGs: string;
  gammaRd: string;
  Rc: string;
  kpo: string;
  /** Cercle de stabilite generale. */
  modeCercle: 'recherche' | 'impose';
  xc: string;
  yc: string;
  R: string;
}

export interface Calcul {
  donnees: DonneesMur;
}

export type Lecture = { ok: true; calcul: Calcul } | { ok: false; message: string };

/** Le resultat du noyau, avec la generation. */
export type Resultat = ResultatMur & { generation: Generation };

/** Les cinq valeurs de la gravite coherente, en texte. */
export type DefautsFhwa = Pick<Saisie, 'KsurKa0' | 'KsurKaZ0' | 'z0' | 'muPo0' | 'muPoZ0'>;

const A_ECRIRE = (): never => {
  throw new Error('a ecrire');
};

export function saisieParDefaut(): Saisie {
  return A_ECRIRE();
}

export function lireSaisie(_s: Saisie): Lecture {
  return A_ECRIRE();
}

export function verifier(_calcul: Calcul): Resultat {
  return A_ECRIRE();
}

/** Valeurs par defaut FHWA (`defautsGraviteCoherente` du noyau, Cu = 4), pour φ'r saisi ; null si illisible. */
export function defautsFhwa(_phiR: string): DefautsFhwa | null {
  return A_ECRIRE();
}

export function serialiser(_s: Saisie): string {
  return A_ECRIRE();
}

export function relire(_contenu: string): Saisie {
  return A_ECRIRE();
}

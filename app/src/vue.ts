/**
 * Presentation du resultat : verdicts, volets, tableau des lits, blocs du CSV et de la note. PUR.
 * Tout vient du resultat du noyau ; aucun calcul ici.
 *
 * SQUELETTE (T0) : signatures imposees par PLAN-interface.md, fonctions a ecrire (T2).
 */

import type { BlocResultat, LigneResultat } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';

/** Lignes d'entree rangees par section de la note ; `blocEntrees` les met bout a bout dans cet ordre. */
export interface EntreesParSection {
  geometrie: LigneResultat[];
  materiaux: LigneResultat[];
  charges: LigneResultat[];
  hypotheses: LigneResultat[];
}

const A_ECRIRE = (): never => {
  throw new Error('a ecrire');
};

export function entreesParSection(_calcul: Calcul): EntreesParSection {
  return A_ECRIRE();
}

export function blocEntrees(_calcul: Calcul): BlocResultat {
  return A_ECRIRE();
}

/** Synthese, puis un bloc par verification et par combinaison. */
export function blocsResultat(_r: Resultat): BlocResultat[] {
  return A_ECRIRE();
}

export function verdictsHtml(_r: Resultat): string {
  return A_ECRIRE();
}

export function voletsHtml(_r: Resultat): string {
  return A_ECRIRE();
}

/** Tableau des lits d'une combinaison interne (son nom) ; la section apres corrosion pour l'acier. */
export function litsHtml(_r: Resultat, _combinaison: string): string {
  return A_ECRIRE();
}

export function messageDErreur(_e: unknown): string {
  return A_ECRIRE();
}

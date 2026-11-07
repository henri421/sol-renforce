/**
 * La coupe du mur en sol renforce, a l'echelle, en SVG. PUR.
 * Les classes imposees sont en tete de `tests/app/dessin.test.ts`.
 *
 * SQUELETTE (T0) : signatures imposees par PLAN-interface.md, fonctions a ecrire (T3).
 */

import type { Calcul, Resultat } from './form';

export interface OptionsCoupe {
  cotes: boolean;
  tractions: boolean;
}

const A_ECRIRE = (): never => {
  throw new Error('a ecrire');
};

/** Une vue par combinaison de stabilite generale, dans l'ordre du noyau. */
export function vuesDisponibles(_r: Resultat): string[] {
  return A_ECRIRE();
}

/** La combinaison de stabilite generale au plus fort taux. */
export function vueGouvernante(_r: Resultat): string {
  return A_ECRIRE();
}

export function coupe(_calcul: Calcul, _r: Resultat, _vue: string, _options: OptionsCoupe): string {
  return A_ECRIRE();
}

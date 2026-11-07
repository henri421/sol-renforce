/** Saisies et lecture partagees par les tests d'acceptation de l'interface. A ne pas modifier. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lireSaisie, saisieParDefaut, verifier, type Calcul, type Resultat, type Saisie } from '../../app/src/form';

export const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');

export function calculer(s: Saisie): { calcul: Calcul; r: Resultat } {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  return { calcul: l.calcul, r: verifier(l.calcul) };
}

/** 1re generation, diviseurs internes saisis. */
export const premiere = (s: Partial<Saisie> = {}): Saisie => ({ ...saisieParDefaut(), generation: '1re', gRt: '1,1', gRpo: '1,35', ...s });

/** Nappe geosynthetique (T_k 80 kN/m, η_gs 0,45, γ_Rd 1, R_c 1, k_po 0,6). */
export const geosynthetique = (s: Partial<Saisie> = {}): Saisie => ({ ...saisieParDefaut(), armature: 'geosynthetique', ...s });

/** Cercle impose : O (1 ; 8), R 7,5 m ; il coupe un lit. */
export const impose = (s: Partial<Saisie> = {}): Saisie => ({ ...saisieParDefaut(), modeCercle: 'impose', ...s });

/** Armatures courtes (L 3 m < 0,7·H) : alerte du noyau, portance et interne au-dela de 1. */
export const court = (): Saisie => ({ ...saisieParDefaut(), L: '3' });

/** Fondation non drainee molle (c_u 20 kPa) : alerte m_α du noyau, taux au-dela de 1. */
export const mou = (): Saisie => ({ ...saisieParDefaut(), drainageF: 'non_draine', gammaF: '18', cuF: '20' });

/** Toutes les formes de resultat que l'interface doit savoir afficher. */
export const SAISIES: [string, Saisie][] = [
  ['defaut', saisieParDefaut()],
  ['2e resistances', { ...saisieParDefaut(), facteurInterne: 'resistances' }],
  ['2e (c)', { ...saisieParDefaut(), approche2e: 'c' }],
  ['2e (d) CC3', { ...saisieParDefaut(), approche2e: 'd', consequences: 'CC3' }],
  ['geosynthetique', geosynthetique()],
  ['1re DA1', premiere()],
  ['1re DA2', premiere({ approche1: 'DA2' })],
  ['1re DA3', premiere({ approche1: 'DA3' })],
  ['1re ANB risque eleve', premiere({ profilNormatif: 'anb2022', risque: 'eleve' })],
  ['1re geosynthetique', premiere({ armature: 'geosynthetique' })],
  ['impose', impose()],
  ['fondation non drainee', { ...saisieParDefaut(), drainageF: 'non_draine', cuF: '60' }],
  ['court', court()],
  ['mou', mou()],
  ['sans surcharge', { ...saisieParDefaut(), qG: '0', qQ: '0' }],
  ['acier galvanise en eau douce', { ...saisieParDefaut(), milieu: 'eau_douce', repartition: 'non_uniforme', dureeVie: '50' }],
];

/**
 * Mur en sol renforce a parement vertical : noyau de verification.
 *
 * 2e generation : EN 1997-3:2025, clause 9 et annexe F (9.3.4 corrosion, 9.5.4 arrachement,
 * 9.6 et tableau 9.4) ; clauses 5 et 7 pour le glissement, la portance et le basculement ;
 * clause 4 et F.3.1 pour la stabilite generale et mixte.
 * 1re generation : EN 1997-1:2004 (DA1, DA2, DA3, EQU) pour l'externe et la stabilite ;
 * coefficients internes saisis par l'utilisateur (aucune valeur dans la norme).
 *
 * Unites : m, kN/m (par metre de parement), kPa, kN/m3 ; mm, mm2 et MPa pour les armatures ;
 * angles en degres dans les donnees. Repere : x horizontal vers l'arriere du massif,
 * pied du parement en (0 ; 0), base du massif a y = 0.
 *
 * Squelette (T0) : types imposes par PLAN.md, fonctions a ecrire.
 */
import type { Approche, Approche2e, Cercle, ClasseConsequences, ResultatCercle, Risque } from 'sol-ec7';

export interface Geometrie {
  /** Hauteur du massif, de la base a la crete (m). */
  H: number;
  /** Longueur des armatures, uniforme (m). */
  L: number;
  /** Encastrement : cote du terrain devant le parement, 0 <= D < H (m). */
  D: number;
  /** Hauteur du premier lit au-dessus de la base (m). */
  premierLit: number;
  /** Espacement vertical des lits, uniforme (m). */
  Sv: number;
}

export interface Remblai {
  gamma: number;
  phiDeg: number;
}

export interface SolFondation {
  gamma: number;
  drainage: 'draine' | 'non_draine';
  phiDeg?: number;
  c?: number;
  cu?: number;
}

/** Feuillards d'acier (terre armee) ; gravite coherente (F.3.2). */
export interface ArmatureAcier {
  type: 'acier';
  /** Nombre de feuillards par metre de parement et par lit. */
  nbParMetre: number;
  /** Largeur et epaisseur initiales (mm). */
  largeur: number;
  epaisseur: number;
  /** Limite d'elasticite nominale (MPa). */
  fy: number;
  galvanise: boolean;
  milieu: 'terrestre' | 'eau_douce';
  /** Duree d'utilisation de projet (ans). */
  dureeVie: number;
  /** Repartition de la resistance dans la section (tableau 9.3). */
  repartition: 'uniforme' | 'non_uniforme';
  /** Profil K/Ka : valeur en tete, valeur a z0 et au-dela, z0 (m). */
  KsurKa0: number;
  KsurKaZ0: number;
  z0: number;
  /** Coefficient d'interaction mu_po (9.10) en tete et a z0 et au-dela. */
  muPo0: number;
  muPoZ0: number;
}

/** Nappe geosynthetique ; coin de Rankine (F.3.3). */
export interface ArmatureGeosynthetique {
  type: 'geosynthetique';
  /** Resistance caracteristique a la traction T_k (kN/m). */
  Tk: number;
  /** Facteur de reduction eta_gs (9.2), dans ]0 ; 1]. */
  etaGs: number;
  /** Facteur de modele gamma_Rd,gs (9.17), 2e generation, >= 1. */
  gammaRd: number;
  /** Taux de couverture R_c, dans ]0 ; 1]. */
  Rc: number;
  /** Facteur d'arrachement k_po (9.9), > 0. */
  kpo: number;
}

export type Armature = ArmatureAcier | ArmatureGeosynthetique;

/** 1re generation : diviseurs saisis des resistances internes, > 0. Aucune valeur par defaut. */
export interface CoefficientsInternes1g {
  gRt: number;
  gRpo: number;
}

export interface DonneesMur {
  generation: '1re' | '2e';
  /** 1re generation. */
  profilNormatif: 'recommande' | 'anb2022';
  risque: Risque;
  approche: Approche;
  coefficientsInternes1g: CoefficientsInternes1g | null;
  /** 2e generation. */
  cc: ClasseConsequences;
  approche2e: Approche2e;
  facteurInterne: 'materiaux' | 'resistances';
  geometrie: Geometrie;
  remblaiRenforce: Remblai;
  remblaiRetenu: Remblai;
  fondation: SolFondation;
  /** Surcharges uniformes sur toute la crete, permanente et variable (kPa). */
  qG: number;
  qQ: number;
  armature: Armature;
  /** Cercle impose pour la stabilite generale et mixte ; null : recherche par combinaison. */
  cercle: Cercle | null;
}

export interface Lit {
  /** Hauteur au-dessus de la base (m). */
  h: number;
  /** Profondeur sous la crete, H - h (m). */
  z: number;
  /** Hauteur d'influence (m). */
  Sv: number;
}

export interface ValeurNommee {
  nom: string;
  valeur: number;
  source: string;
}

export interface ResultatLit extends Lit {
  /** K de calcul (-). */
  K: number;
  /** Contrainte verticale de calcul au lit (kPa). */
  sigmaV: number;
  /** Effort de calcul dans le lit (kN/m). */
  T: number;
  /** Longueur active et longueur d'ancrage (m). */
  La: number;
  Le: number;
  /** Resistances de calcul a la rupture et a l'arrachement (kN/m). */
  Rt: number;
  Rpo: number;
  tauxRupture: number;
  tauxArrachement: number;
  taux: number;
}

export interface ResultatInterne {
  nom: string;
  Ka: number;
  phi_d: number;
  lits: ResultatLit[];
  tauxMax: number;
  conforme: boolean;
  coefficients: ValeurNommee[];
}

export interface Verification {
  taux: number;
  conforme: boolean;
  detail: Record<string, number>;
}

export interface ResultatExterne {
  nom: string;
  glissement: Verification;
  portance: Verification;
}

export interface ResultatStabilite {
  nom: string;
  cercle: Cercle;
  F: number;
  taux: number;
  conforme: boolean;
  resultat: Extract<ResultatCercle, { valide: true }>;
}

export interface ResultatMur {
  /** Nom du profil de coefficients. */
  profil: string;
  lits: Lit[];
  /** Acier seulement : perte d'epaisseur par face (mm) et section par feuillard (mm2). */
  section: { deltaE: number; A0: number; Ar: number; rapport: number } | null;
  interne: ResultatInterne[];
  externe: ResultatExterne[];
  /** 1re generation : EQU ; 2e generation : VC2(a) ou VC2(b), le plus defavorable. */
  renversement: { nom: string; Mdst: number; Mstb: number; taux: number; conforme: boolean };
  /** 2e generation seulement (tableau 5.3). */
  excentricite: { eG: number; tauxG: number; eGQ: number; tauxGQ: number; taux: number; conforme: boolean } | null;
  stabilite: ResultatStabilite[];
  gouvernant: { verification: string; combinaison: string; taux: number };
  alertes: string[];
}

const A_ECRIRE = 'a ecrire';

export function positionsLits(_g: Geometrie): Lit[] {
  throw new Error(A_ECRIRE);
}

export function facteurKcc(_a: ArmatureAcier): number {
  throw new Error(A_ECRIRE);
}

export function perteEpaisseur(_a: ArmatureAcier): number {
  throw new Error(A_ECRIRE);
}

export function sectionReduite(_a: ArmatureAcier): { A0: number; Ar: number; rapport: number } {
  throw new Error(A_ECRIRE);
}

export function longueurActive(_a: Armature, _H: number, _h: number, _phiDeg: number): number {
  throw new Error(A_ECRIRE);
}

export function defautsGraviteCoherente(_phiRemblaiDeg: number, _Cu?: number): {
  KsurKa0: ValeurNommee;
  KsurKaZ0: ValeurNommee;
  z0: ValeurNommee;
  muPo0: ValeurNommee;
  muPoZ0: ValeurNommee;
} {
  throw new Error(A_ECRIRE);
}

export function verifierMur(_d: DonneesMur): ResultatMur {
  throw new Error(A_ECRIRE);
}

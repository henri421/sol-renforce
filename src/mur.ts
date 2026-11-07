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
import {
  combinaisons1g,
  combinaisons2g,
  combinaisonsStabilite2g,
  profil1g,
  profil2g,
  profilAnb2022,
} from 'sol-ec7';

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

const RAD = Math.PI / 180;

/** Nombre au format francais, pour les messages. */
function fr(x: number, decimales = 2): string {
  return x.toFixed(decimales).replace('.', ',');
}

function strictementPositif(v: number, nom: string, unite: string): void {
  if (!(Number.isFinite(v) && v > 0)) {
    throw new Error(`${nom} doit être un nombre strictement positif (${unite}).`);
  }
}

function positifOuNul(v: number, nom: string, unite: string): void {
  if (!(Number.isFinite(v) && v >= 0)) {
    throw new Error(`${nom} doit être un nombre positif ou nul (${unite}).`);
  }
}

/** Angle de frottement saisi en degres : strictement dans ]0 ; 90[. */
function angleSaisi(phiDeg: number, nom: string): void {
  if (!(Number.isFinite(phiDeg) && phiDeg > 0 && phiDeg < 90)) {
    throw new Error(`L'angle de frottement φ ${nom} doit être strictement compris entre 0 et 90 degrés (φ = ${phiDeg}).`);
  }
}

/** Positivite de toutes les grandeurs d'un feuillard d'acier (refus de saisie). */
function verifierAcier(a: ArmatureAcier): void {
  strictementPositif(a.nbParMetre, 'Le nombre de feuillards par mètre n', 'sans unité');
  strictementPositif(a.largeur, 'La largeur b du feuillard', 'mm');
  strictementPositif(a.epaisseur, "L'épaisseur e du feuillard", 'mm');
  strictementPositif(a.fy, "La limite d'élasticité fy", 'MPa');
  strictementPositif(a.dureeVie, "La durée d'utilisation de projet", 'ans');
  strictementPositif(a.KsurKa0, 'Le rapport K/Ka en tête', 'sans unité');
  strictementPositif(a.KsurKaZ0, 'Le rapport K/Ka à z0', 'sans unité');
  strictementPositif(a.z0, 'La profondeur z0', 'm');
  strictementPositif(a.muPo0, 'Le coefficient μpo,0', 'sans unité');
  strictementPositif(a.muPoZ0, 'Le coefficient μpo,z0', 'sans unité');
}

/** Refus de saisie d'une nappe geosynthetique (EN 1997-3:2025, 9.2 et 9.9, 9.17). */
function verifierGeosynthetique(a: ArmatureGeosynthetique): void {
  strictementPositif(a.Tk, 'La résistance caractéristique Tk', 'kN/m');
  if (!(a.etaGs > 0 && a.etaGs <= 1)) {
    throw new Error(`Le facteur de réduction η_gs doit être dans ]0 ; 1] (sans unité) ; valeur saisie : ${a.etaGs}.`);
  }
  if (!(a.Rc > 0 && a.Rc <= 1)) {
    throw new Error(`Le taux de couverture Rc doit être dans ]0 ; 1] (sans unité) ; valeur saisie : ${a.Rc}.`);
  }
  if (!(Number.isFinite(a.gammaRd) && a.gammaRd >= 1)) {
    throw new Error(`Le facteur de modèle γRd,gs doit être supérieur ou égal à 1 (sans unité) ; valeur saisie : ${a.gammaRd}.`);
  }
  strictementPositif(a.kpo, "Le facteur d'arrachement kpo", 'sans unité');
}

/** Refus de saisie de l'ensemble des donnees ; leve au premier defaut, message en francais. */
function verifierSaisie(d: DonneesMur): void {
  const g = d.geometrie;
  strictementPositif(g.H, 'La hauteur H', 'm');
  strictementPositif(g.L, 'La longueur L des armatures', 'm');
  strictementPositif(g.Sv, "L'espacement vertical Sv", 'm');
  strictementPositif(g.premierLit, 'La hauteur du premier lit', 'm');
  if (g.premierLit >= g.H) {
    throw new Error(`La hauteur du premier lit (${g.premierLit} m) doit être inférieure à H (${g.H} m).`);
  }
  if (!(Number.isFinite(g.D) && g.D >= 0 && g.D < g.H)) {
    throw new Error(`L'encastrement D doit être positif ou nul et inférieur à H (${g.H} m) : valeur saisie ${g.D} m.`);
  }

  for (const [nom, s] of [
    ['du remblai renforcé', d.remblaiRenforce],
    ['du remblai retenu', d.remblaiRetenu],
  ] as const) {
    strictementPositif(s.gamma, `Le poids volumique γ ${nom}`, 'kN/m3');
    angleSaisi(s.phiDeg, nom);
  }

  const f = d.fondation;
  strictementPositif(f.gamma, 'Le poids volumique γ de la fondation', 'kN/m3');
  if (f.drainage === 'draine') {
    if (f.phiDeg === undefined) throw new Error("La fondation drainée exige l'angle de frottement φ' de la fondation.");
    angleSaisi(f.phiDeg, 'de la fondation');
    positifOuNul(f.c ?? 0, "La cohésion c' de la fondation", 'kPa');
  } else {
    strictementPositif(f.cu ?? Number.NaN, 'La cohésion non drainée c_u de la fondation', 'kPa');
  }

  positifOuNul(d.qG, 'La surcharge permanente qG', 'kPa');
  positifOuNul(d.qQ, 'La surcharge variable qQ', 'kPa');

  if (d.armature.type === 'acier') verifierAcier(d.armature);
  else verifierGeosynthetique(d.armature);

  if (d.generation === '1re') {
    const c = d.coefficientsInternes1g;
    if (c === null) {
      throw new Error("Les coefficients internes de 1re génération (γRt, γRpo) doivent être saisis : aucune valeur par défaut dans la norme.");
    }
    strictementPositif(c.gRt, 'Le coefficient interne γRt', 'sans unité');
    strictementPositif(c.gRpo, 'Le coefficient interne γRpo', 'sans unité');
  }
}

/**
 * Positions des lits : h_k = premierLit + k·Sv tant que h_k < H (PLAN.md, lits).
 * Hauteur d'influence : de la base (lit du bas) ou du milieu avec le lit inferieur,
 * jusqu'au milieu avec le lit superieur ou jusqu'a la crete (lit du haut). Les hauteurs
 * d'influence de tous les lits font H ; la demi-somme evite de compter deux fois un lit.
 */
export function positionsLits(g: Geometrie): Lit[] {
  strictementPositif(g.H, 'La hauteur H', 'm');
  strictementPositif(g.Sv, "L'espacement vertical Sv", 'm');
  strictementPositif(g.premierLit, 'La hauteur du premier lit', 'm');
  const hs: number[] = [];
  for (let k = 0; ; k++) {
    const h = g.premierLit + k * g.Sv;
    if (h >= g.H - 1e-9) break;
    hs.push(h);
  }
  return hs.map((h, k) => {
    const bas = k === 0 ? 0 : (hs[k - 1] + h) / 2;
    const haut = k === hs.length - 1 ? g.H : (h + hs[k + 1]) / 2;
    return { h, z: g.H - h, Sv: haut - bas };
  });
}

/**
 * Facteur de perte kcc (EN 1997-3:2025, tableau 9.3) : valeurs pour e <= 6 mm, 1,0 pour
 * e >= 12 mm, interpolation lineaire entre les deux.
 */
export function facteurKcc(a: ArmatureAcier): number {
  verifierAcier(a);
  const uniforme = a.repartition === 'uniforme';
  const k6 = a.galvanise ? (uniforme ? 1.7 : 2.0) : uniforme ? 2.5 : 3.0;
  const e = a.epaisseur;
  if (e <= 6) return k6;
  if (e >= 12) return 1.0;
  return k6 + ((1.0 - k6) * (e - 6)) / 6;
}

/**
 * Perte d'epaisseur par face Δe, en mm (EN 1997-3:2025, 9.3.4 et tableau 9.2) :
 * Δe = kcc·max(A·T^n − ez ; 0) en µm. A, n et ez viennent du tableau 9.2 ; T est la
 * duree d'utilisation de projet en ans.
 */
export function perteEpaisseur(a: ArmatureAcier): number {
  verifierAcier(a);
  const terrestre = a.milieu === 'terrestre';
  const A = terrestre ? 25 : 40;
  let n: number;
  if (a.galvanise) n = terrestre ? 0.65 : 0.6;
  else n = terrestre ? 0.8 : 0.75;
  const ez = a.galvanise ? 70 : 0;
  const microns = facteurKcc(a) * Math.max(A * Math.pow(a.dureeVie, n) - ez, 0);
  return microns / 1000;
}

/**
 * Section reduite d'un feuillard (EN 1997-3:2025, 9.3.4) : Ar = (b − 2Δe)(e − 2Δe), en mm2,
 * avec la perte sur tout le pourtour ; A0 = b·e. Le rapport Ar/A0 sert au refus à 50 %.
 */
export function sectionReduite(a: ArmatureAcier): { A0: number; Ar: number; rapport: number } {
  verifierAcier(a);
  const de = perteEpaisseur(a);
  const A0 = a.largeur * a.epaisseur;
  const Ar = (a.largeur - 2 * de) * (a.epaisseur - 2 * de);
  return { A0, Ar, rapport: Ar / A0 };
}

/**
 * Longueur active, depuis le parement (m) : acier, 0,6·h si h <= H/2, sinon 0,3·H (gravite
 * coherente, FHWA) ; geosynthetique, h·tan(45° − φr/2) (coin de Rankine). phiDeg est la
 * valeur caracteristique de φr.
 */
export function longueurActive(a: Armature, H: number, h: number, phiDeg: number): number {
  strictementPositif(H, 'La hauteur H', 'm');
  strictementPositif(h, 'La hauteur du lit h', 'm');
  if (a.type === 'acier') {
    verifierAcier(a);
    return h <= H / 2 ? 0.6 * h : 0.3 * H;
  }
  angleSaisi(phiDeg, 'du remblai renforcé');
  return h * Math.tan((45 - phiDeg / 2) * RAD);
}

/**
 * Valeurs par defaut de la gravite coherente (feuillards d'acier), FHWA-NHI-10-024 :
 * K/Ka en tete 1,7 ; K/Ka a z0 et au-dela 1,2 ; z0 = 6 m ; μpo,0 = min(2 ; 1,2 + log10 Cu) ;
 * μpo,z0 = tan φr. Chaque valeur porte sa source.
 */
export function defautsGraviteCoherente(
  phiRemblaiDeg: number,
  Cu = 4,
): {
  KsurKa0: ValeurNommee;
  KsurKaZ0: ValeurNommee;
  z0: ValeurNommee;
  muPo0: ValeurNommee;
  muPoZ0: ValeurNommee;
} {
  angleSaisi(phiRemblaiDeg, 'du remblai renforcé');
  strictementPositif(Cu, 'Le coefficient d uniformité Cu', 'sans unité');
  const src = 'FHWA-NHI-10-024, valeur par défaut de la gravité cohérente';
  return {
    KsurKa0: { nom: 'K/Ka en tête', valeur: 1.7, source: `${src}` },
    KsurKaZ0: { nom: 'K/Ka à z0 et au-delà', valeur: 1.2, source: `${src}` },
    z0: { nom: 'z0', valeur: 6, source: `${src}` },
    muPo0: {
      nom: 'μpo,0',
      valeur: Math.min(2, 1.2 + Math.log10(Cu)),
      source: `${src} : μpo,0 = min(2 ; 1,2 + log10 Cu), Cu = ${fr(Cu, 1)}`,
    },
    muPoZ0: { nom: 'μpo,z0', valeur: Math.tan(phiRemblaiDeg * RAD), source: `${src} : μpo,z0 = tan φr` },
  };
}

/** Jeu d'une combinaison interne, coefficients resolus. */
interface JeuInterne {
  nom: string;
  /** Actions de calcul sur le poids et la surcharge du massif (gamma_G,dst, gamma_Q,dst). */
  gGdst: number;
  gQdst: number;
  /** Action stabilisatrice gamma_G,stb, pour sigma_v,res. */
  gGstb: number;
  /** gamma_phi de Ka et de l'arrachement, et gamma_phi,po. */
  gPhi: number;
  gPhiPo: number;
  /** gamma de la rupture et gamma_R,po de l'arrachement. */
  gRt: number;
  gRpo: number;
  coefficients: ValeurNommee[];
}

const SRC_SAISI = "saisi par l'utilisateur (aucune valeur dans la norme)";
const GAMMA_M0 = 1.0;
const SRC_M0 = 'EN 1993-1-1, valeur recommandée, renvoyée par EN 1997-3:2025, tableau 9.4';
const GAMMA_M_GS = 1.25;
const SRC_M_GS = 'EN 1997-3:2025, tableau 9.4, valeur recommandée (γM,gs)';
const GAMMA_R_PO_RES = 1.25;
const SRC_R_PO_RES = 'EN 1997-3:2025, tableau 9.4, valeur recommandée, sans k_R';
const SRC_R_PO_MAT = 'EN 1997-3:2025, tableau 9.4, approche par les matériaux, sans coefficient';

/**
 * Jeux des combinaisons internes : 1re generation, celles de combinaisons1g (gamma_Rt et
 * gamma_R,po saisis) ; 2e generation, VC3 + M2 (approche par les materiaux) ou VC1 (approche
 * par les resistances, gamma_R,po = 1,25 sans k_R, clause 9.6 et tableau 9.4).
 */
function jeuxInternes(d: DonneesMur): JeuInterne[] {
  const a = d.armature;
  if (d.generation === '1re') {
    const c = d.coefficientsInternes1g;
    if (c === null) {
      throw new Error("Les coefficients internes de 1re génération (γRt, γRpo) doivent être saisis : aucune valeur par défaut dans la norme.");
    }
    const p = d.profilNormatif === 'anb2022' ? profilAnb2022(d.risque) : profil1g();
    return combinaisons1g(d.approche, p).map((cb) => ({
      nom: cb.nom,
      gGdst: cb.geotechnique.gG_dst.valeur,
      gQdst: cb.geotechnique.gQ_dst.valeur,
      gGstb: cb.geotechnique.gG_stb.valeur,
      gPhi: cb.sol.gPhi.valeur,
      gPhiPo: cb.sol.gPhi.valeur,
      gRt: c.gRt,
      gRpo: c.gRpo,
      coefficients: [
        { nom: 'γφ', valeur: cb.sol.gPhi.valeur, source: cb.sol.gPhi.source },
        { nom: 'γRt', valeur: c.gRt, source: SRC_SAISI },
        { nom: 'γR,po', valeur: c.gRpo, source: SRC_SAISI },
      ],
    }));
  }

  const p2 = profil2g();
  const rupture = a.type === 'acier'
    ? { valeur: GAMMA_M0, source: SRC_M0 }
    : { valeur: a.type === 'geosynthetique' ? a.gammaRd * GAMMA_M_GS : 1, source: `${SRC_M_GS} × γRd,gs saisi` };

  if (d.facteurInterne === 'materiaux') {
    const cb = combinaisonsStabilite2g(d.cc, p2)[0];
    return [{
      nom: cb.nom,
      gGdst: cb.actions.gG_dst.valeur,
      gQdst: cb.actions.gQ_dst.valeur,
      gGstb: cb.actions.gG_stb.valeur,
      gPhi: cb.sol.gPhi.valeur,
      gPhiPo: cb.sol.gPhi.valeur,
      gRt: rupture.valeur,
      gRpo: 1,
      coefficients: [
        { nom: 'γφ', valeur: cb.sol.gPhi.valeur, source: cb.sol.gPhi.source },
        { nom: 'γRt', valeur: rupture.valeur, source: rupture.source },
        { nom: 'γR,po', valeur: 1, source: SRC_R_PO_MAT },
      ],
    }];
  }

  const cb = combinaisons2g('a+b', d.cc, p2)[0];
  return [{
    nom: 'VC1',
    gGdst: cb.geotechnique.gG_dst.valeur,
    gQdst: cb.geotechnique.gQ_dst.valeur,
    gGstb: cb.geotechnique.gG_stb.valeur,
    gPhi: cb.sol.gPhi.valeur,
    gPhiPo: cb.sol.gPhi.valeur,
    gRt: rupture.valeur,
    gRpo: GAMMA_R_PO_RES,
    coefficients: [
      { nom: 'γφ', valeur: cb.sol.gPhi.valeur, source: cb.sol.gPhi.source },
      { nom: 'γRt', valeur: rupture.valeur, source: rupture.source },
      { nom: 'γR,po', valeur: GAMMA_R_PO_RES, source: SRC_R_PO_RES },
    ],
  }];
}

/**
 * Calcul d'un lit (EN 1997-3:2025, 9.5 et 9.6) : K, sigma_v, T, longueurs, Rt, Rpo et taux.
 * Le taux du lit est le plus defavorable de la rupture et de l'arrachement ; sans ancrage
 * (Le = 0), Rpo = 0 et le taux d'arrachement est infini.
 */
function calculerInterne(d: DonneesMur, j: JeuInterne): ResultatInterne {
  const g = d.geometrie;
  const a = d.armature;
  const phiR = d.remblaiRenforce.phiDeg;
  const gamma = d.remblaiRenforce.gamma;
  // Angle de calcul phi_d = atan(tan phi_r / gamma_phi) et Ka = tan²(45° − phi_d/2).
  const phiD = Math.atan(Math.tan(phiR * RAD) / j.gPhi);
  const Ka = Math.tan(Math.PI / 4 - phiD / 2) ** 2;
  const section = a.type === 'acier' ? sectionReduite(a) : null;

  const lits = positionsLits(g).map((lit): ResultatLit => {
    const z = lit.z;
    const sigmaV = j.gGdst * (gamma * z + d.qG) + j.gQdst * d.qQ;
    let K = Ka;
    if (a.type === 'acier') {
      const kz = a.KsurKa0 + ((a.KsurKaZ0 - a.KsurKa0) * Math.min(z, a.z0)) / a.z0;
      K = Ka * kz;
    }
    const T = K * sigmaV * lit.Sv;
    const La = longueurActive(a, g.H, lit.h, phiR);
    const Le = Math.max(0, g.L - La);
    const sigmaRes = j.gGstb * (gamma * z + d.qG);

    let Rt: number;
    let Rpo: number;
    if (a.type === 'acier' && section !== null) {
      Rt = (a.nbParMetre * section.Ar * a.fy) / 1000 / j.gRt;
      const mu = a.muPo0 + ((a.muPoZ0 - a.muPo0) * Math.min(z, a.z0)) / a.z0;
      Rpo = (a.nbParMetre * 2 * (a.largeur / 1000) * Le * (mu / j.gPhiPo) * sigmaRes) / j.gRpo;
    } else if (a.type === 'geosynthetique') {
      Rt = (a.etaGs * a.Tk) / j.gRt;
      Rpo = (2 * a.Rc * Le * a.kpo * (Math.tan(phiR * RAD) / j.gPhiPo) * sigmaRes) / j.gRpo;
    } else {
      throw new Error('Type d armature inconnu.');
    }

    const tauxRupture = T / Rt;
    const tauxArrachement = Rpo > 0 ? T / Rpo : Number.POSITIVE_INFINITY;
    return {
      ...lit,
      K,
      sigmaV,
      T,
      La,
      Le,
      Rt,
      Rpo,
      tauxRupture,
      tauxArrachement,
      taux: Math.max(tauxRupture, tauxArrachement),
    };
  });

  const tauxMax = Math.max(...lits.map((l) => l.taux));
  return {
    nom: j.nom,
    Ka,
    phi_d: phiD / RAD,
    lits,
    tauxMax,
    conforme: tauxMax <= 1,
    coefficients: j.coefficients,
  };
}

/** Nom du profil de coefficients retenu (1re generation : recommande ou ANB 2022 ; 2e : profil2g). */
function nomProfil(d: DonneesMur): string {
  if (d.generation === '2e') return profil2g().nom;
  return d.profilNormatif === 'anb2022' ? profilAnb2022(d.risque).nom : profil1g().nom;
}

export function verifierMur(d: DonneesMur): ResultatMur {
  verifierSaisie(d);
  let section: ResultatMur['section'] = null;
  if (d.armature.type === 'acier') {
    const a = d.armature;
    // Limites de 9.3.4, dans cet ordre : la limite d'elasticite avant la section reduite.
    if (!a.galvanise && a.fy > 500) {
      throw new Error(`La limite d'élasticité fy = ${fr(a.fy, 0)} MPa dépasse 500 MPa pour un acier non galvanisé : refus (EN 1997-3:2025, 9.3.4).`);
    }
    if (a.galvanise && a.fy > 600) {
      throw new Error(`La limite d'élasticité fy = ${fr(a.fy, 0)} MPa dépasse 600 MPa pour un acier galvanisé : refus (EN 1997-3:2025, 9.3.4).`);
    }
    const s = sectionReduite(a);
    if (s.rapport < 0.5) {
      throw new Error(`La section réduite Ar = ${fr(s.Ar, 1)} mm² est inférieure à 50 % de A0 = ${fr(s.A0, 1)} mm² après corrosion : refus (EN 1997-3:2025, 9.3.4).`);
    }
    section = { deltaE: perteEpaisseur(a), A0: s.A0, Ar: s.Ar, rapport: s.rapport };
  }

  const lits = positionsLits(d.geometrie);
  const interne = jeuxInternes(d).map((j) => calculerInterne(d, j));

  const alertes = new Set<string>();
  for (const i of interne) {
    for (const l of i.lits) {
      if (l.Le === 0) {
        alertes.add(`Longueur d'ancrage nulle au lit h = ${fr(l.h)} m : arrachement nul, taux infini.`);
      }
    }
  }
  if (d.geometrie.L < 0.7 * d.geometrie.H) {
    alertes.add('L < 0,7·H : en dessous de la longueur minimale usuelle (FHWA)');
  }

  // Gouvernant : a ce stade, seule la stabilite interne est calculee (T4 et T5 ajoutent le reste).
  const candidats = interne.map((i) => ({ verification: 'interne', combinaison: i.nom, taux: i.tauxMax }));
  const gouvernant = candidats.reduce((m, c) => (c.taux > m.taux ? c : m));

  return {
    profil: nomProfil(d),
    lits,
    section,
    interne,
    externe: [],
    renversement: { nom: 'non calculé', Mdst: Number.NaN, Mstb: Number.NaN, taux: Number.NaN, conforme: false },
    excentricite: null,
    stabilite: [],
    gouvernant,
    alertes: [...alertes],
  };
}

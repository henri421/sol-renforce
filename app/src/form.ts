/**
 * La saisie, en chaines, et sa conversion en donnees du noyau. PUR.
 *
 * Une seule saisie pour les deux generations et les deux armatures : basculer ne change
 * aucune valeur saisie. Les champs propres a un choix restent saisis quand l'autre est
 * actif ; seuls ceux du choix retenu sont lus.
 */

import { lireNombre, nombreAffiche } from 'aedificium-ui';
import type { Approche, Approche2e, ClasseConsequences, Risque } from 'sol-ec7';
import { defautsGraviteCoherente, verifierMur, type DonneesMur, type ResultatMur } from '../../src/mur';
import { textes } from './textes';

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

/** Format du fichier enregistre. */
const FORMAT = 'sol-renforce/1';

export function saisieParDefaut(): Saisie {
  return {
    generation: '2e',
    profilNormatif: 'recommande',
    risque: 'normal',
    approche1: 'DA1',
    gRt: '',
    gRpo: '',
    consequences: 'CC2',
    approche2e: 'a+b',
    facteurInterne: 'materiaux',
    H: '6',
    L: '5',
    D: '0,5',
    premierLit: '0,375',
    Sv: '0,75',
    gammaR: '19',
    phiR: '36',
    gammaB: '18',
    phiB: '30',
    drainageF: 'draine',
    gammaF: '19',
    phiF: '32',
    cF: '0',
    cuF: '',
    qG: '5',
    qQ: '10',
    armature: 'acier',
    nbParMetre: '4',
    largeur: '50',
    epaisseur: '4',
    fy: '355',
    galvanise: true,
    milieu: 'terrestre',
    dureeVie: '100',
    repartition: 'uniforme',
    // Valeurs FHWA pour φ'r = 36 degres (voir defautsFhwa).
    KsurKa0: '1,7',
    KsurKaZ0: '1,2',
    z0: '6',
    muPo0: '1,802',
    muPoZ0: '0,727',
    Tk: '80',
    etaGs: '0,45',
    gammaRd: '1',
    Rc: '1',
    kpo: '0,6',
    modeCercle: 'recherche',
    xc: '1',
    yc: '8',
    R: '7,5',
  };
}

class Refus extends Error {}

/** Lit le nombre d'un champ, ou refuse en nommant le champ. */
function nb(brut: string, champ: string): number {
  const v = lireNombre(brut);
  if (v === null) throw new Refus(textes().refus.nombre(champ, brut));
  return v;
}

/** Angle de frottement : strictement entre 0 et 90 degres. */
function angle(brut: string, champ: string): number {
  const v = nb(brut, champ);
  if (!(v > 0 && v < 90)) throw new Refus(textes().refus.phi(champ, brut));
  return v;
}

/** c_u : strictement positif. */
function cuPositif(brut: string, champ: string): number {
  const v = nb(brut, champ);
  if (!(v > 0)) throw new Refus(textes().refus.cu(champ, brut));
  return v;
}

/** Diviseur de 1re generation : a saisir, la norme n'en donne aucun. */
function diviseur(brut: string, champ: string): number {
  if (brut.trim() === '') throw new Refus(textes().refus.diviseurVide(champ));
  return nb(brut, champ);
}

/** Convertit la saisie ; refuse en nommant le premier champ illisible. */
export function lireSaisie(s: Saisie): Lecture {
  try {
    const c = textes().refus.champs;

    const geometrie = {
      H: nb(s.H, c.H),
      L: nb(s.L, c.L),
      D: nb(s.D, c.D),
      premierLit: nb(s.premierLit, c.premierLit),
      Sv: nb(s.Sv, c.Sv),
    };
    const remblaiRenforce = { gamma: nb(s.gammaR, c.gammaR), phiDeg: angle(s.phiR, c.phiR) };
    const remblaiRetenu = { gamma: nb(s.gammaB, c.gammaB), phiDeg: angle(s.phiB, c.phiB) };

    const gammaF = nb(s.gammaF, c.gammaF);
    const fondation: DonneesMur['fondation'] =
      s.drainageF === 'draine'
        ? { gamma: gammaF, drainage: 'draine', phiDeg: angle(s.phiF, c.phiF), c: nb(s.cF, c.cF) }
        : { gamma: gammaF, drainage: 'non_draine', cu: cuPositif(s.cuF, c.cuF) };

    const qG = nb(s.qG, c.qG);
    const qQ = nb(s.qQ, c.qQ);

    const armature: DonneesMur['armature'] =
      s.armature === 'acier'
        ? {
            type: 'acier',
            nbParMetre: nb(s.nbParMetre, c.nbParMetre),
            largeur: nb(s.largeur, c.largeur),
            epaisseur: nb(s.epaisseur, c.epaisseur),
            fy: nb(s.fy, c.fy),
            galvanise: s.galvanise,
            milieu: s.milieu,
            dureeVie: nb(s.dureeVie, c.dureeVie),
            repartition: s.repartition,
            KsurKa0: nb(s.KsurKa0, c.KsurKa0),
            KsurKaZ0: nb(s.KsurKaZ0, c.KsurKaZ0),
            z0: nb(s.z0, c.z0),
            muPo0: nb(s.muPo0, c.muPo0),
            muPoZ0: nb(s.muPoZ0, c.muPoZ0),
          }
        : {
            type: 'geosynthetique',
            Tk: nb(s.Tk, c.Tk),
            etaGs: nb(s.etaGs, c.etaGs),
            gammaRd: nb(s.gammaRd, c.gammaRd),
            Rc: nb(s.Rc, c.Rc),
            kpo: nb(s.kpo, c.kpo),
          };

    // 1re generation seulement : les diviseurs sont lus et refuses s'ils sont vides.
    const coefficientsInternes1g: DonneesMur['coefficientsInternes1g'] =
      s.generation === '1re' ? { gRt: diviseur(s.gRt, c.gRt), gRpo: diviseur(s.gRpo, c.gRpo) } : null;

    // ANB 2022 : l'approche est DA1, quelle que soit la liste.
    const approche: Approche = s.profilNormatif === 'anb2022' ? 'DA1' : s.approche1;

    const cercle: DonneesMur['cercle'] =
      s.modeCercle === 'impose' ? { xc: nb(s.xc, c.xc), yc: nb(s.yc, c.yc), R: nb(s.R, c.R) } : null;

    const donnees: DonneesMur = {
      generation: s.generation,
      profilNormatif: s.profilNormatif,
      risque: s.risque,
      approche,
      coefficientsInternes1g,
      cc: s.consequences,
      approche2e: s.approche2e,
      facteurInterne: s.facteurInterne,
      geometrie,
      remblaiRenforce,
      remblaiRetenu,
      fondation,
      qG,
      qQ,
      armature,
      cercle,
    };
    return { ok: true, calcul: { donnees } };
  } catch (e) {
    if (e instanceof Refus) return { ok: false, message: e.message };
    throw e;
  }
}

/**
 * Verification du mur (noyau), la generation en plus. Leve si le noyau refuse la saisie ;
 * le message est celui du noyau.
 */
export function verifier(calcul: Calcul): Resultat {
  return { ...verifierMur(calcul.donnees), generation: calcul.donnees.generation };
}

/**
 * Valeurs par defaut de la gravite coherente pour φ'r saisi (noyau, Cu = 4), ecrites a la
 * francaise ; null si φ'r est illisible ou hors de ]0 ; 90[.
 */
export function defautsFhwa(phiR: string): DefautsFhwa | null {
  const phi = lireNombre(phiR);
  if (phi === null || !(phi > 0 && phi < 90)) return null;
  const d = defautsGraviteCoherente(phi);
  return {
    KsurKa0: nombreAffiche(d.KsurKa0.valeur),
    KsurKaZ0: nombreAffiche(d.KsurKaZ0.valeur),
    z0: nombreAffiche(d.z0.valeur),
    muPo0: nombreAffiche(d.muPo0.valeur),
    muPoZ0: nombreAffiche(d.muPoZ0.valeur),
  };
}

export function serialiser(s: Saisie): string {
  return JSON.stringify({ format: FORMAT, ...s }, null, 2);
}

function texteOu(valeur: unknown, defaut: string): string {
  return typeof valeur === 'string' ? valeur : defaut;
}

function boolOu(valeur: unknown, defaut: boolean): boolean {
  return typeof valeur === 'boolean' ? valeur : defaut;
}

function choixOu<T extends string>(valeur: unknown, autorisees: readonly T[], defaut: T): T {
  return typeof valeur === 'string' && (autorisees as readonly string[]).includes(valeur) ? (valeur as T) : defaut;
}

/** Relit un document enregistre ; les champs absents ou aux choix inconnus prennent la valeur par defaut. */
export function relire(contenu: string): Saisie {
  const brut = JSON.parse(contenu) as Record<string, unknown>;
  if (brut.format !== FORMAT) {
    throw new Error(textes().refus.format(String(brut.format), FORMAT));
  }
  const d = saisieParDefaut();
  return {
    generation: choixOu(brut.generation, ['1re', '2e'] as const, d.generation),
    profilNormatif: choixOu(brut.profilNormatif, ['recommande', 'anb2022'] as const, d.profilNormatif),
    risque: choixOu(brut.risque, ['faible', 'normal', 'eleve'] as const, d.risque),
    approche1: choixOu(brut.approche1, ['DA1', 'DA2', 'DA3'] as const, d.approche1),
    gRt: texteOu(brut.gRt, d.gRt),
    gRpo: texteOu(brut.gRpo, d.gRpo),
    consequences: choixOu(brut.consequences, ['CC1', 'CC2', 'CC3'] as const, d.consequences),
    approche2e: choixOu(brut.approche2e, ['a+b', 'c', 'd'] as const, d.approche2e),
    facteurInterne: choixOu(brut.facteurInterne, ['materiaux', 'resistances'] as const, d.facteurInterne),
    H: texteOu(brut.H, d.H),
    L: texteOu(brut.L, d.L),
    D: texteOu(brut.D, d.D),
    premierLit: texteOu(brut.premierLit, d.premierLit),
    Sv: texteOu(brut.Sv, d.Sv),
    gammaR: texteOu(brut.gammaR, d.gammaR),
    phiR: texteOu(brut.phiR, d.phiR),
    gammaB: texteOu(brut.gammaB, d.gammaB),
    phiB: texteOu(brut.phiB, d.phiB),
    drainageF: choixOu(brut.drainageF, ['draine', 'non_draine'] as const, d.drainageF),
    gammaF: texteOu(brut.gammaF, d.gammaF),
    phiF: texteOu(brut.phiF, d.phiF),
    cF: texteOu(brut.cF, d.cF),
    cuF: texteOu(brut.cuF, d.cuF),
    qG: texteOu(brut.qG, d.qG),
    qQ: texteOu(brut.qQ, d.qQ),
    armature: choixOu(brut.armature, ['acier', 'geosynthetique'] as const, d.armature),
    nbParMetre: texteOu(brut.nbParMetre, d.nbParMetre),
    largeur: texteOu(brut.largeur, d.largeur),
    epaisseur: texteOu(brut.epaisseur, d.epaisseur),
    fy: texteOu(brut.fy, d.fy),
    galvanise: boolOu(brut.galvanise, d.galvanise),
    milieu: choixOu(brut.milieu, ['terrestre', 'eau_douce'] as const, d.milieu),
    dureeVie: texteOu(brut.dureeVie, d.dureeVie),
    repartition: choixOu(brut.repartition, ['uniforme', 'non_uniforme'] as const, d.repartition),
    KsurKa0: texteOu(brut.KsurKa0, d.KsurKa0),
    KsurKaZ0: texteOu(brut.KsurKaZ0, d.KsurKaZ0),
    z0: texteOu(brut.z0, d.z0),
    muPo0: texteOu(brut.muPo0, d.muPo0),
    muPoZ0: texteOu(brut.muPoZ0, d.muPoZ0),
    Tk: texteOu(brut.Tk, d.Tk),
    etaGs: texteOu(brut.etaGs, d.etaGs),
    gammaRd: texteOu(brut.gammaRd, d.gammaRd),
    Rc: texteOu(brut.Rc, d.Rc),
    kpo: texteOu(brut.kpo, d.kpo),
    modeCercle: choixOu(brut.modeCercle, ['recherche', 'impose'] as const, d.modeCercle),
    xc: texteOu(brut.xc, d.xc),
    yc: texteOu(brut.yc, d.yc),
    R: texteOu(brut.R, d.R),
  };
}

/**
 * Presentation du resultat : verdicts, volets, tableau des lits, blocs du CSV et de la note. PUR.
 * Tout vient du resultat du noyau ; aucun calcul ici (ni tan, sin, cos, sqrt, log).
 */

import { type BlocResultat, echapper, type LigneResultat, nombreAffiche, notationHtml, tauxAffiche } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { phrase, ponctuer, textes } from './textes';

type Interne = Resultat['interne'][number];
type Lit = Interne['lits'][number];

/** Lignes d'entree rangees par section de la note ; `blocEntrees` les met bout a bout dans cet ordre. */
export interface EntreesParSection {
  geometrie: LigneResultat[];
  materiaux: LigneResultat[];
  charges: LigneResultat[];
  hypotheses: LigneResultat[];
}

/** Symboles des entrees : notation commune aux deux langues. */
const SY = {
  H: 'H',
  L: 'L',
  D: 'D',
  premierLit: 'h_1',
  Sv: 'S_v',
  cercle: 'cercle',
  gammaR: 'γ_R',
  phiR: 'φ′_R',
  gammaB: 'γ_B',
  phiB: 'φ′_B',
  gammaF: 'γ_F',
  phiF: 'φ′_F',
  cF: 'c′_F',
  cuF: 'c_u',
  qG: 'q_G',
  qQ: 'q_Q',
  fy: 'f_y',
  Tk: 'T_k',
  etaGs: 'η_gs',
  gammaRd: 'γ_Rd,gs',
  Rc: 'R_c',
  kpo: 'k_po',
  approche: 'approche',
  profil: 'profil',
  risque: 'risque',
  gammaRt: 'γ_Rt',
  gammaRpo: 'γ_R,po',
  classe: 'CC',
  cas: 'cas',
  interne: 'interne',
  Ka: 'K_a',
  Fd: 'F_d',
  taux: 'taux',
  xc: 'x_c',
  yc: 'y_c',
  R: 'R',
  Rt: 'R_t',
  Rpo: 'R_po',
  T: 'T',
  h: 'h',
  Mdst: 'M_dst',
  Mstb: 'M_stb',
  eG: 'e_G',
  eGQ: 'e_G+Q',
} as const;

/** Libelle « nom : detail », avec l'espacement de la langue. */
const lib = (nom: string, detail: string): string => ponctuer(`${nom} : ${detail}`);

/** Valeur d'un dictionnaire de textes ; une cle inconnue s'affiche telle quelle. */
const cle = (dico: Record<string, string>, k: string): string => dico[k] ?? k;

/** Nombre affiche ; une valeur non finie ne sort jamais en clair. */
const aff = (v: number, d: number): string => (Number.isFinite(v) ? nombreAffiche(v, d) : textes().vue.nonCalculable);
/** Taux affiche : tauxAffiche rend « hors domaine » pour un taux infini ou NaN. */
const taux = (v: number): string => tauxAffiche(v);
/** Texte du noyau ou de la saisie, traduit au besoin, notation et echappement pour le HTML. */
const texte = (s: string): string => notationHtml(phrase(s));

/** Largeur de jauge, bornee a 100 ; 100 pour un taux infini, 0 pour NaN. */
function largeur(v: number): string {
  if (Number.isNaN(v)) return '0';
  if (!Number.isFinite(v)) return v > 0 ? '100' : '0';
  return String(Math.min(100, Math.max(0, Math.round(v * 1000) / 10)));
}

/** Premier element dont la valeur est maximale (le premier en cas d'egalite), ou undefined si la liste est vide. */
function pire<T>(liste: readonly T[], valeur: (x: T) => number): T | undefined {
  let m: T | undefined;
  for (const x of liste) if (m === undefined || valeur(x) > valeur(m)) m = x;
  return m;
}

/** Verification ou combinaison determinante : son nom dans la note, sans le mot « gouvernant ». */
function gouvernant(r: Resultat, verification: string, combinaison?: string): boolean {
  return r.gouvernant.verification === verification && (combinaison === undefined || r.gouvernant.combinaison === combinaison);
}

function nomVerification(k: string): string {
  return cle(textes().verifications as Record<string, string>, k);
}

const ligne = (symbole: string, libelle: string, valeur: string): LigneResultat => ({ symbole, libelle, valeur });

// ---------------------------------------------------------------------------------------------
// Entrees
// ---------------------------------------------------------------------------------------------

export function entreesParSection(calcul: Calcul): EntreesParSection {
  const d = calcul.donnees;
  const e = textes().entrees;
  const g = d.geometrie;
  const m = (v: number): string => `${aff(v, 3)} m`;

  const geometrie: LigneResultat[] = [
    ligne(SY.H, e.hauteur, m(g.H)),
    ligne(SY.L, e.longueur, m(g.L)),
    ligne(SY.D, e.encastrement, m(g.D)),
    ligne(SY.premierLit, e.premierLit, m(g.premierLit)),
    ligne(SY.Sv, e.espacement, m(g.Sv)),
  ];
  if (d.cercle !== null) {
    geometrie.push(ligne(SY.cercle, e.cercleImpose, textes().vue.cercle(aff(d.cercle.xc, 2), aff(d.cercle.yc, 2), aff(d.cercle.R, 2))));
  }

  const sol = (nom: string, s: 'R' | 'B', rem: { gamma: number; phiDeg: number }): LigneResultat[] => [
    ligne(s === 'R' ? SY.gammaR : SY.gammaB, lib(nom, e.poidsVolumique), `${aff(rem.gamma, 2)} kN/m³`),
    ligne(s === 'R' ? SY.phiR : SY.phiB, lib(nom, e.frottement), `${aff(rem.phiDeg, 1)} °`),
  ];

  const f = d.fondation;
  const fondation: LigneResultat[] = [ligne(SY.gammaF, lib(e.fondation, e.poidsVolumique), `${aff(f.gamma, 2)} kN/m³`)];
  if (f.drainage === 'draine') {
    fondation.push(ligne(SY.phiF, lib(e.fondation, e.frottement), `${aff(f.phiDeg ?? Number.NaN, 1)} °`));
    fondation.push(ligne(SY.cF, lib(e.fondation, e.cohesion), `${aff(f.c ?? Number.NaN, 2)} kPa`));
  } else {
    fondation.push(ligne(SY.cuF, lib(e.fondation, e.cohesionNonDrainee), `${aff(f.cu ?? Number.NaN, 2)} kPa`));
  }

  const a = d.armature;
  const armature: LigneResultat[] =
    a.type === 'acier'
      ? [
          ligne('n', e.feuillards, aff(a.nbParMetre, 3)),
          ligne('b', e.largeur, `${aff(a.largeur, 3)} mm`),
          ligne('e', e.epaisseur, `${aff(a.epaisseur, 3)} mm`),
          ligne(SY.fy, e.limiteElasticite, `${aff(a.fy, 3)} MPa`),
          ligne('protection', e.protection, a.galvanise ? e.galvanise : e.nonGalvanise),
          ligne('milieu', e.milieu, cle(e.milieux, a.milieu)),
          ligne('t_d', e.dureeVie, `${aff(a.dureeVie, 3)} ${e.uniteDureeVie}`),
          ligne('d_R', e.repartition, cle(e.repartitions, a.repartition)),
          ligne('K/K_a,0', e.KsurKa0, aff(a.KsurKa0, 3)),
          ligne('K/K_a,z0', e.KsurKaZ0, aff(a.KsurKaZ0, 3)),
          ligne('z_0', e.z0, `${aff(a.z0, 3)} m`),
          ligne('μ_po,0', e.muPo0, aff(a.muPo0, 3)),
          ligne('μ_po,z0', e.muPoZ0, aff(a.muPoZ0, 3)),
        ]
      : [
          ligne(SY.Tk, e.resistanceTraction, `${aff(a.Tk, 3)} kN/m`),
          ligne(SY.etaGs, e.etaGs, aff(a.etaGs, 3)),
          ligne(SY.gammaRd, e.gammaRd, aff(a.gammaRd, 3)),
          ligne(SY.Rc, e.rc, aff(a.Rc, 3)),
          ligne(SY.kpo, e.kpo, aff(a.kpo, 3)),
        ];

  const charges: LigneResultat[] = [
    ligne(SY.qG, e.surchargePermanente, `${aff(d.qG, 3)} kPa`),
    ligne(SY.qQ, e.surchargeVariable, `${aff(d.qQ, 3)} kPa`),
  ];

  const hypotheses: LigneResultat[] = [];
  if (d.generation === '1re') {
    const anb = d.profilNormatif === 'anb2022';
    hypotheses.push(ligne(SY.approche, e.approche, anb ? `${d.approche}, ${e.approcheImposee}` : d.approche));
    hypotheses.push(ligne(SY.profil, e.profil, cle(e.profils, d.profilNormatif)));
    if (anb) hypotheses.push(ligne(SY.risque, e.risque, cle(e.risques, d.risque)));
    if (d.coefficientsInternes1g !== null) {
      hypotheses.push(ligne(SY.gammaRt, e.diviseurRupture, aff(d.coefficientsInternes1g.gRt, 3)));
      hypotheses.push(ligne(SY.gammaRpo, e.diviseurArrachement, aff(d.coefficientsInternes1g.gRpo, 3)));
    }
  } else {
    hypotheses.push(ligne(SY.classe, e.classe, d.cc));
    hypotheses.push(ligne(SY.cas, e.cas, cle(e.casNomme, d.approche2e)));
    hypotheses.push(ligne(SY.interne, e.facteurInterne, cle(e.facteursInternes, d.facteurInterne)));
  }

  return {
    geometrie,
    materiaux: [...sol(e.remblaiRenforce, 'R', d.remblaiRenforce), ...sol(e.remblaiRetenu, 'B', d.remblaiRetenu), ...fondation, ...armature],
    charges,
    hypotheses,
  };
}

/** Les quatre sections bout a bout, dans l'ordre geometrie, materiaux, charges, hypotheses. */
export function blocEntrees(calcul: Calcul): BlocResultat {
  const p = entreesParSection(calcul);
  return { titre: textes().note.titreEntrees, lignes: [...p.geometrie, ...p.materiaux, ...p.charges, ...p.hypotheses], note: null };
}

// ---------------------------------------------------------------------------------------------
// Resultats (blocs du CSV et de la note)
// ---------------------------------------------------------------------------------------------

function lignesCercle(c: { xc: number; yc: number; R: number }): LigneResultat[] {
  const t = textes().resultats;
  return [
    ligne(SY.xc, t.abscisse, `${aff(c.xc, 2)} m`),
    ligne(SY.yc, t.ordonnee, `${aff(c.yc, 2)} m`),
    ligne(SY.R, t.rayon, `${aff(c.R, 2)} m`),
  ];
}

/** Synthese, puis un bloc par verification et par combinaison. */
export function blocsResultat(r: Resultat): BlocResultat[] {
  const t = textes();
  const v = t.verifications;
  const res = t.resultats;
  const g = r.gouvernant;

  const synthese: BlocResultat = {
    titre: res.synthese,
    lignes: [
      ligne(SY.profil, res.profil, phrase(r.profil)),
      ligne(SY.taux, res.tauxGouvernant, taux(g.taux)),
      ligne('gouvernant', res.verificationGouvernante, `${nomVerification(g.verification)}, ${phrase(g.combinaison)}`),
    ],
    note: null,
  };

  const stabilite: BlocResultat[] = r.stabilite.map((s) => ({
    titre: `${v.stabilite}, ${phrase(s.nom)}`,
    lignes: [ligne(SY.Fd, res.facteur, aff(s.F, 3)), ligne(SY.taux, res.taux, taux(s.taux)), ...lignesCercle(s.cercle)],
    note: null,
  }));

  const interne: BlocResultat[] = r.interne.map((i) => {
    const lit = pire(i.lits, (l) => l.taux);
    const lignes: LigneResultat[] = [ligne(SY.taux, res.taux, taux(i.tauxMax)), ligne(SY.Ka, res.Ka, aff(i.Ka, 3))];
    if (lit !== undefined) {
      lignes.push(
        ligne(SY.h, res.litPlusCharge, `${aff(lit.h, 3)} m`),
        ligne(SY.T, res.tension, `${aff(lit.T, 2)} kN/m`),
        ligne(SY.Rt, res.resistanceRupture, `${aff(lit.Rt, 1)} kN/m`),
        ligne(SY.Rpo, res.resistanceArrachement, `${aff(lit.Rpo, 1)} kN/m`),
      );
    }
    return { titre: `${v.interne}, ${phrase(i.nom)}`, lignes, note: null };
  });

  const externe: BlocResultat[] = r.externe.map((e) => ({
    titre: `${res.externe}, ${phrase(e.nom)}`,
    lignes: [ligne(SY.taux, v.glissement, taux(e.glissement.taux)), ligne(SY.taux, v.portance, taux(e.portance.taux))],
    note: null,
  }));

  const basculement: BlocResultat = {
    titre: `${v.renversement}, ${phrase(r.renversement.nom)}`,
    lignes: [
      ligne(SY.Mdst, res.momentMoteur, `${aff(r.renversement.Mdst, 0)} kN·m/m`),
      ligne(SY.Mstb, res.momentStabilisant, `${aff(r.renversement.Mstb, 0)} kN·m/m`),
      ligne(SY.taux, res.taux, taux(r.renversement.taux)),
    ],
    note: null,
  };

  const excentricite: BlocResultat[] =
    r.excentricite === null
      ? []
      : [
          {
            titre: v.excentricite,
            lignes: [
              ligne(SY.eG, res.excentriciteG, `${aff(r.excentricite.eG, 2)} m`),
              ligne(SY.eGQ, res.excentriciteGQ, `${aff(r.excentricite.eGQ, 2)} m`),
              ligne(SY.taux, res.taux, taux(r.excentricite.taux)),
            ],
            note: null,
          },
        ];

  return [synthese, ...stabilite, ...interne, ...externe, basculement, ...excentricite];
}

// ---------------------------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------------------------

interface Carte {
  /** Valeur de data-verification : le nom de la combinaison, ou celui de la verification. */
  attribut: string;
  /** Titre deja rendu en HTML. */
  titreHtml: string;
  clause: string;
  taux: number;
  /** Detail en texte brut : la notation (_) est rendue ici. */
  detail: string;
  gouverne: boolean;
}

function carte(c: Carte): string {
  const gouv = c.gouverne ? ` <span class="gouvernant">${textes().vue.gouvernant}</span>` : '';
  const depasse = c.taux > 1 ? ' depasse' : '';
  return (
    `<div class="verdict${depasse}" data-verification="${echapper(c.attribut)}">` +
    `<h3>${c.titreHtml}${gouv} <span class="clause">${echapper(c.clause)}</span></h3>` +
    `<div class="jauge"><i style="width:${largeur(c.taux)}%"></i></div>` +
    `<span class="taux">${taux(c.taux)}</span>` +
    `<p>${notationHtml(ponctuer(c.detail))}</p></div>`
  );
}

function detailLit(l: Lit): string {
  const vue = textes().vue;
  const resistance =
    l.tauxRupture >= l.tauxArrachement
      ? `R_t = ${aff(l.Rt, 1)} kN/m (${vue.rupture})`
      : `R_po = ${aff(l.Rpo, 1)} kN/m (${vue.arrachement})`;
  return `${vue.litPlusCharge(aff(l.h, 3), aff(l.T, 2))} ; ${resistance}`;
}

/** Verdicts : trois groupes (stabilite, interne, externe), la carte gouvernante marquee une seule fois. */
export function verdictsHtml(r: Resultat): string {
  const t = textes();
  const v = t.verifications;
  const cl = t.clauses[r.generation];
  const vue = t.vue;

  const stabilite = r.stabilite.map((s) =>
    carte({
      attribut: s.nom,
      titreHtml: `${texte(v.stabilite)}, ${texte(s.nom)}`,
      clause: cl.stabilite,
      taux: s.taux,
      detail: `${SY.Fd} = ${aff(s.F, 3)} ; ${vue.cercle(aff(s.cercle.xc, 2), aff(s.cercle.yc, 2), aff(s.cercle.R, 2))}`,
      gouverne: gouvernant(r, 'stabilite', s.nom),
    }),
  );

  const interne = r.interne.map((i) => {
    const lit = pire(i.lits, (l) => l.taux);
    return carte({
      attribut: i.nom,
      titreHtml: `${texte(v.interne)}, ${texte(i.nom)}`,
      clause: cl.interne,
      taux: i.tauxMax,
      detail: lit === undefined ? '' : detailLit(lit),
      gouverne: gouvernant(r, 'interne', i.nom),
    });
  });

  const externe: string[] = [];
  const portance = pire(r.externe, (e) => e.portance.taux);
  if (portance !== undefined) {
    externe.push(
      carte({
        attribut: 'portance',
        titreHtml: texte(v.portance),
        clause: cl.portance,
        taux: portance.portance.taux,
        detail: `${vue.combinaison} ${phrase(portance.nom)} ; q_Ed = ${aff(portance.portance.detail.qEd, 1)} kPa, q_Rd = ${aff(portance.portance.detail.qRd, 1)} kPa ; B′ = ${aff(portance.portance.detail.Bp, 2)} m, e = ${aff(portance.portance.detail.e, 2)} m`,
        gouverne: gouvernant(r, 'portance', portance.nom),
      }),
    );
  }
  const glissement = pire(r.externe, (e) => e.glissement.taux);
  if (glissement !== undefined) {
    externe.push(
      carte({
        attribut: 'glissement',
        titreHtml: texte(v.glissement),
        clause: cl.glissement,
        taux: glissement.glissement.taux,
        detail: `${vue.combinaison} ${phrase(glissement.nom)} ; H_d = ${aff(glissement.glissement.detail.Hd, 1)} kN/m, R_d = ${aff(glissement.glissement.detail.Rd, 1)} kN/m`,
        gouverne: gouvernant(r, 'glissement', glissement.nom),
      }),
    );
  }
  if (r.excentricite !== null) {
    externe.push(
      carte({
        attribut: 'excentricite',
        titreHtml: texte(v.excentricite),
        clause: cl.excentricite,
        taux: r.excentricite.taux,
        detail: vue.excentricite(aff(r.excentricite.eG, 2), aff(r.excentricite.eGQ, 2)),
        gouverne: gouvernant(r, 'excentricite'),
      }),
    );
  }
  externe.push(
    carte({
      attribut: 'renversement',
      titreHtml: `${texte(v.renversement)}, ${texte(r.renversement.nom)}`,
      clause: cl.renversement,
      taux: r.renversement.taux,
      detail: vue.moments(aff(r.renversement.Mdst, 0), aff(r.renversement.Mstb, 0)),
      gouverne: gouvernant(r, 'renversement', r.renversement.nom),
    }),
  );

  // Les indices grecs (« m_α ») ne se notent qu'en lettres : _α s'ecrit _alpha pour notationHtml.
  const alertes = r.alertes.map((a) => `<p class="alerte">${notationHtml(phrase(a).replace(/_α/g, '_alpha'))}</p>`).join('');
  const section = (groupe: string, titre: string, contenu: string): string =>
    `<section class="groupe-verdicts" data-groupe="${groupe}"><h2>${titre}</h2>${contenu}</section>`;

  return (
    section(
      'stabilite',
      vue.groupes.stabilite,
      `<p class="note">${texte(r.profil)}</p>${stabilite.join('')}<p class="note">${vue.noteTaux}</p>${alertes}`,
    ) +
    section('interne', vue.groupes.interne, interne.join('')) +
    section('externe', vue.groupes.externe, externe.join(''))
  );
}

// ---------------------------------------------------------------------------------------------
// Volets et tableau des lits
// ---------------------------------------------------------------------------------------------

/** Volets : coefficients de chaque combinaison interne, avec leur source ; puis les hypotheses. */
export function voletsHtml(r: Resultat): string {
  const t = textes();
  const vo = t.vue.volets;
  const coefficients = r.interne.map((i) => {
    const lignes = i.coefficients
      .map((c) => `<tr><td>${notationHtml(c.nom)}</td><td class="n">${aff(c.valeur, 3)}</td><td>${texte(c.source)}</td></tr>`)
      .join('');
    return (
      `<details class="deriv"><summary>${texte(vo.coefficients)}, ${texte(i.nom)}</summary><div class="defile"><table><thead><tr>` +
      `<th>${vo.coefficient}</th><th class="n">${vo.valeur}</th><th>${vo.source}</th>` +
      `</tr></thead><tbody>${lignes}</tbody></table></div></details>`
    );
  });
  const tractions = r.section === null ? t.note.tractions.geosynthetique : t.note.tractions.acier;
  const hypotheses =
    `<details class="deriv"><summary>${vo.hypotheses}</summary><div><ul>` +
    [tractions, ...t.note.hypotheses].map((h) => `<li>${echapper(h)}</li>`).join('') +
    `</ul></div></details>`;
  return coefficients.join('') + hypotheses;
}

/** Tableau des lits d'une combinaison interne (son nom) ; la section apres corrosion pour l'acier. */
export function litsHtml(r: Resultat, combinaison: string): string {
  const i = r.interne.find((x) => x.nom === combinaison);
  if (i === undefined) return '';
  const n = textes().note;
  const lignes = i.lits
    .map(
      (l) =>
        `<tr data-lit><td class="n">${aff(l.h, 3)}</td><td class="n">${aff(l.z, 3)}</td><td class="n">${aff(l.K, 3)}</td>` +
        `<td class="n">${aff(l.sigmaV, 1)}</td><td class="n">${aff(l.T, 2)}</td><td class="n">${aff(l.La, 2)}</td>` +
        `<td class="n">${aff(l.Le, 2)}</td><td class="n">${aff(l.Rt, 1)}</td><td class="n">${aff(l.Rpo, 1)}</td>` +
        `<td class="n">${taux(l.taux)}</td></tr>`,
    )
    .join('');
  const entetes = n.colonnesLits.map((c) => `<th class="n">${notationHtml(c)}</th>`).join('');
  const s = r.section;
  const corrosion =
    s === null
      ? ''
      : `<p class="note">${notationHtml(n.corrosion(nombreAffiche(s.deltaE, 2), nombreAffiche(s.Ar, 1), nombreAffiche(s.rapport * 100, 0)))}</p>`;
  return (
    `<div class="defile"><table><thead><tr>${entetes}</tr></thead><tbody>${lignes}</tbody></table></div>` + corrosion
  );
}

export function messageDErreur(e: unknown): string {
  return phrase(e instanceof Error ? e.message : String(e));
}

/** T2 : verdicts, volets, tableau des lits, blocs du CSV. Tout vient du resultat du noyau. A ne pas modifier. */

import { describe, expect, it } from 'vitest';
import { NOMS_GRECS, blocsEnTexte, constatsAffichage, nombreAffiche, notationHtml, resultatsEnCsv, tauxAffiche, texteVisible } from 'aedificium-ui';
import { saisieParDefaut, type Resultat } from '../../app/src/form';
import { blocEntrees, blocsResultat, entreesParSection, litsHtml, messageDErreur, verdictsHtml, voletsHtml } from '../../app/src/vue';
import { calculer, court, geosynthetique, impose, mou, premiere, SAISIES } from './_commun';

/** Contenu d'un groupe de verdicts : `<section class="groupe-verdicts" data-groupe="...">`. */
function groupe(html: string, nom: string): string {
  const i = html.indexOf(`data-groupe="${nom}"`);
  expect(i).toBeGreaterThan(-1);
  const fin = html.indexOf('</section>', i);
  return html.slice(i, fin < 0 ? undefined : fin);
}

const groupes = (html: string): string[] => [...html.matchAll(/data-groupe="([a-z]+)"/g)].map((m) => m[1]);
const verifications = (html: string): string[] => [...html.matchAll(/data-verification="([^"]+)"/g)].map((m) => m[1]);
const pire = <T>(l: T[], taux: (x: T) => number): T => l.reduce((m, x) => (taux(x) > taux(m) ? x : m));

/** Les cartes attendues de la stabilite externe. */
const externes = (r: Resultat): string[] => ['portance', 'glissement', ...(r.excentricite ? ['excentricite'] : []), 'renversement'];

describe('verdicts', () => {
  const def = calculer(saisieParDefaut()).r;
  const html = verdictsHtml(def);

  it('trois groupes : stabilite generale, interne, externe', () => {
    for (const [, s] of SAISIES) expect(groupes(verdictsHtml(calculer(s).r))).toEqual(['stabilite', 'interne', 'externe']);
  });

  it('une carte par combinaison de stabilite et d interne ; externe : la plus chargee de chaque verification', () => {
    for (const [, s] of SAISIES) {
      const r = calculer(s).r;
      const h = verdictsHtml(r);
      expect(verifications(groupe(h, 'stabilite'))).toEqual(r.stabilite.map((x) => x.nom));
      expect(verifications(groupe(h, 'interne'))).toEqual(r.interne.map((x) => x.nom));
      expect(verifications(groupe(h, 'externe'))).toEqual(externes(r));
    }
  });

  it('stabilite : F_d, taux, centre et rayon du cercle', () => {
    const t = texteVisible(groupe(html, 'stabilite'));
    for (const c of def.stabilite) {
      expect(t).toContain(c.nom);
      expect(t).toContain(nombreAffiche(c.F, 3));
      expect(t).toContain(tauxAffiche(c.taux));
      expect(t).toContain(nombreAffiche(c.cercle.R, 2));
    }
  });

  it('interne : taux et lit le plus charge', () => {
    for (const [, s] of SAISIES) {
      const r = calculer(s).r;
      const t = texteVisible(groupe(verdictsHtml(r), 'interne'));
      for (const i of r.interne) {
        expect(t).toContain(tauxAffiche(i.tauxMax));
        expect(t).toContain(nombreAffiche(pire(i.lits, (l) => l.taux).h, 3));
      }
    }
  });

  it('externe : taux et nom de la combinaison la plus chargee', () => {
    for (const [, s] of SAISIES) {
      const r = calculer(s).r;
      const t = texteVisible(groupe(verdictsHtml(r), 'externe'));
      const p = pire(r.externe, (e) => e.portance.taux);
      const g = pire(r.externe, (e) => e.glissement.taux);
      expect(t).toContain(tauxAffiche(p.portance.taux));
      expect(t).toContain(p.nom);
      expect(t).toContain(tauxAffiche(g.glissement.taux));
      expect(t).toContain(tauxAffiche(r.renversement.taux));
      expect(t).toContain(r.renversement.nom);
      if (r.excentricite) expect(t).toContain(tauxAffiche(r.excentricite.taux));
    }
  });

  it('la carte gouvernante le dit, une seule fois', () => {
    for (const [, s] of SAISIES) {
      const t = texteVisible(verdictsHtml(calculer(s).r)).toLowerCase();
      expect(t.split('gouvern').length - 1).toBe(1);
    }
    expect(texteVisible(groupe(html, 'stabilite')).toLowerCase()).toContain('gouvern');
  });

  it('aucun verdict global', () => {
    const t = texteVisible(html);
    expect(t).not.toMatch(/\bConforme\b/);
    expect(t).not.toMatch(/Non conforme/);
  });

  it('profil normatif et clauses de la generation', () => {
    const t2 = texteVisible(html);
    expect(t2).toContain('valeurs recommandées');
    expect(t2).toContain('§4.6.3');
    expect(t2).toContain('tableau 9.4');
    expect(t2).not.toContain('§11.5');
    const t1 = texteVisible(verdictsHtml(calculer(premiere()).r));
    expect(t1).toContain('§11.5.1');
    expect(t1).not.toContain('tableau 9.4');
    expect(texteVisible(groupe(verdictsHtml(calculer(premiere()).r), 'interne'))).toContain('saisi');
    expect(texteVisible(verdictsHtml(calculer(premiere({ profilNormatif: 'anb2022' })).r))).toContain('ANB:2022');
  });

  it('un taux depasse est marque, dans son groupe seulement', () => {
    const h = verdictsHtml(calculer(mou()).r);
    expect(groupe(h, 'externe')).toContain('depasse');
    expect(groupe(h, 'interne')).not.toContain('depasse');
    expect(html).not.toContain('depasse');
  });

  it('alertes du noyau dites en clair', () => {
    expect(texteVisible(verdictsHtml(calculer(court()).r))).toContain('0,7·H');
    expect(texteVisible(verdictsHtml(calculer(mou()).r))).toContain('borné à 0,2');
  });

  it('jauges bornees : jamais de NaN, d Infinity ni de largeur au-dela de 100 %', () => {
    for (const [, s] of SAISIES) {
      const h = verdictsHtml(calculer(s).r);
      for (const x of ['NaN', 'Infinity', 'null', 'undefined']) expect(h).not.toContain(x);
      for (const m of h.matchAll(/width:\s*([\d.]+)%/g)) expect(Number(m[1])).toBeLessThan(100.01);
    }
  });
});

describe('lits', () => {
  it('une ligne par lit de la combinaison demandee', () => {
    for (const [, s] of SAISIES) {
      const r = calculer(s).r;
      for (const i of r.interne) {
        const h = litsHtml(r, i.nom);
        expect((h.match(/data-lit/g) ?? []).length).toBe(i.lits.length);
        for (const x of ['NaN', 'Infinity', 'undefined']) expect(h).not.toContain(x);
      }
    }
  });

  it('T, R_t, R_po, L_a, L_e et taux de chaque lit', () => {
    const r = calculer(premiere()).r;
    const i = r.interne[1];
    const t = texteVisible(litsHtml(r, i.nom));
    for (const l of i.lits) {
      expect(t).toContain(nombreAffiche(l.h, 3));
      expect(t).toContain(nombreAffiche(l.T, 2));
      expect(t).toContain(nombreAffiche(l.Rt, 1));
      expect(t).toContain(nombreAffiche(l.Rpo, 1));
      expect(t).toContain(nombreAffiche(l.La, 2));
      expect(t).toContain(nombreAffiche(l.Le, 2));
      expect(t).toContain(tauxAffiche(l.taux));
    }
  });

  it('acier : section apres corrosion ; geosynthetique : rien', () => {
    const r = calculer(saisieParDefaut()).r;
    const t = texteVisible(litsHtml(r, r.interne[0].nom));
    expect(t).toContain(nombreAffiche(r.section?.deltaE ?? NaN, 2));
    expect(t).toContain(nombreAffiche(r.section?.Ar ?? NaN, 1));
    const g = calculer(geosynthetique()).r;
    expect(texteVisible(litsHtml(g, g.interne[0].nom))).not.toContain('corrosion');
  });
});

describe('volets', () => {
  for (const [nom, s] of SAISIES) {
    it(`${nom} : coefficients de chaque combinaison interne, avec leur source, sans NaN`, () => {
      const r = calculer(s).r;
      const h = voletsHtml(r);
      expect(h).not.toContain('NaN');
      expect(h).not.toContain('Infinity');
      expect((h.match(/<details/g) ?? []).length).toBeGreaterThan(1);
      const t = texteVisible(h);
      for (const i of r.interne) {
        expect(t).toContain(i.nom);
        for (const c of i.coefficients) expect(t).toContain(nombreAffiche(c.valeur, 3));
      }
    });
  }

  it('sources selon la generation', () => {
    expect(texteVisible(voletsHtml(calculer(saisieParDefaut()).r))).toContain('tableau 9.4');
    expect(texteVisible(voletsHtml(calculer(premiere()).r))).toContain('saisi');
  });

  it('hypotheses : Rankine, Meyerhof, Bishop a 200 tranches, ligne des tractions de l armature', () => {
    const t = texteVisible(voletsHtml(calculer(saisieParDefaut()).r));
    for (const x of ['Rankine', 'Meyerhof', 'Bishop', '200', 'bilinéaire']) expect(t).toContain(x);
    expect(texteVisible(voletsHtml(calculer(geosynthetique()).r))).toContain('coin de Rankine');
  });
});

describe('blocs : donnees et resultats', () => {
  it('entrees : symboles uniques, bout a bout dans l ordre des sections', () => {
    for (const [, s] of SAISIES) {
      const { calcul } = calculer(s);
      const symboles = blocEntrees(calcul).lignes.map((l) => l.symbole);
      expect(new Set(symboles).size).toBe(symboles.length);
      const p = entreesParSection(calcul);
      expect(blocEntrees(calcul).lignes).toEqual([...p.geometrie, ...p.materiaux, ...p.charges, ...p.hypotheses]);
    }
  });

  it('entrees : chaque section a ses lignes', () => {
    const p = entreesParSection(calculer(saisieParDefaut()).calcul);
    const sym = (l: { symbole: string }[]) => l.map((x) => x.symbole);
    for (const x of ['H', 'L', 'D', 'S_v']) expect(sym(p.geometrie)).toContain(x);
    for (const x of ['q_G', 'q_Q']) expect(sym(p.charges)).toContain(x);
    expect(sym(p.materiaux)).toContain('f_y');
    expect(sym(p.materiaux)).not.toContain('T_k');
    expect(sym(entreesParSection(calculer(geosynthetique()).calcul).materiaux)).toContain('T_k');
    expect(sym(entreesParSection(calculer(geosynthetique()).calcul).materiaux)).not.toContain('f_y');
    expect(sym(entreesParSection(calculer(impose()).calcul).geometrie)).toContain('cercle');
    expect(sym(p.geometrie)).not.toContain('cercle');
  });

  it('entrees : la fondation suit son comportement', () => {
    const d = JSON.stringify(entreesParSection(calculer(saisieParDefaut()).calcul).materiaux);
    expect(d).not.toContain('c_u');
    const n = JSON.stringify(entreesParSection(calculer({ ...saisieParDefaut(), drainageF: 'non_draine', cuF: '60' }).calcul).materiaux);
    expect(n).toContain('c_u');
  });

  it('entrees : choix propres a la generation seulement', () => {
    const h2 = JSON.stringify(entreesParSection(calculer(saisieParDefaut()).calcul).hypotheses);
    expect(h2).toContain('CC2');
    expect(h2).not.toContain('DA1');
    expect(h2).not.toContain('γ_Rt');
    const h1 = JSON.stringify(entreesParSection(calculer(premiere()).calcul).hypotheses);
    expect(h1).toContain('DA1');
    expect(h1).toContain('γ_Rt');
    expect(h1).not.toContain('CC2');
  });

  it('resultats : synthese, puis un bloc par verification et combinaison', () => {
    for (const [, s] of SAISIES) {
      const r = calculer(s).r;
      const b = blocsResultat(r);
      const t = JSON.stringify(b);
      expect(t).toContain(tauxAffiche(r.gouvernant.taux));
      for (const c of r.stabilite) expect(t).toContain(nombreAffiche(c.F, 3));
      for (const i of r.interne) expect(t).toContain(tauxAffiche(i.tauxMax));
      for (const e of r.externe) {
        expect(t).toContain(tauxAffiche(e.glissement.taux));
        expect(t).toContain(tauxAffiche(e.portance.taux));
      }
      expect(t).toContain(tauxAffiche(r.renversement.taux));
      const n = 1 + r.stabilite.length + r.interne.length + r.externe.length + 1 + (r.excentricite ? 1 : 0);
      expect(b).toHaveLength(n);
    }
  });

  for (const [nom, s] of SAISIES) {
    it(`CSV ${nom} : texte brut`, () => {
      const { calcul, r } = calculer(s);
      const c = resultatsEnCsv(blocsEnTexte([blocEntrees(calcul), ...blocsResultat(r)]));
      expect(c).not.toContain('_');
      expect(c).not.toMatch(NOMS_GRECS);
      expect(c).not.toContain('<');
      expect(c).not.toContain('NaN');
      expect(c).not.toContain('Infinity');
    });
  }
});

describe('texte visible : notations, arrondis, accents', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const { calcul, r } = calculer(s);
      const html = [verdictsHtml(r), voletsHtml(r), ...r.interne.map((i) => litsHtml(r, i.nom))].join('');
      expect(constatsAffichage(texteVisible(html))).toEqual([]);
      expect(constatsAffichage(texteVisible(notationHtml(blocEntrees(calcul).titre)))).toEqual([]);
    });
  }

  it('message d erreur : celui du noyau', () => {
    expect(messageDErreur(new Error('L’encastrement D doit être positif.'))).toContain('encastrement');
    expect(messageDErreur('texte')).toBe('texte');
  });
});

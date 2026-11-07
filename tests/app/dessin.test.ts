/**
 * T3 : la coupe, lue dans le SVG lui-meme. A ne pas modifier.
 *
 * Repere du noyau : pied du parement en (0 ; 0), x vers l'arriere du massif, base du massif a y = 0.
 * Classes imposees :
 *  - `polyline.ligne-terrain` : le terrain, quatre sommets, dans cet ordre : (x_g ; D), (0 ; D),
 *    (0 ; H), (x_d ; H), avec x_g < 0 et x_d > L ;
 *  - `line.parement` : le parement, de (0 ; 0) a (0 ; H) ;
 *  - `line.lit` : un par lit, de (0 ; h) a (L ; h) ;
 *  - `polyline.tractions` : la ligne des tractions maximales (option « tractions »), un sommet
 *    (longueurActive(armature, H, h, φ_r) ; h) pour h = 0 (longueur nulle), H/2, H et chaque lit, h croissant ;
 *  - `path.cercle` : l'arc de glissement, commande `A r r ...` ; `circle.centre` : son centre ;
 *  - `line.force` : une par armature coupee qui porte un effort (T > 0), a la hauteur du lit ;
 *  - `.cote` : ce que retire l'option « cotes ».
 */

import { describe, expect, it } from 'vitest';
import { constatsAffichage, nombreAffiche, texteVisible } from 'aedificium-ui';
import { saisieParDefaut, type Calcul, type Resultat } from '../../app/src/form';
import { coupe, vueGouvernante, vuesDisponibles } from '../../app/src/dessin';
import { longueurActive } from '../../src/mur';
import { calculer, court, geosynthetique, impose, mou, premiere, SAISIES } from './_commun';

const TOUT = { cotes: true, tractions: true };
const balises = (svg: string, element: string, classe: string): string[] =>
  [...svg.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'g'))].map((m) => m[0]).filter((b) => new RegExp(`class="[^"]*\\b${classe}\\b`).test(b));
const une = (svg: string, element: string, classe: string): string => {
  const l = balises(svg, element, classe);
  expect(l, `${element}.${classe}`).toHaveLength(1);
  return l[0];
};
const attribut = (balise: string, nom: string): string => new RegExp(`\\s${nom}="([^"]*)"`).exec(balise)?.[1] ?? '';
const num = (balise: string, nom: string): number => Number(attribut(balise, nom));
const sommets = (balise: string): { X: number; Y: number }[] =>
  attribut(balise, 'points')
    .trim()
    .split(/\s+/)
    .map((p) => p.split(',').map(Number))
    .map(([X, Y]) => ({ X, Y }));

const stab = (r: Resultat, vue: string) => {
  const s = r.stabilite.find((x) => x.nom === vue);
  if (!s) throw new Error(`vue inconnue : ${vue}`);
  return s;
};

/** Echelle et origine lues sur le terrain et sur un lit. */
function repere(svg: string, calcul: Calcul) {
  const { H, L, D } = calcul.donnees.geometrie;
  const t = sommets(une(svg, 'polyline', 'ligne-terrain'));
  expect(t).toHaveLength(4);
  const lit = balises(svg, 'line', 'lit')[0];
  const ex = (num(lit, 'x2') - num(lit, 'x1')) / L;
  const ey = (t[1].Y - t[2].Y) / (H - D);
  const X = (x: number) => t[1].X + x * ex;
  const Y = (y: number) => t[1].Y - (y - D) * ex;
  return { ex, ey, t, X, Y };
}

describe('vues', () => {
  it('une vue par combinaison de stabilite generale', () => {
    expect(vuesDisponibles(calculer(saisieParDefaut()).r)).toEqual(['VC3 + M2']);
    expect(vuesDisponibles(calculer(premiere()).r)).toEqual(['DA1-1', 'DA1-2']);
  });

  it('la vue gouvernante ouvre le dessin', () => {
    expect(vueGouvernante(calculer(premiere()).r)).toBe('DA1-1');
    expect(vueGouvernante(calculer(premiere({ approche1: 'DA3' })).r)).toBe('DA3');
  });
});

describe('coupe a l echelle', () => {
  for (const [nom, s] of [['defaut', saisieParDefaut()], ['impose', impose()], ['geosynthetique', geosynthetique()], ['1re', premiere()], ['court', court()]] as const) {
    it(`${nom} : meme echelle en x et en y ; terrain, parement, lits, cercle de chaque vue`, () => {
      const { calcul, r } = calculer(s);
      const { H, L, D } = calcul.donnees.geometrie;
      for (const vue of vuesDisponibles(r)) {
        const svg = coupe(calcul, r, vue, TOUT);
        const p = repere(svg, calcul);
        expect(Math.abs(p.ey - p.ex) / p.ex).toBeLessThan(0.01);
        expect(p.t[0].X).toBeLessThan(p.X(0));
        expect(Math.abs(p.t[0].Y - p.Y(D))).toBeLessThan(1);
        expect(Math.abs(p.t[3].Y - p.Y(H))).toBeLessThan(1);
        expect(p.t[3].X).toBeGreaterThan(p.X(L));
        const par = une(svg, 'line', 'parement');
        expect(Math.abs(num(par, 'x1') - p.X(0)) + Math.abs(num(par, 'x2') - p.X(0))).toBeLessThan(1);
        expect(Math.abs(Math.min(num(par, 'y1'), num(par, 'y2')) - p.Y(H))).toBeLessThan(1);
        expect(Math.abs(Math.max(num(par, 'y1'), num(par, 'y2')) - p.Y(0))).toBeLessThan(1);
        const lits = balises(svg, 'line', 'lit');
        expect(lits).toHaveLength(r.lits.length);
        lits.forEach((b, k) => {
          expect(Math.abs(num(b, 'y1') - p.Y(r.lits[k].h))).toBeLessThan(1);
          expect(Math.abs(num(b, 'y2') - p.Y(r.lits[k].h))).toBeLessThan(1);
          expect(Math.abs(num(b, 'x1') - p.X(0))).toBeLessThan(1);
          expect(Math.abs(num(b, 'x2') - p.X(L))).toBeLessThan(1);
        });
        const c = stab(r, vue).cercle;
        const centre = une(svg, 'circle', 'centre');
        expect(Math.abs(num(centre, 'cx') - p.X(c.xc))).toBeLessThan(1);
        expect(Math.abs(num(centre, 'cy') - p.Y(c.yc))).toBeLessThan(1);
        const arc = /A\s*([\d.]+)[\s,]+([\d.]+)/.exec(attribut(une(svg, 'path', 'cercle'), 'd'));
        expect(arc).not.toBeNull();
        expect(Math.abs(Number(arc?.[1]) - c.R * p.ex) / (c.R * p.ex)).toBeLessThan(0.01);
        const [vx, vy, vw, vh] = attribut(svg.slice(0, svg.indexOf('>') + 1), 'viewBox').split(/\s+/).map(Number);
        const dedans = (X: number, Y: number) => X >= vx && X <= vx + vw && Y >= vy && Y <= vy + vh;
        expect(dedans(p.X(c.xc), p.Y(c.yc))).toBe(true);
        for (const q of p.t) expect(dedans(q.X, q.Y)).toBe(true);
      }
    });
  }
});

describe('ligne des tractions maximales', () => {
  for (const [nom, s] of [['acier', saisieParDefaut()], ['geosynthetique', geosynthetique()]] as const) {
    it(`${nom} : sommets sur la longueur active du noyau`, () => {
      const { calcul, r } = calculer(s);
      const d = calcul.donnees;
      const svg = coupe(calcul, r, vueGouvernante(r), TOUT);
      const p = repere(svg, calcul);
      const sm = sommets(une(svg, 'polyline', 'tractions'));
      expect(sm.length).toBe(r.lits.length + 3);
      const hs = sm.map((q) => (p.t[1].Y - q.Y) / p.ex + d.geometrie.D);
      for (let k = 1; k < hs.length; k++) expect(hs[k]).toBeGreaterThan(hs[k - 1]);
      for (const h of [0, d.geometrie.H / 2, d.geometrie.H]) expect(hs.some((x) => Math.abs(x - h) < 0.01)).toBe(true);
      sm.forEach((q, k) => {
        // Au pied (h = 0), la longueur active est nulle ; le noyau ne la calcule que pour h > 0.
        const La = hs[k] < 0.01 ? 0 : longueurActive(d.armature, d.geometrie.H, hs[k], d.remblaiRenforce.phiDeg);
        expect(Math.abs(q.X - p.X(La))).toBeLessThan(1);
      });
    });
  }

  it('option tractions : la ligne disparait', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    expect(balises(coupe(calcul, r, 'VC3 + M2', { cotes: true, tractions: false }), 'polyline', 'tractions')).toHaveLength(0);
  });
});

describe('elements du dessin', () => {
  const { calcul, r } = calculer(saisieParDefaut());
  const svg = coupe(calcul, r, 'VC3 + M2', TOUT);

  it('une fleche par armature coupee qui porte un effort', () => {
    for (const [, s] of [['defaut', saisieParDefaut()], ['impose', impose()], ['geosynthetique', geosynthetique()], ['mou', mou()]] as const) {
      const x = calculer(s);
      for (const vue of vuesDisponibles(x.r)) {
        const n = stab(x.r, vue).resultat.renforts.filter((f) => f.T > 0).length;
        expect(balises(coupe(x.calcul, x.r, vue, TOUT), 'line', 'force')).toHaveLength(n);
      }
    }
  });

  it('option cotes', () => {
    expect(svg).toMatch(/class="[^"]*\bcote\b/);
    expect(coupe(calcul, r, 'VC3 + M2', { cotes: false, tractions: true })).not.toMatch(/class="[^"]*\bcote\b/);
  });

  it('titre : la vue et son F', () => {
    for (const [, s] of [['1re', premiere()]] as const) {
      const x = calculer(s);
      for (const vue of vuesDisponibles(x.r)) {
        const t = texteVisible(coupe(x.calcul, x.r, vue, TOUT));
        expect(t).toContain(vue);
        expect(t).toContain(nombreAffiche(stab(x.r, vue).F, 3));
      }
    }
  });

  it('les trois sols sont nommes', () => {
    const t = texteVisible(svg);
    for (const x of ['massif renforcé', 'remblai retenu', 'fondation']) expect(t).toContain(x);
  });
});

describe('toutes les saisies, toutes les vues', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const { calcul, r } = calculer(s);
      for (const vue of vuesDisponibles(r)) {
        const svg = coupe(calcul, r, vue, TOUT);
        for (const x of ['NaN', 'Infinity', 'undefined', 'null']) expect(svg).not.toContain(x);
        expect(constatsAffichage(texteVisible(svg))).toEqual([]);
      }
    });
  }
});

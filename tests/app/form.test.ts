/** T1 : la saisie, sa lecture, son enregistrement. A ne pas modifier. */

import { describe, expect, it } from 'vitest';
import { defautsFhwa, lireSaisie, relire, saisieParDefaut, serialiser, verifier, type Saisie } from '../../app/src/form';
import { verifierMur } from '../../src/mur';
import { geosynthetique, impose, premiere } from './_commun';

function refus(s: Saisie): string {
  const l = lireSaisie(s);
  if (l.ok) throw new Error('un refus etait attendu');
  return l.message;
}

function lue(s: Saisie) {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  return l.calcul;
}

const proche = (x: number, attendu: number, rel = 1e-3) => expect(Math.abs(x - attendu) / Math.abs(attendu)).toBeLessThanOrEqual(rel);

const ACIER = {
  type: 'acier',
  nbParMetre: 4,
  largeur: 50,
  epaisseur: 4,
  fy: 355,
  galvanise: true,
  milieu: 'terrestre',
  dureeVie: 100,
  repartition: 'uniforme',
  KsurKa0: 1.7,
  KsurKaZ0: 1.2,
  z0: 6,
  muPo0: 1.802,
  muPoZ0: 0.727,
};

describe('valeurs par defaut', () => {
  it('mur de 6 m, feuillards de 5 m, 2e generation, approche par les materiaux, (a) + (b)', () => {
    expect(lue(saisieParDefaut()).donnees).toEqual({
      generation: '2e',
      profilNormatif: 'recommande',
      risque: 'normal',
      approche: 'DA1',
      coefficientsInternes1g: null,
      cc: 'CC2',
      approche2e: 'a+b',
      facteurInterne: 'materiaux',
      geometrie: { H: 6, L: 5, D: 0.5, premierLit: 0.375, Sv: 0.75 },
      remblaiRenforce: { gamma: 19, phiDeg: 36 },
      remblaiRetenu: { gamma: 18, phiDeg: 30 },
      fondation: { gamma: 19, drainage: 'draine', phiDeg: 32, c: 0 },
      qG: 5,
      qQ: 10,
      armature: ACIER,
      cercle: null,
    });
  });

  it('1re generation : diviseurs internes vides, cercle impose O (1 ; 8), R 7,5 m', () => {
    const s = saisieParDefaut();
    expect([s.gRt, s.gRpo]).toEqual(['', '']);
    expect([s.xc, s.yc, s.R]).toEqual(['1', '8', '7,5']);
    expect(s.modeCercle).toBe('recherche');
    expect(s.armature).toBe('acier');
  });

  it('geosynthetique par defaut : T_k 80, η_gs 0,45, γ_Rd 1, R_c 1, k_po 0,6', () => {
    expect(lue(geosynthetique()).donnees.armature).toEqual({ type: 'geosynthetique', Tk: 80, etaGs: 0.45, gammaRd: 1, Rc: 1, kpo: 0.6 });
  });

  it('gravite coherente : les valeurs FHWA du noyau, pour φ_r saisi', () => {
    const s = saisieParDefaut();
    expect(defautsFhwa(s.phiR)).toEqual({ KsurKa0: s.KsurKa0, KsurKaZ0: s.KsurKaZ0, z0: s.z0, muPo0: s.muPo0, muPoZ0: s.muPoZ0 });
    expect(defautsFhwa('36')).toEqual({ KsurKa0: '1,7', KsurKaZ0: '1,2', z0: '6', muPo0: '1,802', muPoZ0: '0,727' });
    expect(defautsFhwa('30')?.muPoZ0).toBe('0,577');
    expect(defautsFhwa('abc')).toBeNull();
  });

  it('verifier rend le resultat du noyau et la generation', () => {
    const c = lue(saisieParDefaut());
    const r = verifier(c);
    expect(r.generation).toBe('2e');
    expect(r.gouvernant.verification).toBe('stabilite');
    expect(r.gouvernant.combinaison).toBe('VC3 + M2');
    proche(r.gouvernant.taux, 0.72203);
    proche(r.section?.Ar ?? 0, 123.4);
    expect(r.gouvernant.taux).toBe(verifierMur(c.donnees).gouvernant.taux);
    const r1 = verifier(lue(premiere()));
    expect(r1.generation).toBe('1re');
    expect(r1.stabilite.map((x) => x.nom)).toEqual(['DA1-1', 'DA1-2']);
    proche(r1.gouvernant.taux, 0.84007);
  });

  it('1re generation : les diviseurs saisis sont lus', () => {
    expect(lue(premiere()).donnees.coefficientsInternes1g).toEqual({ gRt: 1.1, gRpo: 1.35 });
  });

  it('cercle impose', () => {
    expect(lue(impose()).donnees.cercle).toEqual({ xc: 1, yc: 8, R: 7.5 });
  });
});

describe('lecture', () => {
  it('virgule ou point decimal', () => {
    expect(lue({ ...saisieParDefaut(), phiR: '34,5' }).donnees.remblaiRenforce.phiDeg).toBe(34.5);
    expect(lue({ ...saisieParDefaut(), Sv: '0.6' }).donnees.geometrie.Sv).toBe(0.6);
  });

  it('un nombre illisible est refuse en nommant le champ', () => {
    const h = refus({ ...saisieParDefaut(), H: 'abc' });
    expect(h).toMatch(/nombre attendu/);
    expect(h.toLowerCase()).toContain('hauteur');
    expect(refus({ ...saisieParDefaut(), fy: 'x' })).toMatch(/f_?y/);
    const p = refus({ ...saisieParDefaut(), phiR: '' });
    expect(p).toMatch(/φ/);
    expect(p).toContain('renforcé');
    expect(refus(geosynthetique({ Tk: '?' }))).toMatch(/T_?k/);
  });

  it('1re generation : diviseurs internes vides refuses, en les nommant', () => {
    expect(refus({ ...saisieParDefaut(), generation: '1re' })).toMatch(/γ_?Rt/);
    expect(refus(premiere({ gRpo: ' ' }))).toMatch(/γ_?R,po/);
  });

  it('φ hors de ]0 ; 90[ et c_u nul ou negatif : refus a la saisie', () => {
    for (const phi of ['0', '-5', '90']) {
      expect(refus({ ...saisieParDefaut(), phiR: phi })).toMatch(/φ/);
      expect(refus({ ...saisieParDefaut(), phiB: phi })).toMatch(/φ/);
      expect(refus({ ...saisieParDefaut(), phiF: phi })).toMatch(/φ/);
    }
    for (const cu of ['0', '-5']) expect(refus({ ...saisieParDefaut(), drainageF: 'non_draine', cuF: cu })).toMatch(/c_u/);
  });

  it('cercle impose illisible : refus qui nomme le cercle', () => {
    expect(refus(impose({ R: 'abc' }))).toMatch(/cercle/i);
  });
});

describe('champs masques', () => {
  it('feuillards : les champs du geosynthetique ne sont pas lus, et inversement', () => {
    expect(lue({ ...saisieParDefaut(), Tk: 'x', etaGs: 'y', gammaRd: '', Rc: 'z', kpo: '?' }).donnees.armature).toEqual(ACIER);
    const g = lue(geosynthetique({ nbParMetre: 'x', largeur: '', epaisseur: 'y', fy: '?', dureeVie: 'z', KsurKa0: '', muPoZ0: 'w' }));
    expect(g.donnees.armature.type).toBe('geosynthetique');
  });

  it('fondation drainee : c_u non lu ; non drainee : φ et c non lus', () => {
    expect(lue({ ...saisieParDefaut(), cuF: 'abc' }).donnees.fondation).toEqual({ gamma: 19, drainage: 'draine', phiDeg: 32, c: 0 });
    expect(lue({ ...saisieParDefaut(), drainageF: 'non_draine', phiF: 'x', cF: 'y', cuF: '60' }).donnees.fondation).toEqual({
      gamma: 19,
      drainage: 'non_draine',
      cu: 60,
    });
  });

  it('2e generation : les diviseurs de 1re ne sont pas lus', () => {
    expect(lue({ ...saisieParDefaut(), gRt: 'abc', gRpo: 'x' }).donnees.coefficientsInternes1g).toBeNull();
  });

  it('recherche : le cercle impose n est pas lu', () => {
    expect(lue({ ...saisieParDefaut(), xc: 'a', yc: 'b', R: 'c' }).donnees.cercle).toBeNull();
  });

  it('ANB 2022 : approche DA1 imposee, quelle que soit la liste', () => {
    expect(lue(premiere({ profilNormatif: 'anb2022', approche1: 'DA3' })).donnees.approche).toBe('DA1');
  });
});

describe('une seule saisie pour les deux generations', () => {
  it('basculer de generation ne change ni la geometrie, ni les sols, ni les armatures', () => {
    const s = premiere({ approche1: 'DA3', consequences: 'CC3' });
    const a = lue({ ...s, generation: '1re' }).donnees;
    const b = lue({ ...s, generation: '2e' }).donnees;
    expect({ ...a, generation: '2e', coefficientsInternes1g: null }).toEqual(b);
    expect(a.approche).toBe('DA3');
    expect(b.cc).toBe('CC3');
  });
});

describe('enregistrement', () => {
  it('enregistrer puis relire rend la meme saisie', () => {
    const s: Saisie = {
      ...premiere(),
      profilNormatif: 'anb2022',
      risque: 'faible',
      approche1: 'DA2',
      consequences: 'CC1',
      approche2e: 'd',
      facteurInterne: 'resistances',
      H: '7,5',
      drainageF: 'non_draine',
      cuF: '45',
      armature: 'geosynthetique',
      galvanise: false,
      milieu: 'eau_douce',
      repartition: 'non_uniforme',
      Tk: '120',
      modeCercle: 'impose',
      R: '9',
    };
    expect(relire(serialiser(s))).toEqual(s);
  });

  it('format sol-renforce/1 ; un autre format est refuse', () => {
    expect(JSON.parse(serialiser(saisieParDefaut())).format).toBe('sol-renforce/1');
    expect(() => relire('{"format":"stabilite-talus/1"}')).toThrow(/format/);
  });

  it('champ absent ou choix inconnu : valeur par defaut', () => {
    const d = saisieParDefaut();
    const r = relire(JSON.stringify({ format: 'sol-renforce/1', armature: 'bambou', generation: '3e', galvanise: 'oui', H: 7 }));
    expect(r).toEqual(d);
  });
});

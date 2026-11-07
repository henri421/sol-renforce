// Tests d'acceptation du noyau sol-renforce (PLAN.md, T2 a T5). Attendus calcules a part,
// sans le code de l'outil (script Python independant ; Bishop a 4000 tranches).
// A ne pas modifier.
import { describe, expect, it } from 'vitest';
import { profil1g, profil2g, profilAnb2022 } from 'sol-ec7';
import {
  defautsGraviteCoherente,
  facteurKcc,
  longueurActive,
  perteEpaisseur,
  positionsLits,
  sectionReduite,
  verifierMur,
  type ArmatureAcier,
  type ArmatureGeosynthetique,
  type DonneesMur,
} from '../src/mur';

const RAD = Math.PI / 180;
const proche = (x: number, attendu: number, rel = 0.0005) =>
  expect(Math.abs(x - attendu) / Math.abs(attendu)).toBeLessThanOrEqual(rel);
// Bishop : 200 tranches (PLAN.md) contre 4000 dans la reference.
const procheBishop = (x: number, attendu: number) => proche(x, attendu, 0.005);

function acier(): ArmatureAcier {
  return {
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
    muPo0: 1.2 + Math.log10(4),
    muPoZ0: Math.tan(36 * RAD),
  };
}

function geosynthetique(): ArmatureGeosynthetique {
  return { type: 'geosynthetique', Tk: 80, etaGs: 0.45, gammaRd: 1, Rc: 1, kpo: 0.6 };
}

// Mur de 6 m, armatures de 4,2 m, 8 lits a 0,375 + 0,75 k ; surcharges 5 et 10 kPa.
function base(): DonneesMur {
  return {
    generation: '1re',
    profilNormatif: 'recommande',
    risque: 'normal',
    approche: 'DA1',
    coefficientsInternes1g: { gRt: 1.1, gRpo: 1.35 },
    cc: 'CC2',
    approche2e: 'a+b',
    facteurInterne: 'materiaux',
    geometrie: { H: 6, L: 4.2, D: 0.5, premierLit: 0.375, Sv: 0.75 },
    remblaiRenforce: { gamma: 19, phiDeg: 36 },
    remblaiRetenu: { gamma: 18, phiDeg: 30 },
    fondation: { gamma: 19, drainage: 'draine', phiDeg: 32, c: 0 },
    qG: 5,
    qQ: 10,
    armature: acier(),
    cercle: { xc: -3, yc: 8, R: 8.6 },
  };
}
const deuxieme = (extra: Partial<DonneesMur> = {}): DonneesMur => ({ ...base(), generation: '2e', ...extra });

describe('T2 : lits, corrosion, longueur active, valeurs par defaut', () => {
  it('positions des lits et hauteurs d influence', () => {
    const lits = positionsLits(base().geometrie);
    expect(lits.map((l) => l.h)).toEqual([0.375, 1.125, 1.875, 2.625, 3.375, 4.125, 4.875, 5.625]);
    lits.forEach((l) => {
      expect(l.z).toBeCloseTo(6 - l.h, 12);
      expect(l.Sv).toBeCloseTo(0.75, 12);
    });
    const autres = positionsLits({ H: 6, L: 4.2, D: 0.5, premierLit: 0.5, Sv: 1 });
    expect(autres.map((l) => l.h)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5, 5.5]);
    expect(autres.reduce((s, l) => s + l.Sv, 0)).toBeCloseTo(6, 12);
  });

  it('perte d epaisseur (9.5), tableaux 9.2 et 9.3', () => {
    expect(facteurKcc(acier())).toBeCloseTo(1.7, 12);
    proche(perteEpaisseur(acier()), 0.728986);
    const nu: ArmatureAcier = { ...acier(), galvanise: false, dureeVie: 75, repartition: 'non_uniforme' };
    expect(facteurKcc(nu)).toBeCloseTo(3.0, 12);
    proche(perteEpaisseur(nu), 2.371976);
    const eau: ArmatureAcier = { ...acier(), milieu: 'eau_douce', epaisseur: 9 };
    expect(facteurKcc(eau)).toBeCloseTo(1.35, 12);
    proche(perteEpaisseur(eau), 0.761342);
    proche(perteEpaisseur({ ...acier(), dureeVie: 5 }), 0.001982);
    expect(perteEpaisseur({ ...acier(), dureeVie: 1 })).toBe(0);
  });

  it('section reduite sur tout le pourtour', () => {
    const s = sectionReduite(acier());
    expect(s.A0).toBeCloseTo(200, 12);
    proche(s.Ar, 123.39514);
    proche(s.rapport, 0.616976);
  });

  it('longueur active : bilineaire pour l acier, Rankine pour le geosynthetique', () => {
    expect(longueurActive(acier(), 6, 1, 36)).toBeCloseTo(0.6, 12);
    expect(longueurActive(acier(), 6, 4, 36)).toBeCloseTo(1.8, 12);
    proche(longueurActive(geosynthetique(), 6, 5.625, 36), 2.866081);
  });

  it('valeurs par defaut de la gravite coherente, sourcees FHWA', () => {
    const d = defautsGraviteCoherente(36);
    expect(d.KsurKa0.valeur).toBe(1.7);
    expect(d.KsurKaZ0.valeur).toBe(1.2);
    expect(d.z0.valeur).toBe(6);
    proche(d.muPo0.valeur, 1.802060);
    proche(d.muPoZ0.valeur, 0.726543);
    expect(defautsGraviteCoherente(36, 10).muPo0.valeur).toBeCloseTo(2.0, 12);
    for (const v of Object.values(d)) expect(v.source).toMatch(/FHWA/);
  });

  it('refus de l acier hors des limites de 9.3.4', () => {
    expect(() => verifierMur({ ...base(), armature: { ...acier(), galvanise: false, fy: 520 } })).toThrow(/500/);
    expect(() => verifierMur({ ...base(), armature: { ...acier(), fy: 620 } })).toThrow(/600/);
    expect(() => verifierMur({ ...base(), armature: { ...acier(), galvanise: false, epaisseur: 2 } })).toThrow(/50 %/);
  });
});

describe('T3 : stabilite interne', () => {
  it('1re generation, DA1 : coefficients saisis, deux combinaisons', () => {
    const r = verifierMur(base());
    expect(r.interne.map((c) => c.nom)).toEqual(['DA1-1', 'DA1-2']);
    const [c1, c2] = r.interne;
    proche(c1.Ka, 0.259616);
    proche(c1.lits[0].T, 39.80422);
    proche(c1.lits[0].Rt, 159.29191);
    proche(c1.lits[0].Rpo, 104.58922);
    proche(c1.lits[3].taux, 0.464931);
    proche(c1.tauxMax, 0.681401);
    proche(c2.Ka, 0.3311);
    proche(c2.lits[7].Rpo, 11.96654);
    proche(c2.tauxMax, 0.870061);
    expect(c2.conforme).toBe(true);
    proche(r.section!.Ar, 123.39514);
  });

  it('1re generation sans coefficients internes saisis : refus', () => {
    expect(() => verifierMur({ ...base(), coefficientsInternes1g: null })).toThrow(/coefficients/);
  });

  it('2e generation, approche par les materiaux (VC3 + M2)', () => {
    const r = verifierMur(deuxieme());
    expect(r.interne.map((c) => c.nom)).toEqual(['VC3 + M2']);
    proche(r.interne[0].lits[0].T, 38.1806);
    proche(r.interne[0].lits[0].Rt, 175.22111);
    proche(r.interne[0].lits[0].Rpo, 112.95635);
    proche(r.interne[0].tauxMax, 0.64449);
    proche(verifierMur(deuxieme({ cc: 'CC3' })).interne[0].tauxMax, 0.777571);
  });

  it('2e generation, approche par les resistances (VC1, gamma_R = 1,25)', () => {
    const r = verifierMur(deuxieme({ facteurInterne: 'resistances' }));
    expect(r.interne.map((c) => c.nom)).toEqual(['VC1']);
    proche(r.interne[0].Ka, 0.259616);
    proche(r.interne[0].lits[3].T, 29.92282);
    proche(r.interne[0].tauxMax, 0.630927);
    proche(verifierMur(deuxieme({ facteurInterne: 'resistances', cc: 'CC3' })).interne[0].tauxMax, 0.69402);
    const sources = r.interne[0].coefficients.map((c) => c.source).join(' ');
    expect(sources).toMatch(/tableau 9\.4/);
  });

  it('geosynthetique : Ka seul, ligne de Rankine, rupture refusee au lit du bas', () => {
    const r = verifierMur(deuxieme({ armature: geosynthetique() }));
    const lits = r.interne[0].lits;
    proche(lits[0].T, 31.00963);
    proche(lits[0].Rt, 28.8);
    proche(lits[0].Rpo, 312.81932);
    proche(lits[7].Le, 1.33392);
    proche(lits[7].Rpo, 11.2809);
    expect(r.interne[0].conforme).toBe(false);
    expect(r.section).toBeNull();
    proche(verifierMur(deuxieme({ armature: geosynthetique(), facteurInterne: 'resistances' })).interne[0].lits[0].T, 32.3283);
  });

  it('longueur d ancrage nulle : arrachement nul, taux infini, alerte', () => {
    const r = verifierMur({ ...base(), geometrie: { ...base().geometrie, L: 1.5 } });
    const haut = r.interne[0].lits[7];
    expect(haut.Le).toBe(0);
    expect(haut.Rpo).toBe(0);
    expect(haut.taux).toBe(Number.POSITIVE_INFINITY);
    expect(r.alertes.join(' ')).toMatch(/ancrage/);
    expect(r.alertes.join(' ')).toMatch(/0,7/);
  });
});

describe('T4 : stabilite externe', () => {
  it('1re generation, DA1 : glissement et portance', () => {
    const r = verifierMur(base());
    expect(r.externe.map((c) => c.nom)).toEqual(['DA1-1', 'DA1-2']);
    const [a, b] = r.externe;
    proche(a.glissement.detail.Hd, 189.3);
    proche(a.glissement.detail.Vd, 499.8);
    proche(a.glissement.detail.Rd, 312.3097);
    proche(a.glissement.taux, 0.606129);
    proche(b.glissement.taux, 0.70741);
    proche(a.portance.detail.e, 0.572161);
    proche(a.portance.detail.Bp, 3.055679);
    proche(a.portance.detail.qEd, 241.42916);
    proche(a.portance.detail.qRd, 452.2185);
    proche(a.portance.taux, 0.533877);
    proche(b.portance.taux, 1.321603);
    expect(b.portance.conforme).toBe(false);
  });

  it('1re generation, DA2 : R2 sur le glissement et la portance', () => {
    const r = verifierMur({ ...base(), approche: 'DA2' });
    proche(r.externe[0].glissement.taux, 0.666742);
    proche(r.externe[0].portance.taux, 0.747428);
  });

  it('1re generation : renversement EQU, pas d excentricite', () => {
    const r = verifierMur(base());
    expect(r.renversement.nom).toBe('EQU');
    proche(r.renversement.Mdst, 442.59848);
    proche(r.renversement.Mstb, 944.622);
    proche(r.renversement.taux, 0.468546);
    expect(r.excentricite).toBeNull();
  });

  it('2e generation, (a) + (b)', () => {
    const r = verifierMur(deuxieme());
    expect(r.externe.map((c) => c.nom)).toEqual(['(a)', '(b)']);
    proche(r.externe[0].glissement.taux, 0.606129);
    proche(r.externe[1].glissement.taux, 0.70741);
    proche(r.externe[0].portance.taux, 0.495213);
    proche(r.externe[1].portance.taux, 1.169897);
  });

  it('2e generation : basculement VC2(a) et VC2(b), excentricite du tableau 5.3', () => {
    const r = verifierMur(deuxieme());
    expect(r.renversement.nom).toBe('VC2(a)');
    proche(r.renversement.taux, 0.349705);
    const e = r.excentricite!;
    proche(e.eG, 0.492197);
    proche(e.tauxG, 0.703138);
    proche(e.eGQ, 0.612245);
    proche(e.tauxGQ, 0.437318);
    proche(e.taux, 0.703138);
    expect(e.conforme).toBe(true);
  });

  it('fondation non drainee (cu = 80 kPa)', () => {
    const r = verifierMur({ ...base(), fondation: { gamma: 19, drainage: 'non_draine', cu: 80 } });
    proche(r.externe[0].glissement.taux, 0.563393);
    proche(r.externe[0].portance.taux, 0.771701);
    proche(r.externe[1].glissement.taux, 0.736437);
    proche(r.externe[1].portance.taux, 1.281811);
  });
});

describe('T5 : stabilite generale et mixte, assemblage', () => {
  it('1re generation, cercle impose : forces des armatures de chaque combinaison', () => {
    const r = verifierMur(base());
    expect(r.stabilite.map((s) => s.nom)).toEqual(['DA1-1', 'DA1-2']);
    procheBishop(r.stabilite[0].F, 1.347847);
    procheBishop(r.stabilite[1].F, 1.538903);
    expect(r.stabilite[0].taux).toBeCloseTo(1 / r.stabilite[0].F, 10);
    expect(r.stabilite[0].resultat.renforts.length).toBe(4);
    expect(verifierMur({ ...base(), approche: 'DA2' }).stabilite.map((s) => s.nom)).toEqual(['DA2']);
  });

  it('2e generation : VC3 + M2 quelle que soit l approche interne', () => {
    procheBishop(verifierMur(deuxieme()).stabilite[0].F, 1.696775);
    procheBishop(verifierMur(deuxieme({ facteurInterne: 'resistances' })).stabilite[0].F, 1.696775);
    procheBishop(verifierMur(deuxieme({ armature: geosynthetique() })).stabilite[0].F, 1.403613);
  });

  it('cercle impose invalide : refus', () => {
    expect(() => verifierMur({ ...base(), cercle: { xc: 100, yc: 100, R: 1 } })).toThrow(/cercle/);
  });

  it('recherche : un cercle par combinaison, pas plus favorable que le cercle de reference', () => {
    const impose = verifierMur(deuxieme());
    const r = verifierMur(deuxieme({ cercle: null }));
    expect(r.stabilite.length).toBe(1);
    expect(r.stabilite[0].F).toBeLessThanOrEqual(impose.stabilite[0].F + 1e-9);
  });

  it('gouvernant : le taux le plus eleve de toutes les verifications', () => {
    const r = verifierMur(base());
    expect(r.gouvernant.verification).toBe('portance');
    expect(r.gouvernant.combinaison).toBe('DA1-2');
    proche(r.gouvernant.taux, 1.321603);
  });

  it('nom du profil de coefficients', () => {
    expect(verifierMur(base()).profil).toBe(profil1g().nom);
    expect(verifierMur(deuxieme()).profil).toBe(profil2g().nom);
    expect(verifierMur({ ...base(), profilNormatif: 'anb2022', risque: 'eleve' }).profil).toBe(profilAnb2022('eleve').nom);
    expect(() => verifierMur({ ...base(), profilNormatif: 'anb2022', approche: 'DA2' })).toThrow(/approche/);
  });

  it('saisies incoherentes refusees', () => {
    const g = base().geometrie;
    expect(() => verifierMur({ ...base(), geometrie: { ...g, D: 6 } })).toThrow();
    expect(() => verifierMur({ ...base(), geometrie: { ...g, Sv: 0 } })).toThrow();
    expect(() => verifierMur({ ...base(), remblaiRenforce: { gamma: 19, phiDeg: 95 } })).toThrow(/φ/);
    expect(() => verifierMur({ ...base(), coefficientsInternes1g: { gRt: 0, gRpo: 1.35 } })).toThrow();
    expect(() => verifierMur(deuxieme({ armature: { ...geosynthetique(), etaGs: 1.2 } }))).toThrow();
  });
});

/** T4 : la note commune d'aedificium-ui, sans verdict global ; le dessin exporte. A ne pas modifier. */

import { describe, expect, it } from 'vitest';
import { constatsAffichage, noteDeCalculHtml, texteVisible, type ElementNote } from 'aedificium-ui';
import { saisieParDefaut, type Saisie } from '../../app/src/form';
import { blocEntrees } from '../../app/src/vue';
import { coupe, vueGouvernante } from '../../app/src/dessin';
import { noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';
import { calculer, court, geosynthetique, impose, lire, mou, premiere, SAISIES } from './_commun';

const CARTOUCHE = { projet: 'Échangeur E4', element: 'Mur M2', date: '2026-11-07' };

function preparer(s: Saisie) {
  const { calcul, r } = calculer(s);
  return { calcul, r, note: noteDuCalcul(calcul, r, CARTOUCHE) };
}

const symboles = (els: ElementNote[] | undefined): string[] => (els ?? []).flatMap((e) => (e.type === 'bloc' ? e.bloc.lignes.map((l) => l.symbole) : []));
const figures = (els: ElementNote[] | undefined) => (els ?? []).filter((e) => e.type === 'figure');
const tableaux = (els: ElementNote[] | undefined) => (els ?? []).flatMap((e) => (e.type === 'tableau' ? [e] : []));

describe('cartouche', () => {
  it('projet, element, date, outil', () => {
    const { cartouche } = preparer(saisieParDefaut()).note;
    expect(cartouche.projet).toBe('Échangeur E4');
    expect(cartouche.element).toBe('Mur M2');
    expect(cartouche.date).toBe('2026-11-07');
    expect(cartouche.outil).toBe('sol-renforce');
  });

  it('normes de la generation, et l annexe nationale quand elle est choisie', () => {
    expect(preparer(saisieParDefaut()).note.cartouche.norme).toBe('EN 1997-1:2024, EN 1997-3:2025, EN 1990:2023');
    expect(preparer(premiere()).note.cartouche.norme).toBe('EN 1997-1:2004');
    expect(preparer(premiere({ profilNormatif: 'anb2022' })).note.cartouche.norme).toBe('EN 1997-1:2004, NBN EN 1997-1 ANB:2022');
  });

  it('element vide : Mur en sol renforce', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    expect(noteDuCalcul(calcul, r, { ...CARTOUCHE, element: ' ' }).cartouche.element).toBe('Mur en sol renforcé');
  });

  it('le texte est echappe', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    const h = noteDeCalculHtml(noteDuCalcul(calcul, r, { ...CARTOUCHE, projet: 'Route <test>' }), STYLES_TRACE);
    expect(h).toContain('Route &lt;test&gt;');
    expect(h).not.toContain('Route <test>');
  });
});

describe('sections', () => {
  for (const [nom, s] of [['2e', saisieParDefaut()], ['1re', premiere()]] as const) {
    it(`ordre fixe, ${nom}`, () => {
      const html = noteDeCalculHtml(preparer(s).note, STYLES_TRACE);
      expect([...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((x) => x[1])).toEqual([
        '1. Géométrie',
        '2. Matériaux',
        '3. Hypothèses',
        '4. Cas de charges',
        '5. Combinaisons de charges',
        '6. Calculs et vérifications',
        '7. Conclusions',
      ]);
    });
  }

  for (const [nom, s] of [['defaut', saisieParDefaut()], ['1re geosynthetique impose', premiere({ armature: 'geosynthetique', modeCercle: 'impose' })], ['non drainee', { ...saisieParDefaut(), drainageF: 'non_draine', cuF: '60' } as Saisie]] as const) {
    it(`toutes les lignes d entree rangees une fois : ${nom}`, () => {
      const { calcul, note } = preparer(s);
      const sc = note.sections;
      const ranges = [...symboles(sc.geometrie), ...symboles(sc.materiaux), ...symboles(sc.hypotheses), ...symboles(sc.charges)];
      expect([...ranges].sort()).toEqual(blocEntrees(calcul).lignes.map((l) => l.symbole).sort());
    });
  }

  it('geometrie : la coupe cotee de la vue gouvernante, avec la ligne des tractions', () => {
    const { calcul, r, note } = preparer(saisieParDefaut());
    const f = figures(note.sections.geometrie);
    expect(f).toHaveLength(1);
    if (f[0].type === 'figure') expect(f[0].svg).toBe(coupe(calcul, r, vueGouvernante(r), { cotes: true, tractions: true }));
  });

  it('materiaux : la section apres corrosion pour l acier seulement', () => {
    const t = texteVisible(noteDeCalculHtml(preparer(saisieParDefaut()).note, STYLES_TRACE));
    expect(t).toContain('9.3.4');
    expect(t).toContain('123,4');
    expect(texteVisible(noteDeCalculHtml(preparer(geosynthetique()).note, STYLES_TRACE))).not.toContain('corrosion');
  });

  it('hypotheses : profil normatif, ligne des tractions de l armature', () => {
    const t2 = texteVisible(noteDeCalculHtml(preparer(saisieParDefaut()).note, STYLES_TRACE));
    expect(t2).toContain('valeurs recommandées');
    expect(t2).toContain('gravité cohérente');
    expect(t2).toContain('CC2');
    expect(texteVisible(noteDeCalculHtml(preparer(geosynthetique()).note, STYLES_TRACE))).toContain('coin de Rankine');
    const ta = texteVisible(noteDeCalculHtml(preparer(premiere({ profilNormatif: 'anb2022', risque: 'eleve' })).note, STYLES_TRACE));
    expect(ta).toContain('ANB:2022');
    expect(ta).toContain('élevé');
  });

  it('combinaisons : les coefficients internes avec leur source', () => {
    const { r, note } = preparer(premiere());
    const t = JSON.stringify(note.sections.combinaisons);
    for (const i of r.interne) {
      expect(t).toContain(i.nom);
      for (const c of i.coefficients) expect(t).toContain(c.source);
    }
  });

  it('calculs : un tableau des lits par combinaison interne', () => {
    const { r, note } = preparer(premiere());
    const tb = tableaux(note.sections.calculs);
    expect(tb).toHaveLength(r.interne.length);
    tb.forEach((x, k) => {
      expect(x.titre).toContain(r.interne[k].nom);
      expect(x.lignes).toHaveLength(r.interne[k].lits.length);
    });
  });
});

describe('conclusions', () => {
  for (const [nom, s] of SAISIES) {
    it(`${nom} : chaque taux du noyau, sans norme dans le nom`, () => {
      const { r, note } = preparer(s);
      const attendus = [
        ...r.stabilite.map((x) => x.taux),
        ...r.interne.map((x) => x.tauxMax),
        ...r.externe.flatMap((e) => [e.glissement.taux, e.portance.taux]),
        r.renversement.taux,
        ...(r.excentricite ? [r.excentricite.taux] : []),
      ];
      expect(note.verifications.map((v) => v.taux)).toEqual(attendus);
      for (const v of note.verifications) {
        expect(v.nom).not.toMatch(/EN \d/);
        expect((v.clause ?? '').trim().length).toBeGreaterThan(0);
        expect(v.ok).toBe((v.taux ?? Infinity) <= 1);
      }
    });
  }

  it('aucun verdict global', () => {
    const t = texteVisible(noteDeCalculHtml(preparer(saisieParDefaut()).note, STYLES_TRACE));
    expect(t).not.toContain('Conforme');
    expect(t).not.toContain('Non conforme');
    expect(t).toContain('Vérification déterminante');
  });

  it('alertes du noyau reprises', () => {
    expect((preparer(court()).note.avertissements ?? []).join(' ')).toContain('0,7·H');
    expect((preparer(mou()).note.avertissements ?? []).join(' ')).toContain('borné');
    expect(preparer(impose()).note.avertissements ?? []).toEqual([]);
  });
});

describe('texte visible de la note', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const h = noteDeCalculHtml(preparer(s).note, STYLES_TRACE);
      expect(h).not.toContain('NaN');
      expect(h).not.toContain('Infinity');
      expect(constatsAffichage(texteVisible(h))).toEqual([]);
    });
  }
});

describe('export', () => {
  it('STYLES_TRACE porte les traits du dessin', () => {
    for (const c of ['.ligne-terrain', '.parement', '.lit', '.tractions', '.cercle', '.centre', '.force', '.cote']) expect(STYLES_TRACE).toContain(c);
  });

  it('main.ts exporte note, coupe et CSV', () => {
    const main = lire('../../app/src/main.ts');
    expect(main).toContain('svgAutonome(');
    expect(main).toContain('resultatsEnCsv(');
    expect(main).toContain('ouvrirOuTelecharger(');
  });
});

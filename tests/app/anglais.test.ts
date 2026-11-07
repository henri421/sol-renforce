/** T5 : page `en/index.html` de meme squelette, et aucun reste de francais en anglais. A ne pas modifier. */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blocsEnTexte, constatsAffichage, contenuBalise, definirLangue, noteDeCalculHtml, notationHtml, resultatsEnCsv, tauxAffiche, texteVisible } from 'aedificium-ui';
import { lireSaisie, relire, saisieParDefaut } from '../../app/src/form';
import { blocEntrees, blocsResultat, litsHtml, messageDErreur, verdictsHtml, voletsHtml } from '../../app/src/vue';
import { coupe, vuesDisponibles } from '../../app/src/dessin';
import { noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';
import { textes } from '../../app/src/textes';
import { verifierMur, type DonneesMur } from '../../src/mur';
import { calculer, court, geosynthetique, impose, lire, mou, premiere, SAISIES } from './_commun';

const controler = (nom: string, html: string): string[] => constatsAffichage(texteVisible(html), { langue: 'en' }).map((c) => `${nom} : ${c}`);

function squelette(html: string): string[] {
  return [...html.matchAll(/\s(id|data-[a-z-]+|type|inputmode|accept|value)="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
}

function erreur(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return messageDErreur(e);
  }
  throw new Error('une erreur etait attendue');
}

describe('page anglaise', () => {
  const fr = lire('../../app/index.html');
  const en = lire('../../app/en/index.html');

  it('meme squelette que la page francaise', () => {
    expect(squelette(en)).toEqual(squelette(fr));
  });

  it('langue, script commun, liens entre les deux versions', () => {
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('src="../src/main.ts"');
    expect(en).toMatch(/class="barre-langue" href="\.\.\/"/);
    expect(fr).toMatch(/class="barre-langue" href="en\/"/);
  });

  it('titre anglais, aucun reste de francais', () => {
    expect(contenuBalise(en, 'h1')).toBe('Reinforced soil wall');
    expect(controler('page', en.replace(/lang="fr"[^>]*>FR</, '>'))).toEqual([]);
  });
});

describe('affichage en anglais', () => {
  beforeEach(() => definirLangue('en'));
  afterEach(() => definirLangue('fr'));

  for (const [nom, s] of SAISIES) {
    it(`${nom} : ecran, dessins, lits, note, CSV`, () => {
      const { calcul, r } = calculer(s);
      const constats: string[] = [];
      constats.push(...controler('verdicts', verdictsHtml(r)));
      constats.push(...controler('volets', voletsHtml(r)));
      for (const i of r.interne) constats.push(...controler(`lits ${i.nom}`, litsHtml(r, i.nom)));
      for (const v of vuesDisponibles(r)) constats.push(...controler(`coupe ${v}`, coupe(calcul, r, v, { cotes: true, tractions: true })));
      constats.push(...controler('note', noteDeCalculHtml(noteDuCalcul(calcul, r, { projet: 'Road', element: '', date: '2026-11-07' }), STYLES_TRACE)));
      const csv = resultatsEnCsv(blocsEnTexte([blocEntrees(calcul), ...blocsResultat(r)]));
      constats.push(...constatsAffichage(csv, { langue: 'en' }).map((c) => `csv : ${c}`));
      expect(constats).toEqual([]);
    });
  }

  it('titre de la note, normes inchangees', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    const n = noteDuCalcul(calcul, r, { projet: '', element: ' ', date: '2026-11-07' });
    expect(n.cartouche.element).toBe('Reinforced soil wall');
    expect(n.cartouche.norme).toBe('EN 1997-1:2024, EN 1997-3:2025, EN 1990:2023');
  });

  it('nombres a point decimal', () => {
    const { r } = calculer(saisieParDefaut());
    expect(texteVisible(verdictsHtml(r))).toContain(tauxAffiche(r.gouvernant.taux));
    expect(tauxAffiche(r.gouvernant.taux)).toMatch(/^0\.\d+$/);
    expect(resultatsEnCsv(blocsEnTexte(blocsResultat(r)))).toContain('Block,Symbol,Quantity,Value');
  });

  it('messages et erreurs du noyau traduits', () => {
    const lue = lireSaisie(saisieParDefaut());
    if (!lue.ok) throw new Error(lue.message);
    const d = lue.calcul.donnees;
    const g = lireSaisie(geosynthetique());
    if (!g.ok) throw new Error(g.message);
    const dg = g.calcul.donnees;
    const v = (x: Partial<DonneesMur>) => () => verifierMur({ ...d, ...x });
    const geo = d.geometrie;
    const acier = d.armature.type === 'acier' ? d.armature : (() => { throw new Error('acier attendu'); })();
    const nappe = dg.armature.type === 'geosynthetique' ? dg.armature : (() => { throw new Error('nappe attendue'); })();
    const lectures = [
      lireSaisie({ ...saisieParDefaut(), H: 'abc' }),
      lireSaisie({ ...saisieParDefaut(), phiR: '' }),
      lireSaisie({ ...saisieParDefaut(), phiB: '95' }),
      lireSaisie({ ...saisieParDefaut(), drainageF: 'non_draine', cuF: '0' }),
      lireSaisie({ ...saisieParDefaut(), fy: 'x' }),
      lireSaisie(geosynthetique({ Tk: '?' })),
      lireSaisie({ ...saisieParDefaut(), generation: '1re' }),
      lireSaisie(premiere({ gRpo: '' })),
      lireSaisie(impose({ R: 'abc' })),
    ];
    const messages = [
      ...lectures.flatMap((l) => (l.ok ? [] : [l.message])),
      erreur(() => relire('{"format":"autre"}')),
      erreur(v({ geometrie: { ...geo, H: 0 } })),
      erreur(v({ geometrie: { ...geo, L: -1 } })),
      erreur(v({ geometrie: { ...geo, premierLit: 7 } })),
      erreur(v({ geometrie: { ...geo, D: 6 } })),
      erreur(v({ remblaiRenforce: { gamma: 0, phiDeg: 36 } })),
      erreur(v({ remblaiRetenu: { gamma: 18, phiDeg: 95 } })),
      erreur(v({ fondation: { gamma: 19, drainage: 'draine' } })),
      erreur(v({ fondation: { gamma: 19, drainage: 'draine', phiDeg: 32, c: -1 } })),
      erreur(v({ fondation: { gamma: 19, drainage: 'non_draine' } })),
      erreur(v({ qQ: -1 })),
      erreur(v({ armature: { ...acier, largeur: 0 } })),
      erreur(v({ armature: { ...acier, fy: 700 } })),
      erreur(v({ armature: { ...acier, galvanise: false, fy: 550 } })),
      erreur(v({ armature: { ...acier, galvanise: false } })),
      erreur(v({ armature: { ...nappe, etaGs: 1.5 } })),
      erreur(v({ armature: { ...nappe, Rc: 0 } })),
      erreur(v({ armature: { ...nappe, gammaRd: 0.9 } })),
      erreur(v({ armature: { ...nappe, kpo: 0 } })),
      erreur(v({ generation: '1re', coefficientsInternes1g: null })),
      erreur(v({ generation: '1re', coefficientsInternes1g: { gRt: 0, gRpo: 1.35 } })),
      erreur(v({ generation: '1re', profilNormatif: 'anb2022', approche: 'DA3', coefficientsInternes1g: { gRt: 1.1, gRpo: 1.35 } })),
      erreur(v({ cercle: { xc: 0, yc: 50, R: 5 } })),
      textes().messages.rienAExporter,
      textes().messages.nouvelleVersion,
    ];
    expect(messages.flatMap((m, i) => controler(`message ${i} « ${m} »`, notationHtml(m)))).toEqual([]);
  });

  it('alertes du noyau traduites', () => {
    for (const s of [court(), mou()]) {
      const r = calculer(s).r;
      expect(r.alertes.length).toBeGreaterThan(0);
      expect(controler('verdicts', verdictsHtml(r))).toEqual([]);
    }
    for (const a of ["Longueur d'ancrage nulle au lit h = 0,38 m : arrachement nul, taux infini.", "La résultante sort de la base du massif (B' ≤ 0) : portance non calculée, taux infini."]) {
      expect(controler(a, notationHtml(messageDErreur(a)))).toEqual([]);
    }
  });
});

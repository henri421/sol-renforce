// Lot E (audit R4) : profil luxembourgeois de la 1re generation (valeurs recommandees presumees, sources AN-LU).
import { describe, expect, it } from 'vitest';
import { noteDeCalculHtml, texteVisible } from 'aedificium-ui';
import { profil1g } from 'sol-ec7';
import { profilLu1g } from '../../app/src/annexe';
import { relire, serialiser } from '../../app/src/form';
import { noteDuCalcul } from '../../app/src/note';
import { calculer, premiere } from './_commun';

describe('annexe luxembourgeoise (sol renforce)', () => {
  it('memes valeurs que le profil recommande, sources ILNAS', () => {
    expect(profilLu1g().A2.gQ_dst.valeur).toBe(profil1g().A2.gQ_dst.valeur);
    expect(profilLu1g().A2.gQ_dst.source).toMatch(/^ILNAS-EN 1997-1\/AN-LU:2020, tableau A\.3/);
  });

  it('choix enregistre et relu ; calcul identique au recommande ; note luxembourgeoise', () => {
    const base = premiere();
    const s = { ...base, profilNormatif: 'lu' as const };
    expect(relire(serialiser(s)).profilNormatif).toBe('lu');
    const rec = calculer(base);
    const { calcul, r } = calculer(s);
    expect(JSON.stringify(r)).toContain('AN-LU:2020');
    expect(JSON.stringify(r).replace(/"[^"]*(AN-LU|valeurs recommandées|EN 1997-1:2004)[^"]*"/g, '""')).toBe(
      JSON.stringify(rec.r).replace(/"[^"]*(AN-LU|valeurs recommandées|EN 1997-1:2004)[^"]*"/g, '""'),
    );
    const note = noteDuCalcul(calcul, r, { projet: 'P', element: 'E', date: '2026-11-17' });
    expect(note.cartouche.norme).toContain('AN-LU:2020');
    expect(note.avertissements?.some((a) => /^Annexe nationale luxembourgeoise/.test(a))).toBe(true);
    expect(texteVisible(noteDeCalculHtml(note, ''))).toContain('Luxembourg');
  });
});

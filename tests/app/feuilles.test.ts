// Barre des feuilles de calcul (etape 9.5).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { relire, saisieParDefaut, serialiser } from '../../app/src/form';

const lire = (f: string): string => readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');

describe('feuilles de calcul (etape 9.5)', () => {
  it('saisie -> JSON de feuille -> saisie : identique', () => {
    const s = saisieParDefaut();
    expect(relire(JSON.stringify(JSON.parse(serialiser(s))))).toEqual(s);
  });

  it('les pages francaise et anglaise ont la zone de la barre, sous l en-tete', () => {
    for (const page of ['app/index.html', 'app/en/index.html']) {
      const html = lire(page);
      const zone = html.indexOf('data-role="feuilles"');
      expect(zone, page).toBeGreaterThan(html.indexOf('</header>'));
      expect(zone, page).toBeLessThan(html.indexOf('<main'));
    }
  });

  it('main.ts branche la barre ; dans un projet, pas de memoire locale', () => {
    const m = lire('app/src/main.ts');
    expect(m).toContain("app: 'sol-renforce'");
    expect(m).toMatch(/if \(barre\?\.dansUnProjet\(\)\) barre\.signaler\(\);\s*else memoriser\(\);/);
  });
});

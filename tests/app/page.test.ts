/** T1 : la page, sa configuration, le cablage de main.ts. A ne pas modifier. */

import { describe, expect, it } from 'vitest';
import { JETONS, constatsAffichage, contenuBalise, texteVisible, valeursDesJetons } from 'aedificium-ui';
import { saisieParDefaut } from '../../app/src/form';
import { lire } from './_commun';

const page = lire('../../app/index.html');
const main = lire('../../app/src/main.ts');

describe('page', () => {
  it('titre', () => {
    expect(contenuBalise(page, 'h1')).toBe('Mur en sol renforcé');
    expect(contenuBalise(page, 'title')?.startsWith('Mur en sol renforcé')).toBe(true);
  });

  it('un champ par valeur saisie ; les choix a boutons ont leurs boutons', () => {
    const A_BOUTONS: Record<string, string> = {
      generation: 'data-generation',
      armature: 'data-armature',
      drainageF: 'data-drainage',
      modeCercle: 'data-cercle',
    };
    for (const cle of Object.keys(saisieParDefaut())) {
      if (cle in A_BOUTONS) continue;
      expect(page).toContain(`data-champ="${cle}"`);
    }
    for (const a of [
      'data-generation="1re"',
      'data-generation="2e"',
      'data-armature="acier"',
      'data-armature="geosynthetique"',
      'data-drainage="draine"',
      'data-drainage="non_draine"',
      'data-cercle="recherche"',
      'data-cercle="impose"',
    ]) {
      expect(page).toContain(a);
    }
  });

  it('choix normatifs et listes', () => {
    for (const v of ['recommande', 'anb2022', 'faible', 'normal', 'eleve', 'DA1', 'DA2', 'DA3', 'CC1', 'CC2', 'CC3', 'a+b', 'c', 'd', 'materiaux', 'resistances', 'terrestre', 'eau_douce', 'uniforme', 'non_uniforme']) {
      expect(page).toContain(`value="${v}"`);
    }
    expect(texteVisible(page)).toContain('ANB:2022');
  });

  it('les lignes qui dependent d un choix le disent', () => {
    for (const a of [
      'data-groupe="1re"',
      'data-groupe="2e"',
      'data-si-armature="acier"',
      'data-si-armature="geosynthetique"',
      'data-si-drainage="draine"',
      'data-si-drainage="non_draine"',
      'data-si-cercle="impose"',
      'data-si-profil="anb2022"',
    ]) {
      expect(page).toContain(a);
    }
  });

  it('zones de resultat, options du dessin, sorties', () => {
    for (const r of ['erreur', 'vues', 'coupe', 'verdicts', 'volets', 'lits', 'projet', 'element', 'ouvrir']) {
      expect(page).toContain(`data-role="${r}"`);
    }
    for (const a of ['defauts-fhwa', 'exporter-note', 'exporter-coupe', 'exporter-resultats', 'enregistrer', 'reinitialiser']) {
      expect(page).toContain(`data-action="${a}"`);
    }
    expect(page).toContain('data-option="cotes"');
    expect(page).toContain('data-option="tractions"');
  });

  it('la note de calcul est la premiere sortie', () => {
    const i = page.indexOf('data-action="exporter-note"');
    for (const a of ['exporter-coupe', 'exporter-resultats', 'enregistrer']) expect(i).toBeLessThan(page.indexOf(`data-action="${a}"`));
  });

  it('sources des valeurs par defaut et hors-perimetre annonces', () => {
    const t = texteVisible(page);
    expect(t).toContain('FHWA-NHI-10-024');
    for (const m of ['parement incliné', 'talus renforcés', 'longueurs variables', 'nappe phréatique', 'séisme', 'états limites de service']) expect(t).toContain(m);
  });

  it('notations, accents, phrases types', () => {
    expect(constatsAffichage(texteVisible(page))).toEqual([]);
  });

  it('pas de reste du gabarit', () => {
    for (const f of [page, main, lire('../../vite.config.ts'), lire('../../app/src/pwa.ts')]) {
      expect(f.toLowerCase()).not.toContain('semelle');
      expect(f.toLowerCase()).not.toContain('stabilite-talus');
      expect(f.toLowerCase()).not.toContain('fondations-superficielles');
    }
    expect(lire('../../vite.config.ts')).toContain('sol-renforce');
  });

  it('le :root de style.css concorde avec les jetons communs', () => {
    const css = valeursDesJetons(lire('../../app/src/style.css'));
    for (const [nom, valeur] of valeursDesJetons(JETONS)) expect(css.get(nom)).toBe(valeur);
  });
});

describe('main.ts', () => {
  it('passe par le formulaire et les modules purs', () => {
    for (const f of [
      'lireSaisie(',
      'verifier(',
      'verdictsHtml(',
      'voletsHtml(',
      'litsHtml(',
      'coupe(',
      'vuesDisponibles(',
      'vueGouvernante(',
      'defautsFhwa(',
      'noteDuCalcul(',
      'blocsEnTexte(',
      'noteDeCalculHtml(',
      'svgAutonome(',
      'resultatsEnCsv(',
      'ouvrirOuTelecharger(',
    ]) {
      expect(main).toContain(f);
    }
    expect(main).toMatch(/import \{[^}]*\bnoteDeCalculHtml\b[^}]*\} from 'aedificium-ui'/);
  });

  it('memorise saisie et cartouche sous le nom de l outil', () => {
    expect(main).toContain("'sol-renforce/saisie'");
    expect(main).toContain("'sol-renforce:cartouche'");
  });

  it('l interface ne calcule rien', () => {
    for (const x of ['verifierMur', 'rechercherCercleCritique', 'analyserCercle', 'defautsGraviteCoherente', 'longueurActive']) expect(main).not.toContain(x);
    for (const f of [main, lire('../../app/src/vue.ts'), lire('../../app/src/note.ts'), lire('../../app/src/form.ts')]) {
      expect(f).not.toMatch(/Math\.(tan|sin|cos|atan|exp|sqrt|log)/);
    }
  });
});

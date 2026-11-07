/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui). PUR : aucun calcul.
 *
 * Les lignes d'entree et les blocs de resultat viennent de `vue.ts` (`entreesParSection`,
 * `blocsResultat`), la coupe de `dessin.ts`. Les verifications sont les taux du noyau : chaque
 * combinaison de stabilite generale et de stabilite interne, le glissement et la portance de chaque
 * combinaison externe, le basculement, et l'excentricite en 2e generation. Pas de verdict global :
 * la note dit la verification determinante.
 *
 * Ecrit en T0 par la seance de conception ; l'executant ne le modifie pas.
 */

import { type ElementNote, type LigneResultat, type NoteDeCalcul, type VerificationNote, nombreAffiche, tauxAffiche } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { coupe, vueGouvernante } from './dessin';
import { phrase, ponctuer, textes } from './textes';
import { blocsResultat, entreesParSection } from './vue';

/** Normes affichees dans le cartouche (non traduites). */
const NORME_1RE = 'EN 1997-1:2004';
const NORME_1RE_ANB = 'EN 1997-1:2004, NBN EN 1997-1 ANB:2022';
const NORMES_2E = 'EN 1997-1:2024, EN 1997-3:2025, EN 1990:2023';

const bloc = (titre: string, lignes: LigneResultat[], note: string | null = null): ElementNote => ({
  type: 'bloc',
  bloc: { titre, lignes, note },
});

function normeDe(calcul: Calcul, r: Resultat): string {
  if (r.generation === '2e') return NORMES_2E;
  return calcul.donnees.profilNormatif === 'anb2022' ? NORME_1RE_ANB : NORME_1RE;
}

/** Une verification par taux du noyau, jugee sur taux <= 1 (un taux infini n'est pas satisfait). */
function verificationsDe(r: Resultat): VerificationNote[] {
  const t = textes();
  const v = t.verifications;
  const cl = t.clauses[r.generation];
  const nom = (verification: string, combinaison: string) => ponctuer(`${verification}, ${phrase(combinaison)}`);
  const ligne = (n: string, clause: string, taux: number): VerificationNote => ({ nom: n, clause, taux, ok: taux <= 1 });

  const liste: VerificationNote[] = [
    ...r.stabilite.map((s) => ligne(nom(v.stabilite, s.nom), cl.stabilite, s.taux)),
    ...r.interne.map((i) => ligne(nom(v.interne, i.nom), cl.interne, i.tauxMax)),
    ...r.externe.flatMap((e) => [
      ligne(nom(v.glissement, e.nom), cl.glissement, e.glissement.taux),
      ligne(nom(v.portance, e.nom), cl.portance, e.portance.taux),
    ]),
    ligne(nom(v.renversement, r.renversement.nom), cl.renversement, r.renversement.taux),
  ];
  if (r.excentricite !== null) liste.push(ligne(v.excentricite, cl.excentricite, r.excentricite.taux));
  return liste;
}

/** Coefficients de chaque combinaison interne, avec leur source. */
function blocsCoefficients(r: Resultat): ElementNote[] {
  const t = textes();
  return r.interne.map((i) =>
    bloc(
      ponctuer(`${t.note.coefficients}, ${t.verifications.interne.toLowerCase()}, ${phrase(i.nom)}`),
      i.coefficients.map((c) => ({
        symbole: c.nom,
        libelle: phrase(c.source),
        valeur: nombreAffiche(c.valeur, 3),
      })),
    ),
  );
}

/** Tableau des lits de chaque combinaison interne. */
function tableauxLits(r: Resultat): ElementNote[] {
  const n = textes().note;
  return r.interne.map((i) => ({
    type: 'tableau',
    titre: n.lits(phrase(i.nom)),
    entetes: [...n.colonnesLits],
    lignes: i.lits.map((l) => [
      nombreAffiche(l.h, 3),
      nombreAffiche(l.z, 3),
      nombreAffiche(l.K, 3),
      nombreAffiche(l.sigmaV, 1),
      nombreAffiche(l.T, 2),
      nombreAffiche(l.La, 2),
      nombreAffiche(l.Le, 2),
      nombreAffiche(l.Rt, 1),
      nombreAffiche(l.Rpo, 1),
      tauxAffiche(l.taux),
    ]),
  }));
}

/** Note du calcul courant, sans verdict global. */
export function noteDuCalcul(
  calcul: Calcul,
  r: Resultat,
  cartouche: { projet: string; element: string; date: string },
): NoteDeCalcul {
  const t = textes();
  const n = t.note;
  const titre = n.titreEntrees;
  const entrees = entreesParSection(calcul);
  // Le premier bloc de resultat (synthese) reste a l'ecran ; la note donne le detail de chaque verification.
  const [, ...detail] = blocsResultat(r);
  const s = r.section;
  const corrosion: ElementNote[] =
    s === null
      ? []
      : [{ type: 'texte', texte: n.corrosion(nombreAffiche(s.deltaE, 2), nombreAffiche(s.Ar, 1), nombreAffiche(s.rapport * 100, 0)) }];

  return {
    cartouche: {
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? n.element : cartouche.element,
      date: cartouche.date,
      norme: normeDe(calcul, r),
      outil: 'sol-renforce',
    },
    sections: {
      geometrie: [
        bloc(titre, entrees.geometrie),
        { type: 'figure', svg: coupe(calcul, r, vueGouvernante(r), { cotes: true, tractions: true }), legende: n.legendeCoupe },
      ],
      materiaux: [bloc(titre, entrees.materiaux), ...corrosion],
      hypotheses: [
        bloc(titre, entrees.hypotheses),
        { type: 'liste', items: [phrase(r.profil), n.tractions[calcul.donnees.armature.type], ...n.hypotheses] },
      ],
      charges: [bloc(titre, entrees.charges)],
      combinaisons: [{ type: 'liste', items: [...n.combinaisons[r.generation]] }, ...blocsCoefficients(r)],
      calculs: [...tableauxLits(r), ...detail.map((b): ElementNote => ({ type: 'bloc', bloc: b }))],
    },
    verifications: verificationsDe(r),
    // Indice grec du noyau (« m_α ») : la notation commune ne lit que des indices ASCII, d'ou « _alpha ».
    avertissements: r.alertes.map((a) => phrase(a).replace(/_α/g, '_alpha')),
  };
}

/**
 * La coupe du mur en sol renforce, a l'echelle, en SVG. PUR.
 * Les classes imposees sont en tete de `tests/app/dessin.test.ts`.
 *
 * Repere du noyau : pied du parement en (0 ; 0), x vers l'arriere du massif, y vers le haut.
 * Le SVG inverse les ordonnees. Une seule echelle en x et en y : un mur haut reste haut.
 * Le dessin ne fait que des positions ; la ligne des tractions vient de `longueurActive`.
 */

import { echapper, nombreAffiche, notationSvg } from 'aedificium-ui';
import { longueurActive } from '../../src/mur';
import type { Calcul, Resultat } from './form';
import { ponctuer, textes } from './textes';

export interface OptionsCoupe {
  cotes: boolean;
  tractions: boolean;
}

type Stab = Resultat['stabilite'][number];

/** Largeur du viewBox, hauteur calculee. Marges en pixels, pour les textes et les cotes. */
const LARGEUR = 640;
const PAD = { gauche: 58, droite: 28, haut: 48, bas: 46 };
/** Hauteur maximale du mur dessine, en pixels. */
const HAUTEUR_MAX = 380;

/** Nombre fini, ou 0 : jamais de NaN ni d'Infinity dans un attribut. */
const a = (v: number): string => (Number.isFinite(v) ? String(Number(v.toFixed(2))) : '0');

/** Nombre affiche, ou un tiret : jamais de NaN ni d'Infinity dans un texte. */
const nb = (v: number, decimales?: number): string =>
  Number.isFinite(v) ? nombreAffiche(v, decimales) : '—';

/** Notation des indices pour le SVG. */
const tx = (s: string): string => notationSvg(ponctuer(s));

function texte(x: number, y: number, classe: string, contenu: string, ancrage = 'start'): string {
  return `<text x="${a(x)}" y="${a(y)}" class="${classe}" text-anchor="${ancrage}">${tx(contenu)}</text>`;
}

function ligne(x1: number, y1: number, x2: number, y2: number, classe: string): string {
  return `<line class="${classe}" x1="${a(x1)}" y1="${a(y1)}" x2="${a(x2)}" y2="${a(y2)}"/>`;
}

/** Une vue par combinaison de stabilite generale, dans l'ordre du noyau. */
export function vuesDisponibles(r: Resultat): string[] {
  return r.stabilite.map((s) => s.nom);
}

/** La combinaison de stabilite generale au plus fort taux. */
export function vueGouvernante(r: Resultat): string {
  let vue = '';
  let taux = -Infinity;
  for (const s of r.stabilite) {
    if (s.taux > taux) {
      taux = s.taux;
      vue = s.nom;
    }
  }
  return vue;
}

export function coupe(calcul: Calcul, r: Resultat, vue: string, options: OptionsCoupe): string {
  const d = calcul.donnees;
  const { H, L, D } = d.geometrie;
  const T = textes();
  const stab: Stab | undefined = r.stabilite.find((s) => s.nom === vue);
  if (!stab) throw new Error(`vue inconnue : ${vue}`);
  const { cercle } = stab;
  const tranches = stab.resultat.tranches;
  const renforts = stab.resultat.renforts;

  // Terrain : le devant du parement a la cote D, la crete a H. Les deux extremites
  // debordent du massif pour que la coupe se lise comme un sol, pas comme une boite.
  const debord = Math.max(H, 1);
  const xg = -debord;
  const xd = L + debord;
  // Epaisseur dessinee du sol de fondation, sous la base du massif (m).
  const profF = Math.max(0.5, 0.2 * H);

  // Extremites de l'arc : aux bords de la premiere et de la derniere tranche, sur le terrain.
  const n = tranches.length;
  const t0 = n > 0 ? tranches[0] : null;
  const tn = n > 0 ? tranches[n - 1] : null;
  const xa = t0 ? t0.x - t0.b / 2 : cercle.xc - cercle.R;
  const ya = t0 ? t0.ySol : D;
  const xb = tn ? tn.x + tn.b / 2 : cercle.xc + cercle.R;
  const yb = tn ? tn.ySol : H;

  // Cadre : tout ce qui est dessine, centre du cercle compris. Il ne depend pas des options.
  const xs = [xg, 0, L, xd, xa, xb, cercle.xc];
  const ys = [0, D, H, -profF, ya, yb, cercle.yc];
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ymin = Math.min(...ys);
  const ymax = Math.max(...ys);
  const spanX = xmax - xmin || 1;
  const spanY = ymax - ymin || 1;

  // Une seule echelle, en x et en y.
  const s = Math.min((LARGEUR - PAD.gauche - PAD.droite) / spanX, HAUTEUR_MAX / spanY);
  const ox = (LARGEUR - PAD.gauche - PAD.droite - spanX * s) / 2;
  const X = (x: number): number => PAD.gauche + ox + (x - xmin) * s;
  const Y = (y: number): number => PAD.haut + (ymax - y) * s;
  const hauteur = PAD.haut + spanY * s + PAD.bas;

  const corps: string[] = [];
  const pt = (x: number, y: number): string => `${a(X(x))},${a(Y(y))}`;

  // Sols : fondation, remblai retenu derriere le massif, massif renforce devant.
  corps.push(
    `<polygon class="fondation" points="${pt(xg, 0)} ${pt(xd, 0)} ${pt(xd, -profF)} ${pt(xg, -profF)}"/>`
  );
  corps.push(
    `<polygon class="remblai-retenu" points="${pt(L, 0)} ${pt(xd, 0)} ${pt(xd, H)} ${pt(L, H)}"/>`
  );
  corps.push(`<polygon class="massif" points="${pt(0, 0)} ${pt(L, 0)} ${pt(L, H)} ${pt(0, H)}"/>`);

  // Terrain : (x_g ; D), (0 ; D), (0 ; H), (x_d ; H), avec x_g < 0 et x_d > L.
  corps.push(
    `<polyline class="ligne-terrain" points="${pt(xg, D)} ${pt(0, D)} ${pt(0, H)} ${pt(xd, H)}"/>`
  );

  // Parement, puis un lit par armature.
  corps.push(ligne(X(0), Y(0), X(0), Y(H), 'parement'));
  for (const lit of r.lits) corps.push(ligne(X(0), Y(lit.h), X(L), Y(lit.h), 'lit'));

  // Ligne des tractions maximales : h = 0, H/2, H et chaque lit, h croissant, sans doublon.
  if (options.tractions) {
    const hauteurs = [0, H / 2, H, ...r.lits.map((lit) => lit.h)].sort((u, v) => u - v);
    const uniques: number[] = [];
    for (const h of hauteurs) {
      if (uniques.length === 0 || Math.abs(h - uniques[uniques.length - 1]) > 1e-9) uniques.push(h);
    }
    const points = uniques
      .map((h) => {
        // `longueurActive` exige h > 0 ; au pied, la longueur active est nulle.
        const longueur = h > 0 ? longueurActive(d.armature, H, h, d.remblaiRenforce.phiDeg) : 0;
        return pt(longueur, h);
      })
      .join(' ');
    corps.push(`<polyline class="tractions" points="${points}"/>`);
  }

  // Arc de glissement : de la sortie a l'entree sur le terrain, par les tranches du resultat.
  const xC = X(cercle.xc);
  const yC = Y(cercle.yc);
  const rayonPx = cercle.R * s;
  if (t0 && tn) {
    const xA = X(xa);
    const yA = Y(ya);
    const xB = X(xb);
    const yB = Y(yb);
    // Balayage negatif (SVG sweep 0) : l'arc passe sous le centre. Grand arc si l'angle
    // parcouru depasse 180 degres.
    const angle = (px: number, py: number): number => Math.atan2(py - yC, px - xC);
    const parcours = (((angle(xA, yA) - angle(xB, yB)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const grand = parcours > Math.PI ? 1 : 0;
    corps.push(
      `<path class="cercle" d="M ${a(xA)} ${a(yA)} A ${a(rayonPx)} ${a(rayonPx)} 0 ${grand} 0 ${a(xB)} ${a(yB)}"/>`
    );
  }
  corps.push(`<circle class="centre" cx="${a(xC)}" cy="${a(yC)}" r="3"/>`);

  // Forces des armatures coupees qui portent un effort : une par renfort de T > 0, a la hauteur du lit.
  for (const f of renforts) {
    if (!(f.T > 0)) continue;
    corps.push(ligne(X(f.xCoupe), Y(f.y), X(L), Y(f.y), 'force'));
  }

  // Libelles des sols et du massif.
  corps.push(texte(X(L / 2), Y(0.9 * H), 'texte-coupe', T.dessin.massif, 'middle'));
  corps.push(texte(X((L + xd) / 2), Y(0.9 * H), 'texte-coupe', T.dessin.remblaiRetenu, 'middle'));
  corps.push(texte(X(0.6 * L), Y(-0.45 * profF), 'texte-coupe', T.dessin.fondation, 'middle'));

  // Cotes H et L, retirees par l'option « cotes ».
  if (options.cotes) {
    const xH = X(xg / 2);
    const yHaut = Y(H);
    const yBas = Y(0);
    corps.push(ligne(xH, yHaut, xH, yBas, 'cote'));
    corps.push(ligne(xH - 4, yHaut, xH + 4, yHaut, 'cote'));
    corps.push(ligne(xH - 4, yBas, xH + 4, yBas, 'cote'));
    corps.push(texte(xH - 6, (yHaut + yBas) / 2, 'cote', T.dessin.hauteur(nb(H, 2)), 'end'));

    const yL = Y(0) + 18;
    const x0 = X(0);
    const xL = X(L);
    corps.push(ligne(x0, yL, xL, yL, 'cote'));
    corps.push(ligne(x0, yL - 4, x0, yL + 4, 'cote'));
    corps.push(ligne(xL, yL - 4, xL, yL + 4, 'cote'));
    corps.push(texte((x0 + xL) / 2, yL + 14, 'cote', T.dessin.longueur(nb(L, 2)), 'middle'));
  }

  // Titre : la vue et son F_d a trois decimales.
  corps.push(texte(PAD.gauche, 22, 'titre-coupe', T.dessin.titreVue(vue, nb(stab.F, 3))));

  return `<svg viewBox="0 0 ${LARGEUR} ${a(hauteur)}" role="img" aria-label="${echapper(T.dessin.aria)}">${corps.join('')}</svg>`;
}

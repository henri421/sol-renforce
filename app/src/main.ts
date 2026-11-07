/**
 * Cablage de l'interface du mur en sol renforce.
 *
 * Ce module ne calcule RIEN : il tient la saisie, appelle le noyau par `form`,
 * et confie la mise en forme aux modules purs. La generation et l'armature ne sont
 * que des champs de la saisie : les basculer ne touche a aucune valeur saisie.
 */

import {
  blocsEnTexte,
  definirLangue,
  echapper,
  langueDuDocument,
  noteDeCalculHtml,
  notationHtml,
  ouvrirOuTelecharger,
  resultatsEnCsv,
  svgAutonome,
  telecharger,
} from 'aedificium-ui';
import { defautsFhwa, lireSaisie, relire, saisieParDefaut, serialiser, verifier, type Calcul, type Resultat, type Saisie } from './form';
import { coupe, vueGouvernante, vuesDisponibles } from './dessin';
import { STYLES_TRACE } from './export';
import { noteDuCalcul } from './note';
import { textes } from './textes';
import { blocEntrees, blocsResultat, litsHtml, messageDErreur, verdictsHtml, voletsHtml } from './vue';
import './style.css';

// La langue d'abord : tout rendu la lit (`index.html` ou `en/index.html`).
definirLangue(langueDuDocument(document));

const CLE_SAISIE = 'sol-renforce/saisie';
const CLE_CARTOUCHE = 'sol-renforce:cartouche';

function exige<T extends Element>(selecteur: string): T {
  const e = document.querySelector<T>(selecteur);
  if (e === null) throw new Error(textes().page.elementAbsent(selecteur));
  return e;
}

const formulaire = exige<HTMLFormElement>('#formulaire');
const zones = {
  erreur: exige<HTMLElement>('[data-role="erreur"]'),
  vues: exige<HTMLElement>('[data-role="vues"]'),
  coupe: exige<HTMLElement>('[data-role="coupe"]'),
  verdicts: exige<HTMLElement>('[data-role="verdicts"]'),
  volets: exige<HTMLElement>('[data-role="volets"]'),
  lits: exige<HTMLElement>('[data-role="lits"]'),
};
const champProjet = exige<HTMLInputElement>('[data-role="projet"]');
const champElement = exige<HTMLInputElement>('[data-role="element"]');

function charger(): Saisie | null {
  try {
    const t = window.localStorage.getItem(CLE_SAISIE);
    return t === null ? null : relire(t);
  } catch {
    return null;
  }
}

function memoriser(): void {
  try {
    window.localStorage.setItem(CLE_SAISIE, serialiser(saisie));
  } catch {
    // Stockage indisponible : la page fonctionne sans.
  }
}

function lireCartouche(): { projet: string; element: string } {
  try {
    const t = window.localStorage.getItem(CLE_CARTOUCHE);
    if (t === null) return { projet: '', element: '' };
    const c = JSON.parse(t) as { projet?: unknown; element?: unknown };
    return {
      projet: typeof c.projet === 'string' ? c.projet : '',
      element: typeof c.element === 'string' ? c.element : '',
    };
  } catch {
    return { projet: '', element: '' };
  }
}

let saisie: Saisie = charger() ?? saisieParDefaut();

interface Dernier {
  calcul: Calcul;
  resultat: Resultat;
}
let dernier: Dernier | null = null;
/** Vue du dessin : le nom d'une combinaison de stabilite generale. */
let vue: string | null = null;
/** Combinaison interne dont le tableau des lits est affiche. */
let combinaison: string | null = null;

type Racine = Record<string, unknown>;

function boutons(selecteur: string): HTMLButtonElement[] {
  return [...formulaire.querySelectorAll<HTMLButtonElement>(selecteur)];
}

/** Recopie la saisie dans les champs `data-champ`, puis met l'affichage a jour. */
function ecrireSaisie(): void {
  for (const e of formulaire.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-champ]')) {
    const cle = e.dataset.champ;
    if (cle === undefined) continue;
    const v = (saisie as unknown as Racine)[cle];
    e.value = cle === 'galvanise' ? (v === true ? 'oui' : 'non') : String(v);
  }
  ajusterAffichage();
}

function montrerErreur(message: string | null): void {
  zones.erreur.hidden = message === null;
  zones.erreur.innerHTML = message === null ? '' : notationHtml(message);
}

/** Les lignes qui dependent d'un choix s'affichent avec lui ; leur valeur reste en memoire. */
function ajusterAffichage(): void {
  for (const b of boutons('[data-generation]')) {
    b.setAttribute('aria-pressed', String(b.dataset.generation === saisie.generation));
  }
  for (const b of boutons('[data-armature]')) {
    b.setAttribute('aria-pressed', String(b.dataset.armature === saisie.armature));
  }
  for (const b of boutons('[data-drainage]')) {
    b.setAttribute('aria-pressed', String(b.dataset.drainage === saisie.drainageF));
  }
  for (const b of boutons('[data-cercle]')) {
    b.setAttribute('aria-pressed', String(b.dataset.cercle === saisie.modeCercle));
  }
  for (const g of formulaire.querySelectorAll<HTMLElement>('[data-groupe]')) {
    g.hidden = g.dataset.groupe !== saisie.generation;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-armature]')) {
    z.hidden = z.dataset.siArmature !== saisie.armature;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-drainage]')) {
    z.hidden = z.dataset.siDrainage !== saisie.drainageF;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-cercle]')) {
    z.hidden = z.dataset.siCercle !== saisie.modeCercle;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-profil]')) {
    z.hidden = z.dataset.siProfil !== saisie.profilNormatif;
  }
  // ANB 2022 : l'approche est DA1, liste grisee (`lireSaisie` passe DA1 de toute facon).
  const approche = formulaire.querySelector<HTMLSelectElement>('[data-champ="approche1"]');
  if (approche !== null) {
    const anb = saisie.profilNormatif === 'anb2022';
    approche.disabled = anb;
    if (anb) approche.value = 'DA1';
  }
}

function optionsDessin(): { cotes: boolean; tractions: boolean } {
  return {
    cotes: exige<HTMLInputElement>('[data-option="cotes"]').checked,
    tractions: exige<HTMLInputElement>('[data-option="tractions"]').checked,
  };
}

function dessinerVues(): void {
  const vues = dernier === null ? [] : vuesDisponibles(dernier.resultat);
  if (dernier !== null && (vue === null || !vues.includes(vue))) vue = vueGouvernante(dernier.resultat);
  zones.vues.innerHTML = vues
    .map((v) => `<button type="button" data-vue="${echapper(v)}" aria-pressed="${v === vue}">${notationHtml(v)}</button>`)
    .join('');
}

function renduDessin(): void {
  zones.coupe.innerHTML = dernier === null || vue === null ? '' : coupe(dernier.calcul, dernier.resultat, vue, optionsDessin());
}

/** La combinaison interne la plus chargee : son tableau des lits s'ouvre d'abord. */
function plusChargee(r: Resultat): string | null {
  let meilleure: Resultat['interne'][number] | null = null;
  for (const i of r.interne) {
    if (meilleure === null || i.tauxMax > meilleure.tauxMax) meilleure = i;
  }
  return meilleure === null ? null : meilleure.nom;
}

function dessinerLits(): void {
  if (dernier === null) {
    zones.lits.innerHTML = '';
    return;
  }
  const r = dernier.resultat;
  const noms = r.interne.map((i) => i.nom);
  if (combinaison === null || !noms.includes(combinaison)) combinaison = plusChargee(r);
  if (combinaison === null) {
    zones.lits.innerHTML = '';
    return;
  }
  const choix = noms
    .map((n) => `<button type="button" data-combinaison="${echapper(n)}" aria-pressed="${n === combinaison}">${notationHtml(n)}</button>`)
    .join('');
  zones.lits.innerHTML = `<div class="boutons">${choix}</div>${litsHtml(r, combinaison)}`;
}

function viderResultats(): void {
  dernier = null;
  vue = null;
  combinaison = null;
  zones.vues.innerHTML = '';
  zones.verdicts.innerHTML = '';
  zones.volets.innerHTML = '';
  zones.lits.innerHTML = '';
  renduDessin();
}

function recalculer(): void {
  memoriser();
  ajusterAffichage();
  const lecture = lireSaisie(saisie);
  if (!lecture.ok) {
    montrerErreur(lecture.message);
    viderResultats();
    return;
  }
  let resultat: Resultat;
  try {
    resultat = verifier(lecture.calcul);
  } catch (e) {
    montrerErreur(messageDErreur(e));
    viderResultats();
    return;
  }
  montrerErreur(null);
  dernier = { calcul: lecture.calcul, resultat };
  zones.verdicts.innerHTML = verdictsHtml(resultat);
  zones.volets.innerHTML = voletsHtml(resultat);
  dessinerVues();
  dessinerLits();
  renduDessin();
}

/** Une saisie dans un champ `data-champ` : la valeur va dans la saisie, puis le calcul se refait. */
function lireEdition(cible: EventTarget | null): void {
  if (!(cible instanceof HTMLInputElement || cible instanceof HTMLSelectElement)) return;
  const cle = cible.dataset.champ;
  if (cle === undefined) return;
  (saisie as unknown as Racine)[cle] = cle === 'galvanise' ? cible.value === 'oui' : cible.value;
  recalculer();
}

formulaire.addEventListener('input', (evenement) => lireEdition(evenement.target));

for (const option of document.querySelectorAll<HTMLInputElement>('[data-option]')) {
  option.addEventListener('input', () => renduDessin());
}

function cartouche(): { projet: string; element: string; date: string } {
  return {
    projet: champProjet.value,
    element: champElement.value,
    date: new Date().toISOString().slice(0, 10),
  };
}

document.addEventListener('click', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLElement)) return;
  const bouton = cible.closest('button');
  if (bouton === null) return;
  const d = bouton.dataset;

  if (d.generation === '1re' || d.generation === '2e') {
    saisie.generation = d.generation;
    ajusterAffichage();
    return recalculer();
  }
  if (d.armature === 'acier' || d.armature === 'geosynthetique') {
    saisie.armature = d.armature;
    ajusterAffichage();
    return recalculer();
  }
  if (d.drainage === 'draine' || d.drainage === 'non_draine') {
    saisie.drainageF = d.drainage;
    ajusterAffichage();
    return recalculer();
  }
  if (d.cercle === 'recherche' || d.cercle === 'impose') {
    saisie.modeCercle = d.cercle;
    ajusterAffichage();
    return recalculer();
  }
  if (d.vue !== undefined) {
    vue = d.vue;
    dessinerVues();
    return renduDessin();
  }
  if (d.combinaison !== undefined) {
    combinaison = d.combinaison;
    return dessinerLits();
  }

  const action = d.action;
  if (action === undefined) return;

  if (action === 'defauts-fhwa') {
    const valeurs = defautsFhwa(saisie.phiR);
    if (valeurs === null) return montrerErreur(textes().page.defautsIllisibles);
    Object.assign(saisie, valeurs);
    ecrireSaisie();
    return recalculer();
  }
  if (action === 'enregistrer') {
    return telecharger('sol-renforce.json', serialiser(saisie), 'application/json;charset=utf-8');
  }
  if (action === 'reinitialiser') {
    saisie = saisieParDefaut();
    ecrireSaisie();
    return recalculer();
  }

  if (!action.startsWith('exporter-')) return;
  if (dernier === null) return montrerErreur(textes().messages.rienAExporter);
  const e = dernier;
  if (action === 'exporter-note') {
    const note = noteDuCalcul(e.calcul, e.resultat, cartouche());
    ouvrirOuTelecharger('sol-renforce-note.html', noteDeCalculHtml(note, STYLES_TRACE));
  } else if (action === 'exporter-coupe') {
    if (vue === null) return montrerErreur(textes().messages.rienAExporter);
    const trace = coupe(e.calcul, e.resultat, vue, optionsDessin());
    telecharger('sol-renforce-coupe.svg', svgAutonome(trace, STYLES_TRACE), 'image/svg+xml;charset=utf-8');
  } else if (action === 'exporter-resultats') {
    const blocs = [blocEntrees(e.calcul), ...blocsResultat(e.resultat)];
    telecharger('sol-renforce-resultats.csv', resultatsEnCsv(blocsEnTexte(blocs)), 'text/csv;charset=utf-8');
  }
});

exige<HTMLInputElement>('[data-role="ouvrir"]').addEventListener('change', async (e) => {
  const entree = e.target as HTMLInputElement;
  const f = entree.files?.[0];
  entree.value = '';
  if (f === undefined) return;
  try {
    saisie = relire(await f.text());
  } catch (err) {
    return montrerErreur(messageDErreur(err));
  }
  ecrireSaisie();
  recalculer();
});

const cartoucheMemorise = lireCartouche();
champProjet.value = cartoucheMemorise.projet;
champElement.value = cartoucheMemorise.element;
for (const champ of [champProjet, champElement]) {
  champ.addEventListener('input', () => {
    try {
      window.localStorage.setItem(CLE_CARTOUCHE, JSON.stringify({ projet: champProjet.value, element: champElement.value }));
    } catch {
      // Stockage indisponible : la page fonctionne sans.
    }
  });
}

ecrireSaisie();
recalculer();

// Hors navigateur (tests), pas de service worker.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void import('./pwa').then((m) => m.enregistrerServiceWorker());
}

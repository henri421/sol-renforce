# Mur en sol renforcé : plan de l'interface

Rédigé le 2026-11-07. Le noyau (`src/mur.ts`, `sol-ec7` 0.3.0) est écrit et audité. Reste la page, sur le gabarit de
`stabilite-talus` (lui-même tiré des fondations superficielles). Maquette validée le 2026-11-07 :
`plan-webaedificium/maquette-sol-renforce.html`. Les tests d'acceptation sont dans `tests/app/` ; les squelettes de
`app/src/`, `note.ts`, `export.ts`, les textes de la note et la configuration sont en place (T0).

## Spécifications

Entrée du calcul : `verifierMur(donnees)`, appelée par `verifier` dans `form.ts`, qui y ajoute la génération.
L'interface ne calcule rien : pas de `Math.tan`, `sin`, `cos`, `sqrt`, `log` dans `form.ts`, `vue.ts`, `note.ts`,
`main.ts`. Le dessin (`dessin.ts`) ne fait que des coordonnées ; la ligne des tractions vient de `longueurActive` du
noyau, les valeurs FHWA de `defautsGraviteCoherente` (via `defautsFhwa` de `form.ts`).

- **Géométrie** (m) : H, L, D, premier lit, Sv. Le nombre de lits se lit dans `r.lits`.
- **Sols** : remblai renforcé (γ, φ'), remblai retenu (γ, φ'), fondation avec boutons Drainé / Non drainé
  (γ, φ', c' ou γ, c_u).
- **Surcharges** sur toute la crête : qG et qQ (kPa).
- **Armatures** : boutons « Feuillards d'acier » / « Géosynthétique ».
  - Acier : feuillards par mètre, largeur, épaisseur (deux champs), fy, protection (liste galvanisé / non
    galvanisé, `data-champ="galvanise"`), milieu, durée d'utilisation, répartition ; gravité cohérente : K/Ka en
    tête, K/Ka à z0, z0, μpo en tête, μpo à z0 (cinq champs), bouton « Valeurs FHWA » (`data-action="defauts-fhwa"`)
    qui les remplit par `defautsFhwa(phiR)`, et la source citée (FHWA-NHI-10-024).
  - Géosynthétique : T_k, η_gs, γ_Rd,gs, R_c, k_po.
- **Cercle** : boutons « Rechercher le critique » et « Imposer » (x_c, y_c, R). La recherche ne garde que les cercles
  qui sortent au pied ou devant (le dire en une ligne).
- **Génération** : 2e par défaut (maquette), les données restent au basculement.
  - 1re : profil (valeurs recommandées ou NBN EN 1997-1 ANB:2022 ; avec l'ANB l'approche est DA1, liste grisée,
    `lireSaisie` passe DA1, et le risque apparaît), approche, et deux champs **vides** γ_Rt et γ_R,po : sans eux,
    `lireSaisie` refuse en les nommant (ni l'EN 1997-1:2004 ni l'ANB ne les donnent).
  - 2e : classe de conséquences, cas externe (a) + (b), (c), (d), approche interne (matériaux ou résistances).
- **Refus à la saisie** : nombre illisible (« nombre attendu », en nommant le champ par son libellé), φ' hors de
  ]0 ; 90[, c_u ≤ 0, γ_Rt ou γ_R,po vides en 1re. Le reste est refusé par le noyau, dont le message s'affiche tel quel
  (traduit en anglais par `phrase`).
- **Dessin** : coupe à l'échelle réelle, même échelle en x et en y : fondation, terrain devant à la cote D, massif,
  remblai retenu, parement, lits, ligne des tractions maximales, cercle et son centre, flèches des armatures coupées
  qui portent un effort, cotes H et L. Boutons de vue : une par combinaison de stabilité générale ; la gouvernante
  s'ouvre d'abord. Options « ligne des tractions » et « cotes ».
- **Verdicts**, trois groupes dans cet ordre (`data-groupe`) :
  - `stabilite` : une carte par combinaison (`data-verification` = son nom), F_d (3 décimales), taux, centre et
    rayon (2 décimales) ;
  - `interne` : une carte par combinaison, taux maximal, lit le plus chargé (h à 3 décimales), T et la résistance
    qui gouverne ;
  - `externe` : `portance`, `glissement`, `excentricite` (2e seulement), `renversement`, chacune sur sa
    combinaison la plus chargée, dont le nom figure.
  Le mot « gouvernant » une seule fois, sur la carte de `r.gouvernant`. Pas de verdict global. Le profil normatif
  (`r.profil`) et les clauses (`textes().clauses[generation]`) s'affichent. Taux > 1 : classe `depasse` ; jauge
  bornée à 100 %, taux infini affiché par `tauxAffiche` (« hors domaine »). Alertes du noyau (`r.alertes`) en clair,
  par `phrase`.
- **Volets** (`<details>`) : coefficients de chaque combinaison interne (`r.interne[k].coefficients` : nom, valeur à
  3 décimales, source), hypothèses (`textes().note.hypotheses` et la ligne des tractions de l'armature retenue) ;
  tableau des lits (`litsHtml`, combinaison interne la plus chargée par défaut, sélection par boutons), section
  après corrosion pour l'acier.
- **Sorties** : la note de calcul est le **premier** bouton (note commune d'aedificium-ui), puis SVG de la coupe,
  CSV, JSON (format `sol-renforce/1`), ouvrir. Version anglaise sous `/en/`.

Hors périmètre annoncé à l'écran : parement incliné, talus renforcés et renforcement de base, armatures de longueurs
variables, nappe phréatique dans le massif, séisme, états limites de service.

## Contrat des modules

Les tests lisent ces noms, qui ne se négocient pas. Les types sont déjà dans les squelettes.

- `app/src/form.ts` : `Saisie`, `saisieParDefaut`, `lireSaisie`, `Calcul`, `Resultat`, `verifier`, `defautsFhwa`,
  `serialiser`, `relire`. Valeurs par défaut en tête de `tests/app/form.test.ts` (μpo : `'1,802'` et `'0,727'`,
  soit `defautsFhwa('36')`, nombres écrits par `nombreAffiche`).
- `app/src/vue.ts` : `entreesParSection(calcul)` (geometrie, materiaux, charges, hypotheses),
  `blocEntrees(calcul)` (les quatre bout à bout, dans cet ordre), `blocsResultat(r)` (synthèse, puis un bloc par
  combinaison de stabilité, d'interne, d'externe, le basculement, l'excentricité en 2e), `verdictsHtml(r)`,
  `voletsHtml(r)`, `litsHtml(r, combinaison)` (une ligne `data-lit` par lit), `messageDErreur(e)` (passe par
  `phrase`). Symboles imposés : `H`, `L`, `D`, `S_v`, `cercle` (imposé seulement) en géométrie ; `f_y` (acier) ou
  `T_k` (géosynthétique) en matériaux, `c_u` pour la fondation non drainée ; `q_G`, `q_Q` en charges ; `γ_Rt` et
  l'approche (1re) ou `CC2` (2e) en hypothèses. Symboles uniques.
- `app/src/dessin.ts` : `vuesDisponibles(r)`, `vueGouvernante(r)`, `coupe(calcul, r, vue, { cotes, tractions })`.
  Classes imposées en tête de `tests/app/dessin.test.ts`. L'arc va du point de sortie à l'entrée sur le terrain
  (tranches de `resultat.tranches` : `x`, `b`, `ySol`, `yBase`) ; les flèches viennent de `resultat.renforts`
  (`y`, `xCoupe`, `T`).
- `app/src/note.ts` : **écrit**, ne pas modifier. Il lit `entreesParSection`, `blocsResultat`, `coupe`,
  `vueGouvernante`, et dans `textes.ts` les parties `clauses`, `verifications`, `note`.
- `app/src/export.ts` : **écrit** (`STYLES_TRACE`, classes du dessin). `app/src/textes.ts` : `messages`, `clauses`,
  `verifications`, `note` écrits ; ajouter le reste à FR et à EN, et les règles de `phrase` en T5.

Dessin et mise en page suivent la maquette, lue par morceaux : styles lignes 7 à 97, saisie 100 à 171, coupe 174 à 233,
volets 235 à 276, verdicts et sorties 279 à 298.

## Tâches

| Tâche | Fichiers | Gabarit à lire | Filtre de test | Dépend de | Qui |
| --- | --- | --- | --- | --- | --- |
| T0 | `tests/app/*`, squelettes, `note.ts`, `export.ts`, textes de la note, config | | | | fait |
| T1 | `app/index.html`, `form.ts`, `main.ts` | `stabilite-talus/app/index.html`, `app/src/form.ts`, `app/src/main.ts` | `form.test` | T0 | |
| T2 | `vue.ts`, `textes.ts` | `stabilite-talus/app/src/vue.ts`, `textes.ts` | `vue.test` | T1 | |
| T3 | `dessin.ts`, fin de `style.css` | la maquette, `stabilite-talus/app/src/dessin.ts` | `dessin.test`, puis `note.test` et `page.test` | T2 | |
| T4 | `app/en/index.html`, `textes.ts` (EN, `phrase`) | `stabilite-talus/app/en/index.html` | `anglais.test` | T3 | |
| T5 | icônes, README, lock, workflow, publication | | | T4 | conception |
| T6 | carte et menu du hub ; renvoi du module sol renforcé de Fondbis | | | T5 | conception |

`app/src/style.css` et `pwa.ts` sont copiés de la stabilité de talus : n'ajouter à la fin de `style.css` que les règles
manquantes (la classe `.terrain` y remplit une surface : le terrain dessiné s'appelle donc `ligne-terrain`).
`page.test` lit `main.ts` tel qu'il sera à la fin : il ne passe qu'après T3 (main.ts appelle `coupe`, `litsHtml`…) ;
écrire `main.ts` complet dès T1.

## Commandes

Depuis le dépôt, une tâche (remplacer le filtre), puis tout, puis le typage :

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs . form.test
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs .
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/typecheck.mjs .
```

Résultat attendu à la fin de T4 : tous les tests réussis (26 du noyau et ceux de `tests/app/`), 0 erreur de typage.
Avant T1, les fichiers de `tests/app/` ne se chargent pas (les squelettes lèvent « a ecrire »). Les tests d'interface
n'ont encore jamais tourné sur du code : un test qui paraît faux se signale, il ne se corrige pas.

## Interdits pour l'exécutant

Modifier `src/`, `tests/`, `app/src/note.ts`, `app/src/export.ts`, les parties `messages`, `clauses`,
`verifications`, `note` de `textes.ts`, `sol-ec7`, `stabilite-talus`, `mur-en-l`, `_banc-local` ; calculer dans
`app/` ; ajouter une dépendance ; parcourir le dépôt au-delà des fichiers nommés ; `git push`, `git tag`. Pas de fond
noir ni d'interface façon tableur. Une tâche par lancement ; consigner dans `HANDOFF.md` (fichiers, décisions,
points douteux, statut des tests). Si un test paraît faux, s'arrêter sur cette tâche et le signaler dans `HANDOFF.md`.

## Publication (à faire dans cet ordre)

1. L'utilisateur crée, vide et public, `henri421/sol-renforce`.
2. `sol-ec7` : pousser `main`, poser et pousser le tag `v0.3.0`.
3. `sol-renforce` : lock (copié de la stabilité de talus, entrée `sol-ec7` passée à v0.3.0), workflow `pages.yml`
   copié du talus, pousser `main` ; l'utilisateur active Pages (source GitHub Actions).
4. Une fois la page en ligne : carte du hub, puis renvoi du module sol renforcé de Fondbis vers le nouvel outil.

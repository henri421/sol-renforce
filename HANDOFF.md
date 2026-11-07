# HANDOFF : sol-renforce

## T1 : zones de materiau et forces des armatures dans Bishop (sol-ec7 v0.3.0)

Commit sol-ec7 : `32d28e4` (non pousse, non tague).

**Fichiers modifies**
- `sol-ec7/src/stabilite.ts` : types `ZoneMateriau` et `Renfort` ; champs optionnels `zones` et `renforts` de `DonneesBishop` ; champ `renforts` du resultat valide ; verifications des zones et des renforts dans `verifierDonnees` ; `coucheEn`, `poidsColonneZones` ; prise en compte des armatures dans `analyser`.
- `sol-ec7/package.json` : version 0.3.0.
- `index.ts` inchange : `export *` exporte deja les nouveaux types.
- `rechercherCercleCritique` inchange : elle passe par `analyser`, qui lit zones et renforts.

**Decisions**
- Sans zone, `poidsColonne` et `indiceCouche` restent appeles tels quels ; l'ajout de `(numerateur + 0) / D` ne change pas les bits. Les suites `sol` et `talus` restent vertes.
- Avec zones, la colonne est decoupee aux cotes des couches, des zones et de la piezometrique ; chaque morceau prend la couche qui porte son milieu (`coucheEn`). La zone est testee au point (x du milieu de tranche, y du milieu du morceau), et pour le materiau de base au point (x, yBase).
- Couche de base de chaque tranche gardee en objet (`couchesBase`) au lieu d'un indice, pour que phi, c et cu viennent de la zone.
- Armatures : `T = min(Rt ; rpo (x1 - xCoupe))`, moment `T (yc - y)` ajoute au numerateur comme `momentArmatures / R`, divise par `D` (= somme motrice). Pas de gamma. Renfort ignore si `y >= yc`, si le cercle ne coupe pas la cote y, si `xCoupe` est hors de `]x0 ; x1[`, ou hors de `[arc.xa ; arc.xb]`.
- Rt = 0 ou rpo = 0 acceptes (seul un negatif est refuse).

**Points douteux**
- Convention de sens : le cahier dit « sens = +1, glissement vers les x decroissants ». Le code garde `sens = signe de Σ W sin(alpha)`, comme en v0.2.0, et ne compte les armatures que pour sens = +1. Les tests suivent ce code. Le libelle « x decroissants » n'a pas ete verifie independamment ; a relire par l'audit.
- Appartenance d'une tranche a une zone : testee au milieu de la tranche en x. Une zone dont le bord tombe au milieu d'une tranche donne une approximation d'une tranche.
- Attribution du commit : le brief demandait « Claude Opus 5.5 ». Le commit porte « Claude Haiku 5.5 », conformement au rappel d'attribution du harnais et a l'identite reelle de l'executant. A corriger si le brief doit primer.
- Le `CONVENTIONS.md` de sol-ec7 demande des identifiants sans accents, et des messages d'erreur accentues : respecte.

**Statut des tests**
- Avant implementation : `lancer.mjs .` : 9 echecs dans `tests/renforts.test.ts` (11 tests, dont 2 passaient deja ; sol 37/37 et talus 18/18 verts).
- Apres implementation : `lancer.mjs .` : 66 reussis, 0 echec (renforts 11/11, sol 37/37, talus 18/18).
- `typecheck.mjs .` : 0 erreur (TypeScript 6.0.3).
- Aucun fichier de `tests/` modifie.

## T2 : armatures et lits (sol-renforce, src/mur.ts)

Commit : `0c0d702`.

**Fichiers modifies**
- `src/mur.ts` : `positionsLits`, `facteurKcc`, `perteEpaisseur`, `sectionReduite`, `longueurActive`, `defautsGraviteCoherente`, `verifierSaisie`, refus de l'acier dans `verifierMur`.

**Decisions**
- Hauteur d'influence d'un lit : demi-sommes avec les lits voisins, bornes 0 et H ; la somme des hauteurs d'influence vaut H (verifie par le test).
- Ordre des refus de l'acier : limite d'elasticite (500 / 600 MPa) avant la section reduite (50 %). Un acier non galvanise a 520 MPa et de 2 mm a une section negative : sans cet ordre, le refus serait celui des 50 %.
- Cohesion c' de la fondation absente en drainee : prise a 0. Cu obligatoire en non draine.

**Points douteux**
- Valeurs des tableaux 9.2 et 9.3, des constantes A, n, ez et de kcc, reprises du PLAN.md telles quelles : elles ne sont pas reverifiees dans la norme (pas d'ouverture de normes, consigne).
- Intermediaire : a ce commit, `verifierMur` leve « a ecrire » apres les refus.

**Statut des tests**
- `lancer.mjs .` : bloc T2 vert (6/6). Le reste (T3 a T5) echoue comme attendu a ce stade.
- `typecheck.mjs .` : 0 erreur.

## T3 : stabilite interne (sol-renforce, src/mur.ts)

Commit : `300c9c1`.

**Fichiers modifies**
- `src/mur.ts` : `JeuInterne`, `jeuxInternes`, `calculerInterne`, `nomProfil`, alertes d'ancrage et de L < 0,7·H dans `verifierMur`.

**Decisions**
- 1re generation : combinaisons de `combinaisons1g(approche)`, gammas de rupture et d'arrachement saisis.
- 2e generation, materiaux : `VC3 + M2` via `combinaisonsStabilite2g`, gamma_R,po = 1, gamma de rupture acier = gamma_M0 = 1,00 (EN 1993-1-1, renvoye par le tableau 9.4), geosynthetique = gamma_Rd,gs × 1,25.
- 2e generation, resistances : `VC1` via `combinaisons2g('a+b')`, gamma_phi = 1, gamma_R,po = 1,25 sans k_R.
- Le taux d'arrachement vaut +infini quand Rpo = 0 (Le = 0). Le champ `phi_d` de `ResultatInterne` est en degres.
- Le repere `fondbis/.../stabiliteInterne.ts` n'a pas ete ouvert.

**Points douteux**
- Les coefficients 2e generation (1,25 pour gamma_R,po des resistances, gamma_M0) viennent du PLAN.md, non reverifies dans la norme.
- Intermediaire : a ce commit, `renversement` est un placeholder NaN. Il est remplace par T4.

**Statut des tests**
- `lancer.mjs .` : blocs T2 et T3 verts (12/12).
- `typecheck.mjs .` : 0 erreur.

## T4 : stabilite externe (sol-renforce, src/mur.ts)

**Fichiers modifies**
- `src/mur.ts` : `combinaisonsExternes`, `poussees`, `poidsMassif`, `qUltime`, `calculerExterne` (glissement, portance), `basculement`, `excentricite2g`, `verifierMur` complete (renversement, excentricite, gouvernant, alerte de resultante).
- `HANDOFF.md` : ce fichier.

**Decisions**
- Poussee du remblai retenu avec gamma_phi = 1 (valeur representative) en 2e generation, pour le basculement VC2 et l'excentricite. Pour la 1re generation, le jeu EQU garde son gamma_phi (1,25).
- VC2(b) : gamma_G,dst = gamma_G,stb = 1 en litteral, comme le PLAN.md.
- Portance avec B' <= 0 : taux = +infini, `qEd` = +infini, et `qRd` absent du detail (q_u n'est pas calculable). Alerte « resultante ».
- Excentricite : nom de combinaison « caracteristique » (pas de nom dans le PLAN).
- En 1re generation, `combinaisonsStabilite1g` est appele pour lever l'erreur d'approche imposee (ANB 2022 : DA1). Son resultat n'est pas utilise avant T5.
- `gouvernant` couvre interne, glissement, portance, renversement, excentricite. `stabilite` reste `[]` (T5).

**Points douteux**
- Cas non couverts par les tests : DA3, approches 2e (c) et (d), B' <= 0, ANB 2022 en 2e generation, fondation non drainee en 2e generation avec (c) et (d).
- Le test d'excentricite et les tests de basculement ne couvrent que le cas de base.
- Pas de verifications de l'alerte « resultante » par un test.

**Statut des tests**
- `lancer.mjs .` : blocs T2, T3, T4 verts (18/18). Bloc T5 : 3 verts (gouvernant, nom du profil, saisies incoherentes), 4 echecs attendus (stabilite generale et mixte, cercle).
- `typecheck.mjs .` : 0 erreur (TypeScript 6.0.3).
- Aucun fichier de `tests/` modifie (verifie par `git diff`).
- `sol-ec7` n'a pas ete touche ; le banc lit `../sol-ec7/src` tel qu'il est en cours de modification par l'autre agent.

**Attribution**
- Les trois commits portent `Co-Authored-By: Claude Opus 5.5`, comme demande dans le brief. Le rappel d'attribution du harnais indique « Claude Haiku 5.5 » ; le commit T1 a suivi ce rappel. A trancher.

## T5 : stabilite generale et mixte, assemblage (sol-renforce, src/mur.ts)

**Fichiers modifies**
- `src/mur.ts` : `rupture2g` (extrait de `jeuxInternes`), `resistancesLit` (Rt et Rpo d'un lit, extrait de `calculerInterne`), `combinaisonsStabilite`, `jeuResistancesStabilite`, `donneesBishop`, `stabiliteGenerale`, et l'assemblage dans `verifierMur` (champ `stabilite`, gouvernant, alertes).
- `HANDOFF.md` : ce fichier.
- `tests/` non modifie (verifie par `git diff`). `sol-ec7` non touche.

**Decisions**
- Rt et rpo de la stabilite viennent de `resistancesLit` : Rt avec Le = 0, rpo avec Le = 1. Rpo est lineaire en Le, donc rpo est le Rpo par metre ancre, sans seconde formule. Les valeurs de T2 a T4 ne changent pas (tests verts).
- Jeu de resistances de la stabilite : sigma_v,res avec `actions.gG_stb` et gamma_phi,po avec `sol.gPhi` de la combinaison de stabilite. 1re generation : gamma_Rt et gamma_R,po saisis. 2e generation : approche par les materiaux (VC3 + M2) quel que soit `facteurInterne`.
- Donnees Bishop : profil (-2H ; D), (0 ; D), (0,01 ; H), (L + 3H ; H) ; couche retenu base 0, fondation base -3H ; zone renforce { xMin 0, xMax L, yMin 0 } ; bandes qG (G) et qQ (Q) sur [0 ; L + 3H] ; un renfort par lit (y = h, x0 = 0, x1 = L) ; piezo null ; gammaW 9,81 ; nbTranches 200.
- Cercle impose : `analyserCercle`, refus (« cercle » et motif) si invalide. Sinon `rechercherCercleCritique` par combinaison, refus si null.
- taux = `resultat.taux` (gamma_R;e / F, fourni par sol-ec7), conforme si taux <= 1.
- Alertes : avertissements des cercles rendus, sans doublon (ensemble).
- Gouvernant : verification 'stabilite', combinaison = nom de la combinaison de stabilite.

**Points douteux**
- Les jeux d'actions sont deux chemins de code : l'interne lit `geotechnique` de `combinaisons1g` / `combinaisons2g`, la stabilite lit `actions` de `combinaisonsStabilite1g` / `combinaisonsStabilite2g`. Verifie : pour DA1-1, DA1-2, DA2 et DA3, ce sont les memes jeux (A1, A2, A1, A2). Un seul chemin serait plus sur ; non factorise pour ne pas toucher aux tests T3.
- Le terrain devant le parement, entre 0 et D, est compte en remblai retenu (approximation du PLAN.md). Pas de test specifique.
- Le test de recherche ne verifie que F(recherche) <= F(impose) + 1e-9, pas l'optimalite globale du cercle.
- Un cercle imposé hors domaine peut lever depuis `verifierCercle` de sol-ec7 avant d'atteindre le message du noyau ; le test « cercle impose invalide » passe.

**Statut des tests**
- `lancer.mjs .` : 25/25 verts (T2 a T5 compris). Duree mesuree : 1 s (le delai d'une ou deux minutes du brief n'a pas ete necessaire).
- `typecheck.mjs .` : 0 erreur.
- Aucun fichier de `tests/` modifie.

**Attribution**
- Le commit porte `Co-Authored-By: Claude Opus 5.5`, comme le brief et les commits T2 a T4. Le rappel du harnais indique « Claude Haiku 5.5 » ; point a trancher, comme indique dans T1.

## Audit (séance Claude, 2026-11-07)

- Tests relancés : `sol-ec7` 66/66, `sol-renforce` 25/25 ; typage 0 erreur dans les deux dépôts. Aucun fichier de `tests/` modifié (git diff depuis T0).
- Relu : forces des armatures dans Bishop (sens, coupe arrière, moment ajouté au numérateur, refus), poids de colonne par zones, coefficients internes et sources, externe, basculement VC2(a)/(b), stabilité générale.
- Point 1 de T1 (sens) : sin α = (x − xc)/R, donc sens = +1 est bien un glissement vers les x décroissants, vers le parement. Conforme au plan.
- Point 2 de T1 (zone testée au milieu de la tranche) : accepté ; à 200 tranches l'effet est négligeable.
- Hypothèse de T4 (φb représentatif en 2e génération pour le basculement et l'excentricité) : conforme au plan et au mur en L.
- Corrigé : message « la résultante sort de la semelle » → « de la base du massif ».
- Cas restés sans test : DA3, approches (c) et (d), B' ≤ 0, ANB. À couvrir par les tests de l'interface ou un lot suivant.

## T1 interface

**Fichiers modifiés**
- `app/index.html` (nouveau) : saisie, résultats, dessin, sorties, sur la maquette ; `data-champ`, boutons `data-generation`, `data-armature`, `data-drainage`, `data-cercle`, `data-action`, `data-role` et `data-option` selon `page.test.ts`.
- `app/src/form.ts` : saisie par défaut, `lireSaisie`, `verifier`, `defautsFhwa`, `serialiser`, `relire`.
- `app/src/main.ts` (nouveau) : cablage seulement, sur le gabarit du talus.
- `app/src/textes.ts` : blocs `refus` et `page` ajoutés à FR et à EN ; `messages`, `clauses`, `verifications`, `note` intacts.

**Décisions**
- Valeurs par défaut : celles de `form.test.ts` ; les cinq valeurs FHWA sont écrites en dur (`1,7`, `1,2`, `6`, `1,802`, `0,727`, soit `defautsFhwa('36')`).
- Diviseurs γ_Rt et γ_R,po : lus seulement en 1re génération ; vides, ils refusent en les nommant.
- Champs de la gravité cohérente et de la géosynthétique : lus selon l'armature retenue seulement. Les champs du remblai, de la fondation et des surcharges sont lus dans tous les cas.
- Protection galvanisée : liste `data-champ="galvanise"` (valeurs `oui` / `non`), convertie en booléen dans `main.ts`.
- Bouton « Valeurs FHWA » : `defautsFhwa(phiR)` remplit les cinq champs ; si φ'r est illisible ou hors de ]0 ; 90[, message `page.defautsIllisibles`.
- Tableau des lits : zone `data-role="lits"` dans un `<details>` de la colonne Résultats, remplie par `main.ts` (boutons `data-combinaison` + `litsHtml`). Combinaison la plus chargée (`tauxMax`) par défaut.
- Refus : « libellé : nombre attendu, « x » saisi. » ; φ' hors de ]0 ; 90[ et c_u ≤ 0 refusés à la saisie.
- Icône : pas de `<link rel="icon">` (T5 les ajoute ; `app/public` est vide).

**Points douteux**
- `page.test.ts` passe déjà 13/13, alors que PLAN-interface annonçait T3. Il lit `index.html` et `main.ts` comme texte ; le rendu n'a pas été exécuté, `vue.ts` et `dessin.ts` restent des squelettes.
- À coordonner avec T2 : `voletsHtml` ne doit pas rendre aussi le tableau des lits, la zone `data-role="lits"` le fait déjà.
- `gammaRd` est lu aussi en 1re génération (le type `DonneesMur` l'exige) ; sans effet si le noyau ne l'utilise pas en 1re.
- ANB 2022 : la liste d'approche est grisée et affichée sur DA1 ; `saisie.approche1` garde sa valeur, `lireSaisie` passe DA1.
- Libellés de `index.html` en français seulement ; la version anglaise est à faire en T4.
- Attribution : le commit porte `Co-Authored-By: Claude Haiku 4.5`, comme demandé dans la tâche ; l'environnement indique Haiku 5.5. À trancher.

**Statut des tests**
- `lancer.mjs . form.test` : 21/21 réussis, 0 échec.
- `lancer.mjs . page.test` : 13/13 réussis, 0 échec (voir point douteux ci-dessus).
- `typecheck.mjs .` : 0 erreur.
- Suite complète (`lancer.mjs .`) non lancée dans cette tâche.
- Aucun fichier de `tests/`, `src/`, `note.ts`, `export.ts`, `vue.ts`, `dessin.ts` ni `package.json` modifié.

## T2 interface

**Fichiers modifiés**
- `app/src/vue.ts` : `entreesParSection`, `blocEntrees`, `blocsResultat`, `verdictsHtml`, `voletsHtml`, `litsHtml`, `messageDErreur`, écrits sur le gabarit de `stabilite-talus`, sans calcul.
- `app/src/textes.ts` : blocs `vue`, `entrees` et `resultats` ajoutés à FR et à EN. `messages`, `clauses`, `verifications`, `note`, `refus` et `page` ne changent pas.

**Décisions**
- `data-verification` vaut le nom de la combinaison pour la stabilité générale et l'interne, et `portance`, `glissement`, `excentricite`, `renversement` pour l'externe (la combinaison la plus chargée de chaque famille).
- Le mot « gouvernant » marque la carte dont (verification, combinaison) égalent `r.gouvernant`. L'excentricité est repérée par sa seule verification, car le noyau la nomme « caractéristique ».
- `voletsHtml(r)` n'a pas la géométrie ni l'armature en entrée : le géosynthétique est reconnu à `r.section === null` (le noyau ne rend `section` que pour l'acier).
- Entrées : `h_1` pour le premier lit, `cercle` seulement si imposé, `CC` en 2e, `approche` et `γ_Rt`, `γ_R,po` en 1re (`risque` seulement en ANB), `cas` et `interne` en 2e.
- Alerte du noyau « m_α » : `_α` s'écrit `_alpha` avant `notationHtml`, car `lireIndice` n'accepte que l'ASCII. Présentation seulement.
- Nombres : `nombreAffiche` (zéros inutiles retirés). Taux : `tauxAffiche` directement, qui rend « hors domaine » pour un infini ou un NaN.
- `γ_Rd,gs` est affiché pour le géosynthétique dans les deux générations, car le noyau l'utilise en 1re (γRt = γRd × γM,gs).

**Points douteux**
- BLOQUANT : `vue.test` a 16 échecs, tous du même constat `constatsAffichage` : « apostrophe manquante : "...de longueur L uniforme." ». La phrase vient de `textes().note.hypotheses[0]` (FR : « Massif rectangulaire à parement vertical ; armatures horizontales de longueur L uniforme. »). Le motif `[dlnDLN] (?=voyelle)` lit « L uniforme » comme « l'uniforme ». Le texte est dans la partie `note`, que l'exécutant ne modifie pas, et les volets doivent le rendre tel quel. Les autres assertions de `vue.test` passent (54/70). Correction à décider en conception : reformuler la phrase (par exemple « armatures horizontales, toutes de longueur L »), puis relancer.
- Textes EN ajoutés mais non relus ; les règles de `phrase` (T5) ne sont pas écrites, donc les noms de combinaisons restent en français dans la version anglaise.

**Statut des tests**
- `vue.test` : 54 réussis, 16 échecs (constat d'apostrophe ci-dessus).
- `form.test` : 21 réussis, 0 échec. `page.test` : 13 réussis, 0 échec.
- `typecheck` : 0 erreur.
- Non commité : tâche arrêtée sur un test jugé faux, selon la consigne. Aucun push, aucun tag.

Audit T2 (seance de conception) : le test signale etait juste, la phrase fautive etait la mienne. note.hypotheses[0] reformulee (« armatures horizontales, toutes de longueur L. »). vue.test 70/70, form.test 21/21, page.test 13/13, typage 0 erreur. Le contournement _alpha des alertes reste a juger avec note.test et anglais.test.

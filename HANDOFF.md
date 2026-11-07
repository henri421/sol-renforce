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

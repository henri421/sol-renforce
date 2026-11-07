# Mur en sol renforcé : plan du noyau

Rédigé le 2026-11-07. Troisième outil de la refonte de Fondbis, après les fondations superficielles et la stabilité
de talus. Décisions de l'utilisateur, le 2026-11-07 :

- mur vertical en sol renforcé seulement ;
- méthodes de l'EN 1997-3:2025, clause 9 et annexe F :
  - géosynthétiques : coin de Rankine (F.3.3) ;
  - feuillards d'acier : gravité cohérente (F.3.2), avec un profil K/Ka modifiable dont les valeurs par défaut,
    citées, viennent de la FHWA ;
  - stabilité mixte : Bishop avec les forces des armatures (F.3.1) ;
- 1re et 2e générations ; en 1re génération, les coefficients internes sont saisis par l'utilisateur, sans valeur
  par défaut.

Ce lot couvre l'extension du paquet `sol-ec7` (v0.3.0) et le noyau de l'outil. L'interface aura son propre plan,
écrit après l'audit de ce lot et la validation d'une maquette.

Deux dépôts voisins : `Github\sol-ec7` et `Github\sol-renforce`.

## Spécifications

**Objectif.** Vérifier un mur en sol renforcé à parement vertical, en déformation plane, par mètre de parement :

- stabilité interne : rupture et arrachement de chaque lit ;
- stabilité externe : glissement, portance, basculement, et excentricité en 2e génération ;
- stabilité générale et mixte : cercles de Bishop qui traversent ou contournent le massif.

**Modèle** (repère : pied du parement en (0 ; 0), x vers l'arrière, base du massif à y = 0) :

- **Massif.** Remblai renforcé (γr, φr) de x = 0 à x = L et de y = 0 à y = H. Remblai retenu (γb, φb) derrière le
  massif. Sol de fondation sous y = 0, drainé (φ', c') ou non drainé (c_u). Pas d'eau : hors périmètre.
- **Surcharges.** qG (permanente) et qQ (variable), uniformes sur toute la crête, au-dessus du massif comme du
  remblai retenu.
- **Lits.** Hauteurs h_k = premierLit + k·Sv, tant que h_k < H. Hauteur d'influence : de la base (lit du bas) ou du
  milieu avec le lit inférieur, jusqu'au milieu avec le lit supérieur ou jusqu'à la crête (lit du haut). On a z = H − h.

**Stabilité interne, pour chaque lit et chaque combinaison.** Les combinaisons, leurs actions (γG, γQ, γG,stb), le
coefficient γφ et les diviseurs de résistance sont donnés dans le tableau ci-dessous.

- Angle de calcul et coefficient de poussée : φ_d = atan(tan φr / γφ) et Ka = tan²(45° − φ_d/2).
- Coefficient K au lit :
  - acier : K = Ka · K/Ka(z), avec K/Ka(z) = K/Ka₀ + (K/Ka_z0 − K/Ka₀)·min(z, z0)/z0 ;
  - géosynthétique : K = Ka.
- Contrainte verticale de calcul : σv = γG·(γr·z + qG) + γQ·qQ.
- Effort dans le lit : T = K·σv·Sv.
- Longueur active, mesurée depuis le parement, avec la valeur **caractéristique** de φr :
  - acier : La = 0,6·h si h ≤ H/2, sinon 0,3·H ;
  - géosynthétique : La = h·tan(45° − φr/2).
- Longueur d'ancrage : Le = max(0 ; L − La).
- Contrainte verticale résistante : σv,res = γG,stb·(γr·z + qG). La surcharge variable n'y entre pas.
- Résistance à l'arrachement, (9.8) à (9.10), (9.19) à (9.21) :
  - acier : Rpo = n·2·(b/1000)·Le·(μ(z)/γφ,po)·σv,res / γR,po, avec
    μ(z) = μpo,0 + (μpo,z0 − μpo,0)·min(z, z0)/z0 ;
  - géosynthétique : Rpo = 2·Rc·Le·kpo·(tan φr/γφ,po)·σv,res / γR,po.
- Résistance à la rupture :
  - acier : Rt = n·Ar·fy/1000 / γ ;
  - géosynthétique : Rt = ηgs·Tk / γ.
- Taux du lit : max(T/Rt ; T/Rpo). Si Le = 0 : Rpo = 0, taux = +∞, et une alerte « ancrage ».

| Génération | Combinaisons internes | Actions | γφ (Ka) | γφ,po | γ (rupture) | γR,po |
|---|---|---|---|---|---|---|
| 1re | celles de `combinaisons1g(approche)` : DA1-1, DA1-2 / DA2 / DA3 | jeu `geotechnique` | `sol.gPhi` | `sol.gPhi` | gRt saisi | gRpo saisi |
| 2e, matériaux | `VC3 + M2` | γG,VC3, γQ,VC3, γG,fav (sans k_F) | γM2·k_M | γM2·k_M | acier γM0 = 1,00 ; géosynthétique γRd·1,25 | 1 |
| 2e, résistances | `VC1` | γG·k_F, γQ·k_F, γG,fav | 1 | 1 | acier γM0 = 1,00 ; géosynthétique γRd·1,25 | 1,25 (sans k_R) |

Sources à porter dans `coefficients` :

- tableau 9.4 de l'EN 1997-3:2025 : γM,gs = 1,25, γR,po = 1,25, actions VC3 + M2 (matériaux) ou VC1 (résistances) ;
- γM0 = 1,00 : EN 1993-1-1, valeur recommandée, renvoyé par le tableau 9.4 ;
- 1re génération : « coefficient saisi par l'utilisateur (aucune valeur dans l'EN 1997-1:2004 ni l'ANB 2022) ».

**Corrosion de l'acier** (EN 1997-3:2025, 9.3.4) :

- Δe = kcc·max(A·T^n − ez ; 0), en µm, rendu en mm par face.
- Tableau 9.2 (les valeurs ci-dessous sont celles de la norme) :
  - A = 25 µm (terrestre) ou 40 µm (eau douce), galvanisé ou non ;
  - n = 0,65 / 0,60 (galvanisé, terrestre / eau douce) et 0,80 / 0,75 (non galvanisé) ;
  - ez = 70 µm si galvanisé, 0 sinon.
- Tableau 9.3, selon l'épaisseur e :
  - e ≤ 6 mm : kcc = 1,7 (galvanisé, uniforme), 2,0 (galvanisé, non uniforme), 2,5 (non galvanisé, uniforme),
    3,0 (non galvanisé, non uniforme) ;
  - e ≥ 12 mm : kcc = 1,0 ;
  - entre les deux : interpolation linéaire.
- Section réduite sur tout le pourtour : Ar = (b − 2Δe)·(e − 2Δe), et A0 = b·e.
- **Refus** (exception) dans ces cas :
  - Ar < 0,5·A0 (message contenant « 50 % ») ;
  - fy > 500 MPa sans galvanisation (message contenant « 500 ») ;
  - fy > 600 MPa avec galvanisation (message contenant « 600 »).

**Stabilité externe**, avec les combinaisons de `combinaisons1g(approche)` ou de
`combinaisons2g(approche2e, cc)`, en utilisant le jeu `geotechnique`, le jeu `sol` et le jeu `resistance` :

- **Poussée du remblai retenu.** φb,d = atan(tan φb/γφ), Ka,b = tan²(45° − φb,d/2), horizontale (Rankine) :
  - PG1 = ½·Ka,b·γb·H², à H/3 ;
  - PG2 = Ka,b·qG·H, à H/2 ;
  - PQ = Ka,b·qQ·H, à H/2.
- **Poids.** W0 = γr·H·L + qG·L.
- **Glissement** à la base :
  - Hd = γG,dst·(PG1 + PG2) + γQ,dst·PQ et Vd = γG,stb·W0 ;
  - fondation drainée : Rd = Vd·min(tan φr, tan φf)/γφ / γRh ;
  - fondation non drainée : Rd = min(c_u/γcu·L ; Vd·tan φr/γφ) / γRh ;
  - `detail` : `Hd`, `Vd`, `Rd`.
- **Portance :**
  - Vd = γG,dst·W0 + γQ,dst·qQ·L ;
  - Md = γG,dst·(PG1·H/3 + PG2·H/2) + γQ,dst·PQ·H/2 ;
  - e = Md/Vd et B' = L − 2e ;
  - qEd = Vd/B' et qRd = q_u/γRv ;
  - q_u vient de `sol-ec7` :
    - drainée : `portanceDrainee1g` ou `portanceDrainee2g`, avec Bp = B', Lp = null, T = Hd, N = Vd,
      φ et c de calcul, gammaEff = γf, q = γf·D, et en 2e génération Df = D ;
    - non drainée : `portanceNonDrainee1g` ou `portanceNonDrainee2g`, avec cu = c_u/γcu, q = γf·D, et en
      2e génération B = L, Df = D ;
  - si B' ≤ 0 : taux = +∞ et une alerte « résultante » ;
  - `detail` : `e`, `Bp`, `Vd`, `Hd`, `qEd`, `qRd`.
- **Basculement** autour du pied, avec Mdst = γG,dst·(PG1·H/3 + PG2·H/2) + γQ,dst·PQ·H/2 et
  Mstb = γG,stb·W0·L/2 :
  - 1re génération : jeu `EQU` du profil (actions et γφ sur φb), nom `EQU` ;
  - 2e génération : φb représentatif, et deux cas dont on garde le plus défavorable (comme `mur-en-l`) :
    - `VC2(a)` : γG,dst = k_F·γG, γG,stb = γG,stb,VC2(a) = 1,15 (poids et surcharge du massif, même source que la
      poussée), γQ = k_F·γQ ;
    - `VC2(b)` : γG,dst = γG,stb = 1, γQ = k_F·γQ.
- **Excentricité**, en 2e génération seulement (EN 1997-3:2025, tableau 5.3), avec φb représentatif et les
  valeurs caractéristiques :
  - eG = (PG1·H/3 + PG2·H/2)/W0, limite L/6 ;
  - eGQ = eG + PQ·(H/2)/W0, limite L/3 ;
  - taux = max des deux rapports.

**Stabilité générale et mixte**, avec `combinaisonsStabilite1g` ou `combinaisonsStabilite2g` et l'`analyserCercle`
étendu de T1 :

- **Profil** : (−2H ; D), (0 ; D), (0,01 ; H), (L + 3H ; H). Le parement est incliné de 1 cm sur H, parce que les x
  doivent croître strictement.
- **Couches et zone :**
  - couches : remblai retenu (base 0), fondation (base −3H), avec γsat = γ ;
  - zone : { xMin 0, xMax L, yMin 0, remblai renforcé } ;
  - le terrain devant le parement, entre 0 et D, est compté en remblai retenu (approximation déclarée).
- **Bandes** : qG et qQ sur [0 ; L + 3H].
- **Renforts**, un par lit : y = h, x0 = 0, x1 = L.
  - Rt est la résistance de calcul de la combinaison ;
  - rpo est l'arrachement par mètre de longueur ancrée, selon la formule de Rpo sans Le, avec le γφ de la
    combinaison (`sol.gPhi`) et, en 1re génération, gRpo ;
  - en 2e génération, ces valeurs viennent de l'approche par les matériaux, quel que soit `facteurInterne`
    (clause 4).
- **Cercle :**
  - cercle imposé : on l'analyse, et un cercle invalide est refusé par un message contenant « cercle » et le motif ;
  - sinon `rechercherCercleCritique` par combinaison, avec `xGaucheMax: 1e-4` (ajout de l'audit : sans lui, la
    recherche trouve une lamelle de 3 cm derrière le parement, F = 0,17) ; si la recherche n'aboutit pas, refus.
- **Tranches** : `nbTranches` = 200 pour l'analyse comme pour la recherche. À 50 tranches, la colonne du parement
  presque vertical donne un écart de 0,6 % sur F.
- **Taux** = γR;e/F.

**Assemblage.**

- `gouvernant` = le taux le plus élevé parmi `interne` (tauxMax), `glissement`, `portance`, `renversement`,
  `excentricite` et `stabilite`. Ces noms sont exactement ceux du champ `verification`.
- `alertes`, sans doublon :
  - Le = 0 sur un lit (« ancrage ») ;
  - L < 0,7·H (« L < 0,7·H : en dessous de la longueur minimale usuelle (FHWA) ») ;
  - B' ≤ 0 ;
  - avertissements des cercles rendus.
- `profil` = `profil1g().nom`, `profilAnb2022(risque).nom` ou `profil2g().nom`.

**Refus à la saisie** (exception, message en français) :

- H, L, Sv, premierLit ≤ 0 ; premierLit ≥ H ; D < 0 ou D ≥ H ;
- γ ≤ 0 ;
- φ hors de ]0, 90[ (message contenant « φ ») ; c < 0 ; c_u ≤ 0 ;
- qG < 0 ou qQ < 0 ;
- armature :
  - n ≤ 0, b ≤ 0, e ≤ 0, fy ≤ 0, dureeVie ≤ 0 ;
  - K/Ka₀, K/Ka_z0, z0, μpo,0 ou μpo,z0 ≤ 0 ;
  - Tk ≤ 0, ηgs ou Rc hors de ]0, 1], γRd < 1, kpo ≤ 0 ;
- 1re génération sans `coefficientsInternes1g` (message contenant « coefficients ») ou avec gRt, gRpo ≤ 0 ;
- profil ANB avec une autre approche que DA1 : c'est `sol-ec7` qui lève.

**Hors périmètre** (à annoncer à l'écran) :

- talus renforcés, renforcement de base, veneer ;
- grilles et treillis d'acier ; armatures de longueur variable ; parement incliné ;
- eau et nappe ; surcharges en bande ;
- cisaillement direct le long d'une nappe (9.5.5) ;
- connexions et parement (9.5.6, 9.6.5, 9.6.6) ;
- séisme ; états limites de service.

**Unités.** m, kN/m, kPa, kN/m³ ; mm, mm², MPa pour l'acier ; degrés dans `DonneesMur`, radians dans `sol-ec7`.

## Interfaces publiques

### `sol-ec7/src/stabilite.ts` (ajouts, exportés par `index.ts`)

```ts
/** Materiau impose dans x in [xMin, xMax] et y >= yMin (massif renforce). */
export interface ZoneMateriau { xMin: number; xMax: number; yMin: number; couche: CoucheTalus }
/** Lit d'armatures horizontal de x0 a x1 a la cote y ; Rt (kN/m), rpo (kN/m par m ancre), valeurs de calcul. */
export interface Renfort { y: number; x0: number; x1: number; Rt: number; rpo: number }
// DonneesBishop gagne : zones?: ZoneMateriau[]; renforts?: Renfort[];
// ResultatCercle valide gagne : renforts: { y: number; xCoupe: number; T: number }[]  (lits comptes, [] sinon)
```

Règles de T1, à suivre exactement. Les tests les vérifient contre un Bishop indépendant.

- **Zone.** Pour le poids d'une colonne, toute portion de hauteur dont le point est dans l'emprise d'une zone prend
  le γ (et le γsat) de la couche de la zone. Le matériau de base d'une tranche est celui de la zone si son point de
  base y est. Les zones sont lues dans l'ordre, et la première qui contient le point gagne.
- **Forces des armatures.** Elles ne sont comptées que si sens = +1, c'est-à-dire un glissement vers les x
  décroissants. Pour chaque renfort situé sous yc :
  - point de coupe : xCoupe = xc + √(R² − (yc − y)²), la coupe arrière ;
  - le renfort compte si x0 < xCoupe < x1 et si xCoupe est dans l'étendue en x de l'arc de glissement ;
  - force : T = min(Rt ; rpo·(x1 − xCoupe)) ;
  - moment résistant : T·(yc − y) ;
  - formule de Bishop : F = [R·Σ(résistance_i/m_α,i) + Σ T·(yc − y)] / (R·Σ moteur), où m_α suit F à chaque
    itération et T ne dépend pas de F.
- **Modes.** T n'est jamais multiplié par γG ni par γQ, ni en mode « effets » ni en mode « actions ».
- **Refus.** Une zone avec xMin ≥ xMax ou une couche invalide lève une exception dont le message contient « zone ».
  Un renfort avec x0 ≥ x1, Rt < 0 ou rpo < 0 lève une exception dont le message contient « renfort ».
- **Sans zones ni renforts,** les résultats sont strictement ceux de v0.2.0, avec `renforts: []`.

### `sol-renforce/src/mur.ts`

Les types et les signatures sont déjà dans le squelette, où ils sont imposés. Les fonctions sont les suivantes.

- `positionsLits(g)`.
- `facteurKcc(a)`, `perteEpaisseur(a)` (mm), `sectionReduite(a)` (mm², par feuillard).
- `longueurActive(a, H, h, phiDeg)`.
- `defautsGraviteCoherente(phiRemblaiDeg, Cu = 4)`. Valeurs : K/Ka₀ = 1,7, K/Ka_z0 = 1,2, z0 = 6 m,
  μpo,0 = min(2 ; 1,2 + log₁₀ Cu), μpo,z0 = tan φr. Chaque source contient « FHWA-NHI-10-024 ».
- `verifierMur(d)`.

## Tâches

### T1 : zones et renforts dans Bishop (`sol-ec7/src/stabilite.ts`, `index.ts`, `package.json` 0.3.0)

- **Ce qu'il faut faire :** suivre les règles ci-dessus. `rechercherCercleCritique` passe zones et renforts à chaque
  cercle.
- **Tests :** `sol-ec7/tests/renforts.test.ts`. Les tests `sol.test.ts` et `talus.test.ts` doivent rester verts.

### T2 : armatures et lits (`sol-renforce/src/mur.ts`)

- **Fonctions :** `positionsLits`, `facteurKcc`, `perteEpaisseur`, `sectionReduite`, `longueurActive`,
  `defautsGraviteCoherente`, ainsi que les refus de l'acier dans `verifierMur`.
- **Tests :** bloc `T2`.

### T3 : stabilité interne

- **Tests :** bloc `T3`.
- **Dépendance :** T2.

### T4 : stabilité externe

- **Tests :** bloc `T4`.
- **Dépendance :** T2 ; s'appuie sur `combinaisons1g`, `combinaisons2g`, `profil1g`, `profilAnb2022`, `profil2g`
  et les fonctions de portance de `sol-ec7`.

### T5 : stabilité générale et mixte, assemblage

- **Tests :** bloc `T5`.
- **Dépendances :** T1, T3, T4.

## Tests d'acceptation

Les attendus ont été calculés à part par un script Python indépendant, sans le code TypeScript, et ce script reste
hors dépôt. Pour Bishop, la référence est à 4000 tranches. La tolérance relative est de 0,05 %, et de 0,5 % pour
Bishop, calculé à 200 tranches dans l'outil et à 400 dans les tests de `sol-ec7`.

Banc local (pas de npm), depuis le dossier du dépôt concerné :

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs . renforts
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs .
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/typecheck.mjs .
```

| Tâche | Dépôt | Commande | Résultat attendu |
|---|---|---|---|
| T1 | `sol-ec7` | `lancer.mjs .` | tout vert (renforts, talus, sol) ; typecheck 0 erreur |
| T2 | `sol-renforce` | `lancer.mjs .` | bloc T2 vert |
| T3 | `sol-renforce` | `lancer.mjs .` | blocs T2, T3 verts |
| T4 | `sol-renforce` | `lancer.mjs .` | blocs T2 à T4 verts |
| T5 | `sol-renforce` | `lancer.mjs .` | tout vert ; typecheck 0 erreur |

Avant l'implémentation, ces tests échouent : les exports de T1 sont absents et les fonctions du squelette lèvent
« a ecrire ».

## Règles pour l'exécutant

- Traiter T1 à T5 dans l'ordre. Écrire `HANDOFF.md` dans `sol-renforce`, au format du `CLAUDE.md` global.
- **Interdit :**
  - modifier les fichiers de `tests/` des deux dépôts, ou les types du squelette ;
  - ouvrir les normes ;
  - toucher à `mur-en-l`, `fondations-superficielles`, `stabilite-talus` ou `_banc-local` ;
  - ajouter une dépendance ;
  - changer les valeurs ou les sources existantes de `sol-ec7` ;
  - lancer `git push` ou `git tag`.
- **Lecture autorisée :** les fichiers nommés ici, les tests, `sol-ec7/src/*`, et, pour T3 seulement,
  `fondbis/src/modules/solRenforce/stabiliteInterne.ts`. Ce dernier ne sert que de repère : ses coefficients ne
  sont pas sourcés.
- Un commit local par tâche, dans le dépôt concerné.
- Si un test paraît faux : ne pas le changer, passer la tâche en « bloquée » dans `HANDOFF.md`.
- **Style :** `CONVENTIONS.md`. Identifiants et commentaires en français sans accents ; messages d'erreur accentués.
- **Point de décision laissé :** l'organisation interne des fonctions. Tout nom listé ici est imposé.

## Après ce lot (séance Claude)

1. Audit du lot.
2. Tag `sol-ec7` v0.3.0.
3. Maquette de l'interface : coupe du massif avec ses lits, le cercle et les forces ; tableau des lits ; verdicts
   par famille.
4. `PLAN-interface.md`.

/**
 * Les textes affiches, en francais et en anglais. PUR.
 * Aucun texte ne se lit au chargement d'un module : toujours `textes()` ou `phrase()` au moment du rendu.
 * Les indices s'ecrivent en notation (`F_d`, `γ_R,po`) : `notationHtml` les met en `<sub>` au rendu.
 *
 * `messages`, `clauses`, `verifications` et `note` ne changent pas (note.ts les lit). `refus` et `page`
 * (T1) sont ajoutes a FR et a EN ; les autres textes (verdicts, volets, dessin) viennent a T2 a T3, et
 * les regles de `phrase` (phrases du noyau en anglais) a T5.
 */

import { langueCourante, traducteur } from 'aedificium-ui';

const FR = {
  messages: {
    rienAExporter: 'Aucun calcul valide à exporter : corriger la saisie.',
    nouvelleVersion: 'Une nouvelle version est disponible. Recharger maintenant ?',
  },
  /** Refus a la lecture de la saisie : le champ est nomme, avec son libelle. */
  refus: {
    nombre: (champ: string, brut: string) =>
      brut.trim() === '' ? `${champ} : nombre attendu.` : `${champ} : nombre attendu, « ${brut} » saisi.`,
    phi: (champ: string, brut: string) => `${champ} : l’angle doit être strictement compris entre 0 et 90 degrés, « ${brut} » saisi.`,
    cu: (champ: string, brut: string) => `${champ} : valeur strictement positive attendue, « ${brut} » saisi.`,
    diviseurVide: (champ: string) => `${champ} : diviseur à saisir, la norme n’en donne pas.`,
    format: (recu: string, attendu: string) => `Fichier non reconnu : le champ format vaut « ${recu} », « ${attendu} » attendu.`,
    /** Libelles des champs de la saisie, tels qu'ils apparaissent dans les refus. */
    champs: {
      H: 'hauteur du massif H (m)',
      L: 'longueur des armatures L (m)',
      D: 'encastrement D (m)',
      premierLit: 'hauteur du premier lit (m)',
      Sv: 'espacement vertical S_v (m)',
      gammaR: 'γ du remblai renforcé (kN/m³)',
      phiR: 'φ’k du remblai renforcé (°)',
      gammaB: 'γ du remblai retenu (kN/m³)',
      phiB: 'φ’k du remblai retenu (°)',
      gammaF: 'γ du sol de fondation (kN/m³)',
      phiF: 'φ’k du sol de fondation (°)',
      cF: 'c’k du sol de fondation (kPa)',
      cuF: 'c_u,k du sol de fondation (kPa)',
      qG: 'surcharge permanente q_G (kPa)',
      qQ: 'surcharge variable q_Q (kPa)',
      nbParMetre: 'feuillards par mètre',
      largeur: 'largeur des feuillards (mm)',
      epaisseur: 'épaisseur des feuillards (mm)',
      fy: 'f_y (MPa)',
      dureeVie: 'durée d’utilisation (ans)',
      KsurKa0: 'K/Ka en tête',
      KsurKaZ0: 'K/Ka à z0',
      z0: 'z0 (m)',
      muPo0: 'μpo en tête',
      muPoZ0: 'μpo à z0',
      Tk: 'T_k (kN/m)',
      etaGs: 'η_gs',
      gammaRd: 'γ_Rd,gs',
      Rc: 'taux de couverture R_c',
      kpo: 'k_po',
      xc: 'abscisse x_c du cercle imposé (m)',
      yc: 'ordonnée y_c du cercle imposé (m)',
      R: 'rayon R du cercle imposé (m)',
      gRt: 'γ_Rt (rupture)',
      gRpo: 'γ_R,po (arrachement)',
    },
  },
  /** Page : messages de cablage (main.ts). */
  page: {
    elementAbsent: (selecteur: string) => `Élément absent de la page : ${selecteur}`,
    defautsIllisibles: 'Valeurs FHWA non remplies : saisir d’abord φ’k du remblai renforcé, entre 0 et 90 degrés.',
  },
  /** Vue : verdicts, volets, lits et blocs du resultat (vue.ts). */
  vue: {
    nonCalculable: 'non calculable',
    gouvernant: 'gouvernant',
    noteTaux: 'Au-delà de 1, la vérification n’est pas satisfaite ; la jauge est bornée à 100 %.',
    groupes: { stabilite: 'Stabilité générale', interne: 'Stabilité interne', externe: 'Stabilité externe' },
    combinaison: 'Combinaison',
    cercle: (x: string, y: string, R: string) => `centre x_c = ${x} m, y_c = ${y} m, R = ${R} m`,
    litPlusCharge: (h: string, T: string) => `lit le plus chargé, h = ${h} m ; T = ${T} kN/m`,
    rupture: 'rupture',
    arrachement: 'arrachement',
    excentricite: (eG: string, eGQ: string) => `e_G = ${eG} m ; e_G+Q = ${eGQ} m`,
    moments: (mDst: string, mStb: string) => `M_dst = ${mDst} kN·m/m ; M_stb = ${mStb} kN·m/m`,
    volets: {
      coefficients: 'Coefficients partiels',
      coefficient: 'Coefficient',
      valeur: 'Valeur',
      source: 'Source',
      hypotheses: 'Hypothèses',
    },
  },
  /** Donnees d'entree : libelles des blocs de la note et du CSV (vue.ts). */
  entrees: {
    hauteur: 'Hauteur du massif',
    longueur: 'Longueur des armatures',
    encastrement: 'Encastrement, terrain devant le parement',
    premierLit: 'Hauteur du premier lit',
    espacement: 'Espacement vertical des lits',
    cercleImpose: 'Cercle imposé, centre et rayon',
    remblaiRenforce: 'Remblai renforcé',
    remblaiRetenu: 'Remblai retenu',
    fondation: 'Sol de fondation',
    poidsVolumique: 'poids volumique',
    frottement: 'angle de frottement effectif',
    cohesion: 'cohésion effective',
    cohesionNonDrainee: 'cohésion non drainée',
    surchargePermanente: 'surcharge permanente sur la crête',
    surchargeVariable: 'surcharge variable sur la crête',
    feuillards: 'feuillards par mètre de parement et par lit',
    largeur: 'largeur initiale des feuillards',
    epaisseur: 'épaisseur initiale des feuillards',
    limiteElasticite: 'limite d’élasticité nominale',
    protection: 'protection',
    galvanise: 'galvanisé',
    nonGalvanise: 'non galvanisé',
    milieu: 'milieu',
    milieux: { terrestre: 'terrestre', eau_douce: 'eau douce' },
    dureeVie: 'durée d’utilisation de projet',
    uniteDureeVie: 'ans',
    repartition: 'répartition de la résistance',
    repartitions: { uniforme: 'uniforme', non_uniforme: 'non uniforme' },
    KsurKa0: 'K/K_a en tête',
    KsurKaZ0: 'K/K_a à z0 et au-delà',
    z0: 'profondeur z_0',
    muPo0: 'μ_po en tête',
    muPoZ0: 'μ_po à z0 et au-delà',
    resistanceTraction: 'résistance caractéristique à la traction',
    etaGs: 'facteur de réduction',
    gammaRd: 'facteur de modèle',
    rc: 'taux de couverture',
    kpo: 'facteur d’arrachement',
    approche: 'approche de calcul',
    approcheImposee: 'imposée par le profil',
    profil: 'profil normatif',
    profils: { recommande: 'valeurs recommandées', anb2022: 'NBN EN 1997-1 ANB:2022' },
    risque: 'risque',
    risques: { faible: 'faible', normal: 'normal', eleve: 'élevé' },
    diviseurRupture: 'diviseur de rupture',
    diviseurArrachement: 'diviseur d’arrachement',
    classe: 'classe de conséquences',
    cas: 'cas externe',
    casNomme: { a: '(a) + (b)', c: '(c)', d: '(d)' },
    facteurInterne: 'approche interne',
    facteursInternes: { materiaux: 'matériaux (VC3 + M2)', resistances: 'résistances (VC1)' },
  },
  /** Resultats : libelles des blocs (vue.ts). */
  resultats: {
    synthese: 'Synthèse',
    profil: 'Profil normatif',
    tauxGouvernant: 'Taux gouvernant',
    verificationGouvernante: 'Vérification gouvernante',
    facteur: 'Facteur de stabilité',
    taux: 'Taux',
    abscisse: 'Abscisse du centre',
    ordonnee: 'Ordonnée du centre',
    rayon: 'Rayon',
    Ka: 'Coefficient de poussée',
    litPlusCharge: 'Hauteur du lit le plus chargé',
    tension: 'Effort dans le lit',
    resistanceRupture: 'Résistance à la rupture',
    resistanceArrachement: 'Résistance à l’arrachement',
    externe: 'Externe',
    momentMoteur: 'Moment moteur',
    momentStabilisant: 'Moment stabilisant',
    excentriciteG: 'Excentricité sous G',
    excentriciteGQ: 'Excentricité sous G + Q',
  },
  /** Clauses par generation et par verification (verdicts et note). */
  clauses: {
    '1re': {
      stabilite: 'EN 1997-1 §11.5.1',
      interne: 'coefficients saisis',
      glissement: 'EN 1997-1 §6.5.3',
      portance: 'EN 1997-1 §6.5.2',
      renversement: 'EN 1997-1 §2.4.7.2',
      excentricite: '',
    },
    '2e': {
      stabilite: 'EN 1997-3 §4.6.3, F.3.1',
      interne: 'EN 1997-3 §9.6, tableau 9.4',
      glissement: 'EN 1997-3 §5.6',
      portance: 'EN 1997-3 §5.6, B.4',
      renversement: 'EN 1990 tableau A.1.8',
      excentricite: 'EN 1997-3 tableau 5.3',
    },
  },
  /** Noms des verifications, sans norme. */
  verifications: {
    stabilite: 'Stabilité générale',
    interne: 'Rupture et arrachement',
    glissement: 'Glissement',
    portance: 'Portance',
    renversement: 'Basculement',
    excentricite: 'Excentricité',
  },
  note: {
    element: 'Mur en sol renforcé',
    titreEntrees: 'Données d’entrée',
    legendeCoupe: 'Coupe du mur à l’échelle, lits, ligne des tractions maximales et cercle de la combinaison gouvernante.',
    coefficients: 'Coefficients partiels',
    combinaisons: {
      '1re': [
        'Externe et stabilité générale : approche de calcul retenue (EN 1997-1:2004, annexe A).',
        'Basculement : état limite EQU.',
        'Interne : actions de l’approche retenue ; diviseurs γ_Rt (rupture) et γ_R,po (arrachement) saisis, la norme n’en donnant pas.',
      ],
      '2e': [
        'Interne : tableau 9.4 de l’EN 1997-3:2025, approche par les matériaux (VC3 + M2) ou par les résistances (VC1).',
        'Externe : cas (a) + (b), (c) ou (d) du tableau 5.2 de l’EN 1997-3:2025.',
        'Basculement : VC2(a) et VC2(b), le plus défavorable (EN 1990:2023, tableau A.1.8).',
        'Excentricité de la résultante : tableau 5.3 de l’EN 1997-3:2025.',
        'Stabilité générale : VC3 + M2, forces des armatures coupées à leur résistance de calcul (F.3.1).',
      ],
    },
    hypotheses: [
      'Massif rectangulaire à parement vertical ; armatures horizontales, toutes de longueur L.',
      'Poussée du remblai retenu horizontale (Rankine), appliquée sur la hauteur H du massif.',
      'Contrainte verticale au lit : γ·z + q, sans répartition de Meyerhof.',
      'Surcharges uniformes sur toute la crête ; la variable n’entre pas dans les résistances (arrachement, glissement).',
      'Stabilité générale : Bishop simplifié, 200 tranches ; le terrain devant le parement est compté en remblai retenu ; la recherche ne garde que les cercles qui sortent au pied ou devant.',
    ],
    tractions: {
      acier: 'Feuillards d’acier : gravité cohérente (F.3.2), ligne des tractions maximales bilinéaire (0,3·H), profil K/Ka saisi.',
      geosynthetique: 'Géosynthétique : coin de Rankine (F.3.3), ligne des tractions maximales à 45° − φ/2.',
    },
    lits: (combinaison: string) => `Lits d’armatures, ${combinaison}`,
    colonnesLits: ['h (m)', 'z (m)', 'K', 'σ_v (kPa)', 'T (kN/m)', 'L_a (m)', 'L_e (m)', 'R_t (kN/m)', 'R_po (kN/m)', 'Taux'],
    corrosion: (deltaE: string, Ar: string, pourcent: string) =>
      `Section après corrosion (EN 1997-3:2025, 9.3.4) : Δe = ${deltaE} mm par face, A_r = ${Ar} mm² par feuillard, soit ${pourcent} % de A_0.`,
  },
  /** Coupe du mur (dessin.ts). */
  dessin: {
    aria: 'Coupe du mur en sol renforcé, lits d’armatures et cercle de glissement',
    titreVue: (vue: string, F: string) => `${vue} : F_d = ${F}`,
    massif: 'massif renforcé',
    remblaiRetenu: 'remblai retenu',
    fondation: 'fondation',
    hauteur: (v: string) => `H = ${v} m`,
    longueur: (v: string) => `L = ${v} m`,
  },
};

export type Textes = typeof FR;

const EN: Textes = {
  messages: {
    rienAExporter: 'No valid calculation to export: correct the input.',
    nouvelleVersion: 'A new version is available. Reload now?',
  },
  refus: {
    nombre: (champ: string, brut: string) =>
      brut.trim() === '' ? `${champ}: number expected.` : `${champ}: number expected, got “${brut}”.`,
    phi: (champ: string, brut: string) => `${champ}: the angle must lie strictly between 0 and 90 degrees, got “${brut}”.`,
    cu: (champ: string, brut: string) => `${champ}: a strictly positive value is expected, got “${brut}”.`,
    diviseurVide: (champ: string) => `${champ}: divisor to enter, the standard gives none.`,
    format: (recu: string, attendu: string) => `Unknown file: the format field is “${recu}”, expected “${attendu}”.`,
    champs: {
      H: 'height of the block H (m)',
      L: 'reinforcement length L (m)',
      D: 'embedment D (m)',
      premierLit: 'height of the first layer (m)',
      Sv: 'vertical spacing S_v (m)',
      gammaR: 'γ of the reinforced fill (kN/m³)',
      phiR: 'φ’k of the reinforced fill (°)',
      gammaB: 'γ of the retained fill (kN/m³)',
      phiB: 'φ’k of the retained fill (°)',
      gammaF: 'γ of the foundation soil (kN/m³)',
      phiF: 'φ’k of the foundation soil (°)',
      cF: 'c’k of the foundation soil (kPa)',
      cuF: 'c_u,k of the foundation soil (kPa)',
      qG: 'permanent surcharge q_G (kPa)',
      qQ: 'variable surcharge q_Q (kPa)',
      nbParMetre: 'strips per metre',
      largeur: 'strip width (mm)',
      epaisseur: 'strip thickness (mm)',
      fy: 'f_y (MPa)',
      dureeVie: 'design life (years)',
      KsurKa0: 'K/Ka at the top',
      KsurKaZ0: 'K/Ka at z0',
      z0: 'z0 (m)',
      muPo0: 'μpo at the top',
      muPoZ0: 'μpo at z0',
      Tk: 'T_k (kN/m)',
      etaGs: 'η_gs',
      gammaRd: 'γ_Rd,gs',
      Rc: 'coverage ratio R_c',
      kpo: 'k_po',
      xc: 'abscissa x_c of the imposed circle (m)',
      yc: 'ordinate y_c of the imposed circle (m)',
      R: 'radius R of the imposed circle (m)',
      gRt: 'γ_Rt (rupture)',
      gRpo: 'γ_R,po (pull-out)',
    },
  },
  page: {
    elementAbsent: (selecteur: string) => `Element missing from the page: ${selecteur}`,
    defautsIllisibles: 'FHWA values not filled: first enter φ’k of the reinforced fill, between 0 and 90 degrees.',
  },
  vue: {
    nonCalculable: 'not computable',
    gouvernant: 'governing',
    noteTaux: 'Above 1, the check is not satisfied; the gauge is capped at 100 %.',
    groupes: { stabilite: 'Overall stability', interne: 'Internal stability', externe: 'External stability' },
    combinaison: 'Combination',
    cercle: (x: string, y: string, R: string) => `centre x_c = ${x} m, y_c = ${y} m, R = ${R} m`,
    litPlusCharge: (h: string, T: string) => `most loaded layer, h = ${h} m; T = ${T} kN/m`,
    rupture: 'rupture',
    arrachement: 'pull-out',
    excentricite: (eG: string, eGQ: string) => `e_G = ${eG} m; e_G+Q = ${eGQ} m`,
    moments: (mDst: string, mStb: string) => `M_dst = ${mDst} kN·m/m; M_stb = ${mStb} kN·m/m`,
    volets: {
      coefficients: 'Partial factors',
      coefficient: 'Coefficient',
      valeur: 'Value',
      source: 'Source',
      hypotheses: 'Assumptions',
    },
  },
  entrees: {
    hauteur: 'Height of the block',
    longueur: 'Reinforcement length',
    encastrement: 'Embedment, ground in front of the face',
    premierLit: 'Height of the first layer',
    espacement: 'Vertical spacing of the layers',
    cercleImpose: 'Imposed circle, centre and radius',
    remblaiRenforce: 'Reinforced fill',
    remblaiRetenu: 'Retained fill',
    fondation: 'Foundation soil',
    poidsVolumique: 'unit weight',
    frottement: 'effective friction angle',
    cohesion: 'effective cohesion',
    cohesionNonDrainee: 'undrained cohesion',
    surchargePermanente: 'permanent surcharge on the crest',
    surchargeVariable: 'variable surcharge on the crest',
    feuillards: 'strips per metre of face and per layer',
    largeur: 'initial strip width',
    epaisseur: 'initial strip thickness',
    limiteElasticite: 'nominal yield strength',
    protection: 'protection',
    galvanise: 'galvanised',
    nonGalvanise: 'not galvanised',
    milieu: 'environment',
    milieux: { terrestre: 'terrestrial', eau_douce: 'fresh water' },
    dureeVie: 'design life of the project',
    uniteDureeVie: 'years',
    repartition: 'distribution of the resistance',
    repartitions: { uniforme: 'uniform', non_uniforme: 'non-uniform' },
    KsurKa0: 'K/K_a at the top',
    KsurKaZ0: 'K/K_a at z0 and below',
    z0: 'depth z_0',
    muPo0: 'μ_po at the top',
    muPoZ0: 'μ_po at z0 and below',
    resistanceTraction: 'characteristic tensile strength',
    etaGs: 'reduction factor',
    gammaRd: 'model factor',
    rc: 'coverage ratio',
    kpo: 'pull-out factor',
    approche: 'design approach',
    approcheImposee: 'imposed by the profile',
    profil: 'normative profile',
    profils: { recommande: 'recommended values', anb2022: 'NBN EN 1997-1 ANB:2022' },
    risque: 'risk',
    risques: { faible: 'low', normal: 'normal', eleve: 'high' },
    diviseurRupture: 'rupture divisor',
    diviseurArrachement: 'pull-out divisor',
    classe: 'consequence class',
    cas: 'external case',
    casNomme: { a: '(a) + (b)', c: '(c)', d: '(d)' },
    facteurInterne: 'internal approach',
    facteursInternes: { materiaux: 'materials (VC3 + M2)', resistances: 'resistances (VC1)' },
  },
  resultats: {
    synthese: 'Summary',
    profil: 'Normative profile',
    tauxGouvernant: 'Governing ratio',
    verificationGouvernante: 'Governing check',
    facteur: 'Stability factor',
    taux: 'Ratio',
    abscisse: 'Abscissa of the centre',
    ordonnee: 'Ordinate of the centre',
    rayon: 'Radius',
    Ka: 'Earth pressure coefficient',
    litPlusCharge: 'Height of the most loaded layer',
    tension: 'Force in the layer',
    resistanceRupture: 'Rupture resistance',
    resistanceArrachement: 'Pull-out resistance',
    externe: 'External',
    momentMoteur: 'Overturning moment',
    momentStabilisant: 'Stabilising moment',
    excentriciteG: 'Eccentricity under G',
    excentriciteGQ: 'Eccentricity under G + Q',
  },
  clauses: {
    '1re': {
      stabilite: 'EN 1997-1 §11.5.1',
      interne: 'factors entered by the user',
      glissement: 'EN 1997-1 §6.5.3',
      portance: 'EN 1997-1 §6.5.2',
      renversement: 'EN 1997-1 §2.4.7.2',
      excentricite: '',
    },
    '2e': {
      stabilite: 'EN 1997-3 §4.6.3, F.3.1',
      interne: 'EN 1997-3 §9.6, table 9.4',
      glissement: 'EN 1997-3 §5.6',
      portance: 'EN 1997-3 §5.6, B.4',
      renversement: 'EN 1990 table A.1.8',
      excentricite: 'EN 1997-3 table 5.3',
    },
  },
  verifications: {
    stabilite: 'Overall stability',
    interne: 'Rupture and pull-out',
    glissement: 'Sliding',
    portance: 'Bearing',
    renversement: 'Overturning',
    excentricite: 'Eccentricity',
  },
  note: {
    element: 'Reinforced soil wall',
    titreEntrees: 'Input data',
    legendeCoupe: 'Section of the wall to scale, layers, line of maximum tension and circle of the governing combination.',
    coefficients: 'Partial factors',
    combinaisons: {
      '1re': [
        'External and overall stability: chosen design approach (EN 1997-1:2004, annex A).',
        'Overturning: EQU limit state.',
        'Internal: actions of the chosen approach; divisors γ_Rt (rupture) and γ_R,po (pull-out) entered by the user, as the standard gives none.',
      ],
      '2e': [
        'Internal: table 9.4 of EN 1997-3:2025, material factor approach (VC3 + M2) or resistance factor approach (VC1).',
        'External: case (a) + (b), (c) or (d) of table 5.2 of EN 1997-3:2025.',
        'Overturning: VC2(a) and VC2(b), the more unfavourable (EN 1990:2023, table A.1.8).',
        'Eccentricity of the resultant: table 5.3 of EN 1997-3:2025.',
        'Overall stability: VC3 + M2, forces of the cut reinforcements at their design resistance (F.3.1).',
      ],
    },
    hypotheses: [
      'Rectangular block with a vertical face; horizontal reinforcements of uniform length L.',
      'Thrust of the retained fill horizontal (Rankine), applied over the height H of the block.',
      'Vertical stress at a layer: γ·z + q, without Meyerhof distribution.',
      'Uniform surcharges over the whole crest; the variable one is not counted in the resistances (pull-out, sliding).',
      'Overall stability: simplified Bishop, 200 slices; the ground in front of the face is counted as retained fill; the search keeps only circles exiting at or in front of the toe.',
    ],
    tractions: {
      acier: 'Steel strips: coherent gravity (F.3.2), bilinear line of maximum tension (0.3·H), K/Ka profile as entered.',
      geosynthetique: 'Geosynthetic: Rankine wedge (F.3.3), line of maximum tension at 45° − φ/2.',
    },
    lits: (combinaison: string) => `Reinforcement layers, ${combinaison}`,
    colonnesLits: ['h (m)', 'z (m)', 'K', 'σ_v (kPa)', 'T (kN/m)', 'L_a (m)', 'L_e (m)', 'R_t (kN/m)', 'R_po (kN/m)', 'Ratio'],
    corrosion: (deltaE: string, Ar: string, pourcent: string) =>
      `Section after corrosion (EN 1997-3:2025, 9.3.4): Δe = ${deltaE} mm per face, A_r = ${Ar} mm² per strip, i.e. ${pourcent} % of A_0.`,
  },
  /** Section of the wall (dessin.ts). */
  dessin: {
    aria: 'Cross-section of the reinforced soil wall, reinforcement layers and sliding circle',
    titreVue: (vue: string, F: string) => `${vue}: F_d = ${F}`,
    massif: 'reinforced massif',
    remblaiRetenu: 'retained fill',
    fondation: 'foundation',
    hauteur: (v: string) => `H = ${v} m`,
    longueur: (v: string) => `L = ${v} m`,
  },
};

export function textes(): Textes {
  return langueCourante() === 'en' ? EN : FR;
}

/**
 * Ponctuation de la langue courante : les assemblages « a : b » et « a ; b » portent
 * l'espace francaise ; en anglais, les deux-points et le point-virgule se collent au mot.
 */
export function ponctuer(s: string): string {
  return langueCourante() === 'en' ? s.replace(/ ([:;])(?=\s)/g, '$1') : s;
}

// --- Phrases du noyau : traduites en anglais seulement ; en francais, phrase() rend le texte intact --

/** Nombres du noyau : la virgule decimale francaise devient un point. */
const nombreEn = (s: string): string => s.replace(/(\d),(\d)/g, '$1.$2');

/** Risques de l'ANB:2022, tels qu'ils figurent dans le nom du profil. */
const RISQUE_EN: Record<string, string> = {
  faible: 'low risk',
  normal: 'normal risk',
  'élevé': 'high risk',
  eleve: 'high risk',
};

/** Noms des grandeurs du noyau, dans les messages de refus. */
const NOMS_EN: Record<string, string> = {
  "Le nombre de feuillards par mètre n": 'The number of strips per metre n',
  'La largeur b du feuillard': 'The strip width b',
  "L'épaisseur e du feuillard": 'The strip thickness e',
  "La limite d'élasticité fy": 'The yield strength fy',
  "La durée d'utilisation de projet": 'The design life',
  'Le rapport K/Ka en tête': 'The ratio K/Ka at the top',
  'Le rapport K/Ka à z0': 'The ratio K/Ka at z0',
  'La profondeur z0': 'The depth z0',
  'Le coefficient μpo,0': 'The coefficient μpo,0',
  'Le coefficient μpo,z0': 'The coefficient μpo,z0',
  'La résistance caractéristique Tk': 'The characteristic resistance Tk',
  "Le facteur d'arrachement kpo": 'The pull-out factor kpo',
  'La hauteur H': 'The height H',
  'La longueur L des armatures': 'The reinforcement length L',
  "L'espacement vertical Sv": 'The vertical spacing Sv',
  'La hauteur du premier lit': 'The height of the first layer',
  'Le poids volumique γ du remblai renforcé': 'The unit weight γ of the reinforced fill',
  'Le poids volumique γ du remblai retenu': 'The unit weight γ of the retained fill',
  'Le poids volumique γ de la fondation': 'The unit weight γ of the foundation',
  "La cohésion c' de la fondation": "The cohesion c' of the foundation",
  'La cohésion non drainée c_u de la fondation': 'The undrained cohesion c_u of the foundation',
  'La surcharge permanente qG': 'The permanent surcharge qG',
  'La surcharge variable qQ': 'The variable surcharge qQ',
  'Le coefficient interne γRt': 'The internal factor γRt',
  'Le coefficient interne γRpo': 'The internal factor γRpo',
  'du remblai renforcé': 'of the reinforced fill',
  'du remblai retenu': 'of the retained fill',
  'de la fondation': 'of the foundation',
};

/** Sources des coefficients : les tournures communes a toute la suite. */
const sourceEn = (s: string): string =>
  s
    .replace(/valeurs recommandées/g, 'recommended values')
    .replace(/valeur recommandée/g, 'recommended value')
    .replace(/valeur caractéristique/g, 'characteristic value')
    .replace(/coefficient à 1/g, 'coefficient of 1')
    .replace(/facteur de conséquence/g, 'consequence factor')
    .replace(/action variable favorable non comptée/g, 'favourable variable action not counted')
    .replace(/action variable favorable/g, 'favourable variable action')
    .replace(/approche par les matériaux/g, 'material approach')
    .replace(/approche par les résistances/g, 'resistance approach')
    .replace(/sans facteur de résistance/g, 'no resistance factor')
    .replace(/absent de l'ANB:2022/g, 'absent from ANB:2022')
    .replace(/imposée/g, 'imposed')
    .replace(/tableau /g, 'table ')
    .replace(/sans coefficient/g, 'no factor')
    .replace(/, jeu /g, ', set ')
    .replace(/jeu /g, 'set ')
    .replace(/saisi par l'utilisateur/g, 'entered by the user')
    .replace(/aucune valeur dans la norme/g, 'no value in the standard')
    .replace(/renvoyée par/g, 'referred to by')
    .replace(/ × γRd,gs saisi/g, ' × γRd,gs entered')
    .replace(/sans k_R/g, 'no k_R')
    .replace(/répartition/g, 'distribution')
    .replace(/(\d+)\s+ans\b/g, '$1 years')
    .replace(/\bdurée\b/g, 'duration')
    .replace(/\bdu\b/g, 'of');

/** Phrases exactes du noyau (sources, alertes, refus). */
const EXACTES: Record<string, string> = {
  ...NOMS_EN,

  // Unites des messages de refus.
  'sans unité': 'unitless',
  ans: 'years',

  // Noms de profils et de combinaisons.
  'EN 1997-1:2004, valeurs recommandées': 'EN 1997-1:2004, recommended values',
  'EN 1990:2023 et EN 1997:2024-2025, valeurs recommandées':
    'EN 1990:2023 and EN 1997:2024-2025, recommended values',
  'valeur caractéristique, coefficient à 1': 'characteristic value, coefficient of 1',
  caractéristique: 'characteristic',

  // Sources des coefficients internes.
  "saisi par l'utilisateur (aucune valeur dans la norme)":
    'entered by the user (no value in the standard)',
  'EN 1993-1-1, valeur recommandée, renvoyée par EN 1997-3:2025, tableau 9.4':
    'EN 1993-1-1, recommended value, referred to by EN 1997-3:2025, table 9.4',
  'EN 1997-3:2025, tableau 9.4, valeur recommandée (γM,gs)':
    'EN 1997-3:2025, table 9.4, recommended value (γM,gs)',
  'EN 1997-3:2025, tableau 9.4, valeur recommandée, sans k_R':
    'EN 1997-3:2025, table 9.4, recommended value, no k_R',
  'EN 1997-3:2025, tableau 9.4, approche par les matériaux, sans coefficient':
    'EN 1997-3:2025, table 9.4, material approach, no factor',

  // Noms des coefficients affiches dans les volets.
  'K/Ka en tête': 'K/Ka at the top',
  'K/Ka à z0 et au-delà': 'K/Ka at z0 and below',
  'μpo en tête': 'μpo at the top',
  'μpo à z0': 'μpo at z0',

  // Alertes du noyau.
  "Longueur d'ancrage nulle au lit h = 0,38 m : arrachement nul, taux infini.":
    'Zero anchorage length at layer h = 0.38 m: zero pull-out resistance, infinite ratio.',
  "La résultante sort de la base du massif (B' ≤ 0) : portance non calculée, taux infini.":
    "The resultant lies outside the base of the block (B' ≤ 0): bearing not calculated, infinite ratio.",
  'L < 0,7·H : en dessous de la longueur minimale usuelle (FHWA)':
    'L < 0.7·H: below the usual minimum length (FHWA)',
  'm_α borné à 0,2 : sortie de glissement raide': 'm_α capped at 0.2: steep slip exit',

  // Motifs de refus d'un cercle (sol-ec7).
  'le cercle ne coupe pas le terrain': 'the circle does not cut the ground',
  'le cercle coupe le terrain en plusieurs points': 'the circle cuts the ground at several points',
  "l'arc de glissement sort du profil": 'the slip arc goes beyond the profile',
  "l'arc ne rejoint pas le terrain (le cercle reste sous le terrain)":
    'the arc does not meet the ground (the circle stays below it)',
  'moment moteur nul ou négatif dans le sens du glissement':
    'driving moment zero or negative in the sliding direction',
  'F non physique (numérateur nul ou négatif)': 'F not physical (numerator zero or negative)',
  'le cercle sort par le parement': 'the circle exits through the facing',
  'le cercle ne coupe pas le massif': 'the circle does not cut the block',
  'le cercle passe sous la base du massif': 'the circle passes below the base of the block',
};

/** Regles par motif, la derniere attrape tout. */
const REGLES: [RegExp, (_m: string, ...g: string[]) => string][] = [
  // Profil normatif qui impose son approche.
  [
    /^Le profil (.+) impose l'approche (\S+) ; l'approche (\S+) est refusée\.$/,
    (_m: string, profil: string, a: string, b: string) =>
      `The profile ${phrase(profil)} requires approach ${a}; approach ${b} is refused.`,
  ],
  [
    /^NBN EN 1997-1 ANB:2022, risque (faible|normal|élevé|eleve), DA1 imposée$/,
    (_m: string, r: string) => `NBN EN 1997-1 ANB:2022, ${RISQUE_EN[r]}, DA1 imposed`,
  ],

  // Refus de la saisie.
  [
    /^L'angle de frottement φ (.+) doit être strictement compris entre 0 et 90 degrés \(φ = (.+)\)\.$/,
    (_m: string, nom: string, v: string) =>
      `The friction angle φ ${phrase(nom)} must lie strictly between 0 and 90 degrees (φ = ${nombreEn(v)}).`,
  ],
  [
    /^La hauteur du premier lit \((.+) m\) doit être inférieure à H \((.+) m\)\.$/,
    (_m: string, a: string, b: string) =>
      `The height of the first layer (${nombreEn(a)} m) must be less than H (${nombreEn(b)} m).`,
  ],
  [
    /^L'encastrement D doit être positif ou nul et inférieur à H \((.+) m\) : valeur saisie (.+) m\.$/,
    (_m: string, h: string, d: string) =>
      `The embedment D must be zero or positive and less than H (${nombreEn(h)} m): entered value ${nombreEn(d)} m.`,
  ],
  [
    /^La fondation drainée exige l'angle de frottement φ' de la fondation\.$/,
    () => "The drained foundation requires the friction angle φ' of the foundation.",
  ],
  [
    /^Les coefficients internes de 1re génération \(γRt, γRpo\) doivent être saisis : aucune valeur par défaut dans la norme\.$/,
    () =>
      'The internal factors of the 1st generation (γRt, γRpo) must be entered: neither standard gives a default value.',
  ],
  [
    /^Le facteur de réduction η_gs doit être dans \]0 ; 1\] \(sans unité\) ; valeur saisie : (.+)\.$/,
    (_m: string, v: string) =>
      `The reduction factor η_gs must lie within ]0; 1] (unitless); entered value: ${nombreEn(v)}.`,
  ],
  [
    /^Le taux de couverture Rc doit être dans \]0 ; 1\] \(sans unité\) ; valeur saisie : (.+)\.$/,
    (_m: string, v: string) =>
      `The coverage ratio Rc must lie within ]0; 1] (unitless); entered value: ${nombreEn(v)}.`,
  ],
  [
    /^Le facteur de modèle γRd,gs doit être supérieur ou égal à 1 \(sans unité\) ; valeur saisie : (.+)\.$/,
    (_m: string, v: string) =>
      `The model factor γRd,gs must be greater than or equal to 1 (unitless); entered value: ${nombreEn(v)}.`,
  ],

  // Limites de l'acier et section apres corrosion.
  [
    /^La limite d'élasticité fy = (.+) MPa dépasse (\d+) MPa pour un acier non galvanisé : refus \(EN 1997-3:2025, 9\.3\.4\)\.$/,
    (_m: string, fy: string, lim: string) =>
      `The yield strength fy = ${nombreEn(fy)} MPa exceeds ${lim} MPa for non-galvanised steel: refused (EN 1997-3:2025, 9.3.4).`,
  ],
  [
    /^La limite d'élasticité fy = (.+) MPa dépasse (\d+) MPa pour un acier galvanisé : refus \(EN 1997-3:2025, 9\.3\.4\)\.$/,
    (_m: string, fy: string, lim: string) =>
      `The yield strength fy = ${nombreEn(fy)} MPa exceeds ${lim} MPa for galvanised steel: refused (EN 1997-3:2025, 9.3.4).`,
  ],
  [
    /^La section réduite Ar = (.+) mm² est inférieure à 50 % de A0 = (.+) mm² après corrosion : refus \(EN 1997-3:2025, 9\.3\.4\)\.$/,
    (_m: string, ar: string, a0: string) =>
      `The reduced section Ar = ${nombreEn(ar)} mm² is less than 50 % of A0 = ${nombreEn(a0)} mm² after corrosion: refused (EN 1997-3:2025, 9.3.4).`,
  ],

  // Cercles de stabilite generale.
  [
    /^Le cercle imposé \((.+)\) est refusé pour la combinaison (.+) : (.+)\.$/,
    (_m: string, coord: string, cb: string, motif: string) =>
      `The imposed circle (${nombreEn(coord)}) is refused for combination ${phrase(cb)}: ${phrase(motif)}.`,
  ],
  [
    /^Aucun cercle valide pour la combinaison (.+) : la recherche du cercle critique n'aboutit pas\.$/,
    (_m: string, cb: string) =>
      `No valid circle for combination ${phrase(cb)}: the search for the critical circle does not converge.`,
  ],
  [
    /^Bishop ne converge pas en (\d+) itérations$/,
    (_m: string, n: string) => `Bishop does not converge in ${n} iterations`,
  ],

  // Alertes parametrees.
  [
    /^Longueur d'ancrage nulle au lit h = (.+) m : arrachement nul, taux infini\.$/,
    (_m: string, h: string) =>
      `Zero anchorage length at layer h = ${nombreEn(h)} m: zero pull-out resistance, infinite ratio.`,
  ],

  // Refus generiques du noyau (nom et unite).
  [
    /^(.+) doit être un nombre strictement positif \((.+)\)\.$/,
    (_m: string, nom: string, unite: string) =>
      `${phrase(nom)} must be a strictly positive number (${phrase(unite)}).`,
  ],
  [
    /^(.+) doit être un nombre positif ou nul \((.+)\)\.$/,
    (_m: string, nom: string, unite: string) =>
      `${phrase(nom)} must be a zero or positive number (${phrase(unite)}).`,
  ],

  // Derniere regle : les sources des coefficients et les tournures communes.
  [/^([\s\S]*)$/, (_m: string, s: string) => sourceEn(nombreEn(s))],
];

/** Traduction d'une phrase du noyau, ou de la saisie, au rendu seulement. */
export const phrase = traducteur(EXACTES, REGLES);

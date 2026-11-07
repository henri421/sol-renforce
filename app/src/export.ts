/**
 * Les traits de la coupe du mur, repris par le SVG exporte et par la note. Les classes sont celles
 * que `dessin.ts` pose sur ses elements (liste en tete de `tests/app/dessin.test.ts`). Valeurs des
 * jetons de `style.css` ecrites en dur : le SVG exporte doit tenir seul, sans la feuille de l'app.
 */
export const STYLES_TRACE = `
svg .ligne-terrain { fill: none; stroke: #1a1a1a; stroke-width: 1.6; stroke-linejoin: round; }
svg .fondation { fill: #e3e0da; stroke: none; }
svg .remblai-retenu { fill: #ede6d6; stroke: none; }
svg .massif { fill: #e7eaee; stroke: none; }
svg .parement { stroke: #1a1a1a; stroke-width: 4; }
svg .lit { stroke: #3a5a80; stroke-width: 1.6; }
svg .tractions { fill: none; stroke: #a8442a; stroke-width: 1.2; stroke-dasharray: 6 3; }
svg .masse { fill: #a52121; fill-opacity: 0.06; stroke: none; }
svg .cercle { fill: none; stroke: #a52121; stroke-width: 2; }
svg .centre { fill: #a52121; stroke: none; }
svg .rayon { stroke: #a52121; stroke-width: 0.8; stroke-dasharray: 3 3; }
svg .force { stroke: #a8442a; stroke-width: 2; }
svg .fleche { fill: #a8442a; stroke: none; }
svg .cote { stroke: #6a6862; stroke-width: 0.8; fill: #6a6862; font-size: 11px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg text.cote { stroke: none; }
svg .texte-coupe { fill: #4a4842; font-size: 11px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg .texte-traction { fill: #a8442a; font-size: 10px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg .texte-refus { fill: #a52121; font-size: 11px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg .titre-coupe { fill: #a52121; font-size: 12px; font-weight: 600; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
`;

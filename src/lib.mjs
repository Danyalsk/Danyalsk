// Shared helpers for the README art: fonts as outlines (so the SVGs look the
// same on every machine), theme tokens, and a seeded random for stable output.
import opentype from 'opentype.js';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = (pkg, file) => opentype.loadSync(join(root, 'node_modules/@fontsource', pkg, 'files', file));

export const fonts = {
  display: font('space-grotesk', 'space-grotesk-latin-700-normal.woff'),
  displayMedium: font('space-grotesk', 'space-grotesk-latin-500-normal.woff'),
  serif: font('instrument-serif', 'instrument-serif-latin-400-italic.woff'),
  mono: font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff'),
};
for (const [key, f] of Object.entries(fonts)) f.key = key;

// Same palette as danyalsameer.vercel.app; light mode deepens the violet for contrast.
export const themes = {
  dark: {
    bg: '#07070b', panel: '#0e0e15', ink: '#ececf1', dim: '#8d8c9c', faint: '#24232f', line: '#1a1923',
    accent: '#a78bfa', deep: '#6d4aff', glow: '#d8ccff', core: '#1b1240',
  },
  light: {
    bg: '#fbfaff', panel: '#ffffff', ink: '#0c0b14', dim: '#5f5d70', faint: '#dcd9ea', line: '#ebe9f4',
    accent: '#6d4aff', deep: '#4c2fd6', glow: '#8b6dff', core: '#efeaff',
  },
};

function layout(str, f, size, tracking) {
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(str);
  const parts = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    parts.push({ g, x });
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) x += f.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size;
  });
  return { parts, width: x };
}

export const measure = (str, { font: f, size, tracking = 0 }) => layout(str, f, size, tracking).width;

// Text as a single path `d`. tracking is in em, like CSS letter-spacing.
export function textD(str, { font: f, size, x = 0, y = 0, anchor = 'start', tracking = 0 }) {
  const { parts, width } = layout(str, f, size, tracking);
  const ox = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return parts.map((p) => p.g.getPath(ox + p.x, y, size).toPathData(1)).join('');
}

// One outline per text run. Use for gradient fills that must span the whole run.
export const textPath = (str, opts, attrs = '') => `<path d="${textD(str, opts)}" ${attrs}/>`;

// Text as <use> references to shared glyph outlines: each glyph is stored once per
// SVG, which keeps label-heavy art small. The defs are emitted by svg().
let glyphs = new Map();
export function text(str, { font: f, size, x = 0, y = 0, anchor = 'start', tracking = 0 }, attrs = '') {
  const { parts, width } = layout(str, f, size, tracking);
  const ox = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  let uses = '';
  for (const p of parts) {
    const key = `${f.key}${size}-${p.g.index}`.replace('.', '_');
    if (!glyphs.has(key)) {
      const d = p.g.getPath(0, 0, size).toPathData(1);
      if (!d) continue;
      glyphs.set(key, d);
    }
    uses += `<use href="#${key}" x="${(ox + p.x).toFixed(1)}" y="${y}"/>`;
  }
  return `<g ${attrs}>${uses}</g>`;
}

export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// Call with the body already built (so its glyphs are registered); resets the glyph store.
export function svg({ w, h, title, body, style = '' }) {
  const defs = [...glyphs].map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('');
  glyphs = new Map();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><style>${style}@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style><defs>${defs}</defs>${body}</svg>`;
}

export function save(name, content) {
  const out = join(root, 'assets', name);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
  console.log(`${name}  ${(content.length / 1024).toFixed(1)} KB`);
}

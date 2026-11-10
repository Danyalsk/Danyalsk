// Builds the static README art in assets/: hero, Mira pipeline, toolbox.
// Every piece is rendered twice, for GitHub's dark and light themes.
// Run: npm run art
import { readFileSync } from 'node:fs';
import { fonts, themes, text, measure, svg, save } from './lib.mjs';

const EASE = 'cubic-bezier(.22,1,.36,1)';
const mono = (size, tracking = 0.16) => ({ font: fonts.mono, size, tracking });

const frame = (w, h, c) =>
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="20" fill="${c.bg}" stroke="${c.line}"/>`;

// Cut out of posters/assets/photo.png in the portfolio repo with src/source/portrait.swift.
const portrait = `data:image/webp;base64,${readFileSync(new URL('./source/portrait.webp', import.meta.url)).toString('base64')}`;
const PORTRAIT_RATIO = 911 / 760;

// ---------- hero ----------
function hero(c) {
  const W = 1280, H = 460;
  const name = { font: fonts.display, size: 88, tracking: -0.02 };
  const shipW = measure('I ship', { font: fonts.displayMedium, size: 30 });
  const phrases = ['AI business operators.', 'creator marketplaces.', 'App Store apps.', 'spare-parts networks.', 'games that teach AI.'];
  const period = phrases.length * 2.6;
  const ph = phrases
    .map((p, i) => `<g class="ph${i === 0 ? ' ph0' : ''}" style="animation-delay:${(i * 2.6).toFixed(1)}s">${text(p, { font: fonts.serif, size: 40, x: 64 + shipW + 14, y: 393 }, `fill="${c.accent}"`)}</g>`)
    .join('');
  const pw = 400, phh = pw * PORTRAIT_RATIO, px = W - pw - 40, py = H - phh + 24;
  const css = `
.ph{opacity:0;animation:ph ${period}s ${EASE} infinite}
@keyframes ph{0%{opacity:0;transform:translateY(16px)}3%,16%{opacity:1;transform:none}20%,100%{opacity:0;transform:translateY(-16px)}}
@media (prefers-reduced-motion: reduce){.ph0{opacity:1}}`;
  const body = `<defs>
  <clipPath id="card"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19"/></clipPath>
  <radialGradient id="fade" cx=".5" cy=".38" r=".5"><stop offset=".66" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="pmask" maskUnits="userSpaceOnUse" x="${px}" y="${py.toFixed(1)}" width="${pw}" height="${phh.toFixed(1)}"><rect x="${px}" y="${py.toFixed(1)}" width="${pw}" height="${phh.toFixed(1)}" fill="url(#fade)"/></mask>
</defs>
${frame(W, H, c)}
<g clip-path="url(#card)"><image href="${portrait}" x="${px}" y="${py.toFixed(1)}" width="${pw}" height="${phh.toFixed(1)}" mask="url(#pmask)"/></g>
${text("hey, I'm", { font: fonts.serif, size: 36, x: 66, y: 108 }, `fill="${c.accent}"`)}
${text('DANYAL SAMEER', { ...name, x: 60, y: 192 }, `fill="${c.ink}"`)}
${text('KHALIFE', { ...name, x: 60, y: 273 }, `fill="${c.ink}"`)}
${text('FULL-STACK & AI DEVELOPER · INDIA', { ...mono(13), x: 64, y: 330 }, `fill="${c.dim}"`)}
${text('I ship', { font: fonts.displayMedium, size: 30, x: 64, y: 391 }, `fill="${c.ink}"`)}
${ph}`;
  return svg({ w: W, h: H, title: 'Danyal Sameer Khalife: full-stack and AI developer in India. I ship AI business operators, creator marketplaces, App Store apps, spare-parts networks and games that teach AI.', body, style: css });
}

// ---------- Mira: one message from landing to close ----------
function miraFlow(c) {
  const W = 1280, H = 320, Y = 152, DUR = 7;
  const xs = [340, 547, 754, 961, 1168];
  const steps = [
    ['Lands', '9 CHANNELS, ONE INBOX'],
    ['Ranked', 'BY INTENT AND URGENCY'],
    ['Drafted', "IN THE OWNER'S VOICE"],
    ['Agent runs it', 'SALES AND SUPPORT'],
    ['Closed', 'OR HANDED TO A PERSON'],
  ];
  const channels = ['WhatsApp', 'Instagram', 'Gmail', 'Slack', 'LinkedIn', 'Messenger', 'TikTok', 'X', 'Telegram'];
  const keyTimes = [0, 0.05, 0.2, 0.25, 0.4, 0.45, 0.6, 0.65, 0.8, 1];
  const holds = xs.flatMap((x) => [x, x]);
  let pills = '';
  channels.forEach((ch, i) => {
    const y = 34 + i * 28;
    const d = `M182 ${y + 12}C262 ${y + 12} 262 ${Y} ${xs[0] - 28} ${Y}`;
    pills += `<path d="${d}" fill="none" stroke="${c.faint}" stroke-width="1"/>`;
    pills += `<path class="flow" d="${d}" fill="none" stroke="${c.accent}" stroke-width="1.4" stroke-dasharray="5 11" style="animation-delay:-${(i * 0.37).toFixed(2)}s" opacity=".7"/>`;
    pills += `<rect x="40" y="${y}" width="142" height="24" rx="12" fill="${c.panel}" stroke="${c.faint}"/>`;
    pills += text(ch, { ...mono(11.5, 0.02), x: 111, y: y + 16, anchor: 'middle' }, `fill="${c.ink}"`);
  });
  let nodes = '';
  steps.forEach(([title, sub], i) => {
    const x = xs[i], t = keyTimes[i * 2];
    const kt = `keyTimes="0;${t};${Math.min(t + 0.01, 1)};${Math.min(t + 0.14, 1)};1"`;
    nodes += `<circle cx="${x}" cy="${Y}" r="28" fill="${c.panel}" stroke="${c.faint}" stroke-width="1.5"><animate attributeName="stroke" dur="${DUR}s" repeatCount="indefinite" ${kt} values="${c.faint};${c.faint};${c.accent};${c.accent};${c.faint}"/></circle>`;
    nodes += text(`0${i + 1}`, { ...mono(14, 0.04), x, y: Y + 5, anchor: 'middle' }, `fill="${c.ink}"`);
    nodes += text(title, { font: fonts.display, size: 21, x, y: Y + 66, anchor: 'middle', tracking: -0.01 }, `fill="${c.ink}"`);
    nodes += text(sub, { ...mono(10.5, 0.1), x, y: Y + 90, anchor: 'middle' }, `fill="${c.dim}"`);
  });
  const anim = (attr) => `<animate attributeName="${attr}" dur="${DUR}s" repeatCount="indefinite" values="${holds.join(';')}" keyTimes="${keyTimes.join(';')}"/>`;
  const css = `
.flow{animation:flow 1.6s linear infinite}
@keyframes flow{to{stroke-dashoffset:-32}}`;
  const body = `${frame(W, H, c)}
${pills}
<line x1="${xs[0]}" y1="${Y}" x2="${xs[4]}" y2="${Y}" stroke="${c.faint}" stroke-width="2"/>
<line x1="${xs[0]}" y1="${Y}" x2="${xs[0]}" y2="${Y}" stroke="${c.accent}" stroke-width="2">${anim('x2')}</line>
<circle cy="${Y}" r="5" fill="${c.accent}">${anim('cx')}</circle>
${nodes}`;
  return svg({ w: W, h: H, title: 'Mira pipeline: a message lands on any of 9 channels, is ranked by intent and urgency, a reply is drafted in the owner’s voice, an agent runs the conversation, and it closes or is handed to a person.', body, style: css });
}

// ---------- toolbox ----------
function toolbox(c) {
  const W = 1280;
  const rows = [
    ['LANGUAGES', ['TypeScript', 'JavaScript', 'Swift', 'Python', 'SQL', 'HTML/CSS']],
    ['FRONTEND', ['React 19', 'Next.js', 'TanStack Router + Query', 'Tailwind v4', 'shadcn/ui', 'Framer Motion', 'Three.js', 'GSAP']],
    ['BACKEND', ['Hono', 'Bun', 'Elysia', 'Express', 'Node.js', 'Zod', 'Better Auth', 'Socket.IO']],
    ['DATA', ['PostgreSQL', 'Drizzle ORM', 'MongoDB', 'Redis', 'Neon', 'Hyperdrive']],
    ['AI', ['Claude Agent SDK', 'LLM agents', 'Embeddings (bge-m3)', 'Retrieval', 'Whisper', 'OpenCV', 'FFmpeg']],
    ['MOBILE', ['React Native', 'Expo', 'iOS / SwiftUI', 'App Store releases']],
    ['INFRA', ['Cloudflare Workers', 'Queues', 'Durable Objects', 'R2', 'Vercel', 'Docker', 'GitHub Actions']],
  ];
  const x0 = 210, xMax = 1240, ph = 30, gap = 8;
  const font = mono(12.5, 0.01);
  let y = 32, out = '';
  rows.forEach(([label, items], r) => {
    let x = x0;
    out += text(label, { ...mono(11.5, 0.2), x: 40, y: y + 19.5 }, `fill="${c.accent}"`);
    for (const name of items) {
      const w = measure(name, font) + 28;
      if (x + w > xMax) { x = x0; y += ph + 10; }
      out += `<rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="${ph}" rx="15" fill="${c.panel}" stroke="${c.faint}"/>`;
      out += text(name, { ...font, x: x + 14, y: y + 19.5 }, `fill="${c.ink}"`);
      x += w + gap;
    }
    if (r < rows.length - 1) out += `<line x1="40" y1="${y + ph + 11}" x2="1240" y2="${y + ph + 11}" stroke="${c.line}"/>`;
    y += ph + 22;
  });
  const H = y + 10;
  const alt = rows.map(([l, items]) => `${l.toLowerCase()}: ${items.join(', ')}`).join('; ');
  return svg({ w: W, h: H, title: `Toolbox. ${alt}.`, body: `${frame(W, H, c)}${out}` });
}

for (const [theme, c] of Object.entries(themes)) {
  save(`hero-${theme}.svg`, hero(c));
  save(`mira-${theme}.svg`, miraFlow(c));
  save(`toolbox-${theme}.svg`, toolbox(c));
}

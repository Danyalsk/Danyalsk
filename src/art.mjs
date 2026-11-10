// Builds the static README art in assets/: hero, Mira pipeline, toolbox, sign-off.
// Every piece is rendered twice, for GitHub's dark and light themes.
// Run: npm run art
import { fonts, themes, text, textPath, measure, rng, svg, save } from './lib.mjs';

const EASE = 'cubic-bezier(.22,1,.36,1)';
const mono = (size, tracking = 0.16) => ({ font: fonts.mono, size, tracking });

const frame = (w, h, c) =>
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="20" fill="${c.bg}" stroke="${c.line}"/>`;

function stars(c, w, h, n, seed, avoid = () => false) {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = 20 + r() * (w - 40);
    const y = 20 + r() * (h - 40);
    if (avoid(x, y)) continue;
    const dur = (3 + r() * 5).toFixed(1);
    const delay = (r() * 6).toFixed(1);
    out += `<circle class="tw" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.6 + r() * 1.1).toFixed(1)}" fill="${c.dim}" style="animation-duration:${dur}s;animation-delay:-${delay}s"/>`;
  }
  return out;
}

function pulseDot(x, y, color) {
  return `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/><circle class="ping" cx="${x}" cy="${y}" r="4" fill="none" stroke="${color}" stroke-width="1.5"/>`;
}

const sharedCss = `
.tw{animation:tw 5s ease-in-out infinite alternate;opacity:.15}
@keyframes tw{to{opacity:.85}}
.ping{transform-box:fill-box;transform-origin:center;animation:ping 2.2s ${EASE} infinite}
@keyframes ping{from{transform:scale(1);opacity:.9}to{transform:scale(3.4);opacity:0}}
.rise{animation:rise 1.1s ${EASE} both}
@keyframes rise{from{opacity:0;transform:translateY(22px)}}
`;

// ---------- the stargate, same motif as the portfolio landing ----------
function portal(c, cx, cy, s = 1, id = 'p') {
  const r = rng(11);
  const R = (v) => (v * s).toFixed(1);
  let ticks = '';
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const r0 = i % 5 === 0 ? 162 : 170;
    ticks += `M${(cx + Math.cos(a) * r0 * s).toFixed(1)} ${(cy + Math.sin(a) * r0 * s).toFixed(1)}L${(cx + Math.cos(a) * 178 * s).toFixed(1)} ${(cy + Math.sin(a) * 178 * s).toFixed(1)}`;
  }
  let tris = '';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const tip = 176, base = 192, half = 0.045;
    const p = (rad, ang) => `${(cx + Math.cos(ang) * rad * s).toFixed(1)} ${(cy + Math.sin(ang) * rad * s).toFixed(1)}`;
    tris += `M${p(tip, a)}L${p(base, a - half)}L${p(base, a + half)}Z`;
  }
  const arcs = (n, seed) => {
    const q = rng(seed);
    let out = '';
    for (let i = 0; i < n; i++) {
      const a0 = q() * Math.PI * 2;
      const sweep = 1.6 + q() * 1.8;
      const r0 = 18 + q() * 30, r1 = 92 + q() * 40;
      let d = '';
      for (let k = 0; k <= 24; k++) {
        const t = k / 24;
        const rr = (r0 + (r1 - r0) * t) * s, aa = a0 + sweep * t;
        d += `${k ? 'L' : 'M'}${(cx + Math.cos(aa) * rr).toFixed(1)} ${(cy + Math.sin(aa) * rr).toFixed(1)}`;
      }
      const glow = i % 3 === 0;
      out += `<path d="${d}" fill="none" stroke="${glow ? c.glow : c.accent}" stroke-width="${(glow ? 2.2 : 1.1) * s}" stroke-linecap="round" opacity="${(0.35 + q() * 0.55).toFixed(2)}"/>`;
    }
    return out;
  };
  let motes = '';
  for (let i = 0; i < 18; i++) {
    const a = r() * Math.PI * 2, rr = (30 + r() * 100) * s;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    const deg = ((a * 180) / Math.PI + 90).toFixed(0);
    motes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${R(7)}" height="${R(1.6)}" rx="1" fill="${c.glow}" opacity="${(0.4 + r() * 0.5).toFixed(2)}" transform="rotate(${deg} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  const spin = (sec, rev = false) => `style="transform-origin:${cx}px ${cy}px;animation:spin ${sec}s linear infinite${rev ? ' reverse' : ''}"`;
  return `
<defs>
  <radialGradient id="${id}core" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${c.glow}" stop-opacity=".95"/>
    <stop offset=".12" stop-color="${c.accent}" stop-opacity=".55"/>
    <stop offset=".6" stop-color="${c.core}" stop-opacity=".9"/>
    <stop offset="1" stop-color="${c.bg}" stop-opacity="1"/>
  </radialGradient>
  <radialGradient id="${id}halo" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${c.accent}" stop-opacity=".22"/>
    <stop offset="1" stop-color="${c.accent}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="${id}sweep" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${c.glow}" stop-opacity="0"/>
    <stop offset=".7" stop-color="${c.glow}" stop-opacity=".2"/>
    <stop offset="1" stop-color="${c.glow}"/>
  </linearGradient>
  <filter id="${id}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${R(2.4)}"/></filter>
</defs>
<circle cx="${cx}" cy="${cy}" r="${R(300)}" fill="url(#${id}halo)"/>
<g ${spin(120)}><path d="${ticks}" stroke="${c.dim}" stroke-width="${R(1)}" opacity=".55"/><path d="${tris}" fill="${c.accent}"/></g>
<circle cx="${cx}" cy="${cy}" r="${R(156)}" fill="none" stroke="${c.accent}" stroke-width="${R(2)}" stroke-dasharray="${R(2)} ${R(7)}" opacity=".6" ${spin(60, true)}/>
<circle cx="${cx}" cy="${cy}" r="${R(146)}" fill="url(#${id}core)" class="breathe" style="transform-origin:${cx}px ${cy}px"/>
<circle cx="${cx}" cy="${cy}" r="${R(146)}" fill="none" stroke="${c.faint}" stroke-width="${R(3)}"/>
<g ${spin(7)}><path d="M${cx - 146 * s} ${cy}A${R(146)} ${R(146)} 0 0 1 ${cx} ${cy - 146 * s}" fill="none" stroke="url(#${id}sweep)" stroke-width="${R(3)}" stroke-linecap="round"/></g>
<g ${spin(16)} filter="url(#${id}blur)" opacity=".8">${arcs(5, 3)}</g>
<g ${spin(16)}>${arcs(5, 3)}</g>
<g ${spin(26, true)}>${arcs(6, 9)}</g>
<g ${spin(40)}>${motes}</g>
<circle cx="${cx}" cy="${cy}" r="${R(7)}" fill="${c.glow}" filter="url(#${id}blur)"/>
<circle cx="${cx}" cy="${cy}" r="${R(3)}" fill="#fff"/>`;
}

const portalCss = `
@keyframes spin{to{transform:rotate(360deg)}}
.breathe{animation:breathe 6s ease-in-out infinite}
@keyframes breathe{50%{transform:scale(1.035)}}
`;

// ---------- hero ----------
function hero(c, theme) {
  const W = 1280, H = 520, cx = 1004, cy = 262;
  let size = 92;
  while (measure('DANYAL SAMEER', { font: fonts.display, size, tracking: -0.02 }) > 690) size -= 2;
  const name = { font: fonts.display, size, tracking: -0.02 };
  const shipW = measure('I ship', { font: fonts.displayMedium, size: 30 });
  const phrases = ['AI business operators.', 'creator marketplaces.', 'App Store apps.', 'spare-parts networks.', 'games that teach AI.'];
  const period = phrases.length * 2.6;
  const ph = phrases
    .map((p, i) => `<g class="ph${i === 0 ? ' ph0' : ''}" style="animation-delay:${(i * 2.6).toFixed(1)}s">${text(p, { font: fonts.serif, size: 40, x: 64 + shipW + 14, y: 443 }, `fill="${c.accent}"`)}</g>`)
    .join('');
  const statusText = 'OPEN TO WORK · IST';
  const statusW = measure(statusText, mono(12));
  const orbit = (rx, ry, rot, dur, delay) => {
    const d = `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
    return `<g transform="rotate(${rot} ${cx} ${cy})"><path d="${d}" fill="none" stroke="${c.dim}" stroke-width="1" opacity=".35"/><circle r="3.2" fill="${c.glow}"><animateMotion dur="${dur}s" begin="-${delay}s" repeatCount="indefinite" path="${d}"/></circle></g>`;
  };
  const css = `${sharedCss}${portalCss}
.ph{opacity:0;animation:ph ${period}s ${EASE} infinite}
@keyframes ph{0%{opacity:0;transform:translateY(16px)}3%,16%{opacity:1;transform:none}20%,100%{opacity:0;transform:translateY(-16px)}}
.scan{animation:scan 9s linear infinite}
@keyframes scan{from{stroke-dashoffset:1300}to{stroke-dashoffset:-1300}}
@media (prefers-reduced-motion: reduce){.ph0{opacity:1}}`;
  const body = `${frame(W, H, c)}
<defs><linearGradient id="shine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1280" y2="0">
<stop offset="0" stop-color="${c.ink}"/><stop offset=".44" stop-color="${c.ink}"/><stop offset=".5" stop-color="${c.glow}"/><stop offset=".56" stop-color="${c.ink}"/><stop offset="1" stop-color="${c.ink}"/>
<animateTransform attributeName="gradientTransform" type="translate" from="-1400 0" to="1400 0" dur="8s" repeatCount="indefinite"/></linearGradient></defs>
${stars(c, W, H, 70, 5, (x, y) => x < 780 && y > 110 && y < 470)}
${orbit(226, 66, -28, 14, 3)}${orbit(198, 54, 64, 19, 9)}
${portal(c, cx, cy, 1, 'h')}
<circle cx="71" cy="56" r="7" fill="none" stroke="${c.dim}" stroke-width="1.5"/><circle cx="71" cy="56" r="2.6" fill="${c.ink}"/>
${text('DANYALSAMEER.VERCEL.APP', { ...mono(12), x: 88, y: 60.5 }, `fill="${c.dim}"`)}
${pulseDot(1216 - statusW - 14, 56, c.ok)}
${text(statusText, { ...mono(12), x: 1216, y: 60.5, anchor: 'end' }, `fill="${c.dim}"`)}
<g class="rise" style="animation-delay:.05s">${text("hey, I'm", { font: fonts.serif, size: 36, x: 66, y: 160 }, `fill="${c.accent}"`)}</g>
<g class="rise" style="animation-delay:.15s">${textPath('DANYAL SAMEER', { ...name, x: 60, y: 244 }, 'fill="url(#shine)"')}</g>
<g class="rise" style="animation-delay:.25s">${textPath('KHALIFE', { ...name, x: 60, y: 244 + size * 0.92 }, 'fill="url(#shine)"')}</g>
<g class="rise" style="animation-delay:.4s"><circle cx="69" cy="377" r="4" fill="${c.accent}"/>${text('FULL-STACK & AI DEVELOPER · INDIA', { ...mono(13), x: 84, y: 381.5 }, `fill="${c.ink}" opacity=".8"`)}</g>
<g class="rise" style="animation-delay:.5s">${text('I ship', { font: fonts.displayMedium, size: 30, x: 64, y: 441 }, `fill="${c.ink}"`)}</g>
${ph}
<line x1="64" y1="474" x2="1216" y2="474" stroke="${c.line}" stroke-width="1"/>
<line class="scan" x1="64" y1="474" x2="1216" y2="474" stroke="${c.accent}" stroke-width="1.5" stroke-dasharray="140 1300"/>
${text("MIRA · PREPD · CLIQIT · MEME'D · FINDMYSPARE · CODECLASH", { ...mono(11.5, 0.2), x: 64, y: 501 }, `fill="${c.dim}"`)}
${text('SHIP IT, THEN ITERATE.', { ...mono(11.5, 0.2), x: 1216, y: 501, anchor: 'end' }, `fill="${c.accent}"`)}`;
  return svg({ w: W, h: H, title: 'Danyal Sameer Khalife: full-stack and AI developer. I ship AI business operators, creator marketplaces, App Store apps, spare-parts networks and games that teach AI.', body, style: css });
}

// ---------- Mira: one message from landing to close ----------
function miraFlow(c) {
  const W = 1280, H = 340, Y = 168, DUR = 7;
  const xs = [340, 547, 754, 961, 1168];
  const steps = [
    ['Lands', 'ANY OF 9 CHANNELS', 'ONE INBOX'],
    ['Ranked', 'INTENT + URGENCY', 'BUYERS SURFACE FIRST'],
    ['Drafted', "IN THE OWNER'S VOICE", 'EN · HINDI · HINGLISH'],
    ['Agent runs it', 'SALES · SUPPORT', 'GROUNDED IN REAL FACTS'],
    ['Closed', 'OR A HUMAN STEPS IN', 'NOTHING GOES COLD'],
  ];
  const channels = ['WhatsApp', 'Instagram', 'Gmail', 'Slack', 'LinkedIn', 'Messenger', 'TikTok', 'X', 'Telegram'];
  const holds = xs.flatMap((x) => [x, x]);
  const keyTimes = [0, 0.05, 0.2, 0.25, 0.4, 0.45, 0.6, 0.65, 0.8, 1];
  let pills = '';
  channels.forEach((ch, i) => {
    const y = 74 + i * 28;
    const d = `M182 ${y + 12}C262 ${y + 12} 262 ${Y} ${xs[0] - 36} ${Y}`;
    pills += `<path d="${d}" fill="none" stroke="${c.faint}" stroke-width="1"/>`;
    pills += `<path class="flow" d="${d}" fill="none" stroke="${c.accent}" stroke-width="1.4" stroke-dasharray="5 11" style="animation-delay:-${(i * 0.37).toFixed(2)}s" opacity=".75"/>`;
    pills += `<rect x="40" y="${y}" width="142" height="24" rx="12" fill="${c.panel}" stroke="${c.faint}"/>`;
    pills += `<circle class="blink" cx="56" cy="${y + 12}" r="3" fill="${c.accent}" style="animation-delay:${(i * 0.31).toFixed(2)}s"/>`;
    pills += text(ch, { ...mono(11.5, 0.02), x: 68, y: y + 16 }, `fill="${c.ink}"`);
  });
  let nodes = '';
  steps.forEach(([title, a, b], i) => {
    const x = xs[i];
    const t = keyTimes[i * 2];
    const kt = (vals) => `keyTimes="0;${t};${Math.min(t + 0.01, 1)};${Math.min(t + 0.16, 1)};1" values="${vals}"`;
    nodes += `<circle cx="${x}" cy="${Y}" r="36" fill="${c.bg}" stroke="${c.faint}"/>`;
    nodes += `<circle cx="${x}" cy="${Y}" r="27" fill="${c.panel}" stroke="${c.accent}" stroke-width="1.5"/>`;
    nodes += `<circle cx="${x}" cy="${Y}" r="27" fill="none" stroke="${c.glow}" stroke-width="2" opacity="0"><animate attributeName="r" dur="${DUR}s" repeatCount="indefinite" ${kt('27;27;27;54;54')}/><animate attributeName="opacity" dur="${DUR}s" repeatCount="indefinite" ${kt('0;0;.95;0;0')}/></circle>`;
    nodes += text(`0${i + 1}`, { ...mono(14, 0.04), x, y: Y + 5, anchor: 'middle' }, `fill="${c.ink}"`);
    nodes += text(title, { font: fonts.display, size: 21, x, y: Y + 72, anchor: 'middle', tracking: -0.01 }, `fill="${c.ink}"`);
    nodes += text(a, { ...mono(10.5, 0.1), x, y: Y + 96, anchor: 'middle' }, `fill="${c.dim}"`);
    nodes += text(b, { ...mono(10.5, 0.1), x, y: Y + 114, anchor: 'middle' }, `fill="${c.dim}"`);
  });
  const anim = (attr) => `<animate attributeName="${attr}" dur="${DUR}s" repeatCount="indefinite" values="${holds.join(';')}" keyTimes="${keyTimes.join(';')}"/>`;
  const css = `${sharedCss}
.flow{animation:flow 1.6s linear infinite}
@keyframes flow{to{stroke-dashoffset:-32}}
.blink{animation:blink 2.8s ease-in-out infinite}
@keyframes blink{50%{opacity:.25}}`;
  const liveW = measure('LIVE IN PRODUCTION', mono(11.5));
  const body = `${frame(W, H, c)}
<defs><filter id="fg" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter></defs>
${text('ONE MESSAGE, FROM FIRST PING TO CLOSED DEAL', { ...mono(11.5, 0.18), x: 40, y: 46 }, `fill="${c.dim}"`)}
${pulseDot(1240 - liveW - 14, 42, c.ok)}
${text('LIVE IN PRODUCTION', { ...mono(11.5, 0.18), x: 1240, y: 46, anchor: 'end' }, `fill="${c.dim}"`)}
${pills}
<line x1="${xs[0]}" y1="${Y}" x2="${xs[4]}" y2="${Y}" stroke="${c.faint}" stroke-width="2"/>
<line x1="${xs[0]}" y1="${Y}" x2="${xs[0]}" y2="${Y}" stroke="${c.accent}" stroke-width="2">${anim('x2')}</line>
${nodes}
<circle cy="${Y}" r="9" fill="${c.glow}" filter="url(#fg)">${anim('cx')}</circle>
<circle cy="${Y}" r="4.5" fill="#fff" stroke="${c.accent}" stroke-width="1.5">${anim('cx')}</circle>`;
  return svg({ w: W, h: H, title: 'Mira pipeline: a message lands on any of 9 channels, is ranked by intent and urgency, a reply is drafted in the owner’s voice, an agent runs the conversation, and the deal closes or a human steps in.', body, style: css });
}

// ---------- toolbox ----------
function toolbox(c) {
  const W = 1280;
  const rows = [
    ['LANGUAGES', ['TypeScript*', 'JavaScript', 'Swift', 'Python', 'SQL', 'HTML/CSS']],
    ['FRONTEND', ['React 19*', 'Next.js*', 'TanStack Router + Query', 'Tailwind v4', 'shadcn/ui', 'Framer Motion', 'Three.js', 'GSAP']],
    ['BACKEND', ['Hono*', 'Bun', 'Elysia', 'Express', 'Node.js', 'Zod', 'Better Auth', 'Socket.IO']],
    ['DATA', ['PostgreSQL*', 'Drizzle ORM', 'MongoDB', 'Redis', 'Neon', 'Hyperdrive']],
    ['AI', ['Claude Agent SDK*', 'LLM agents', 'Embeddings (bge-m3)', 'Retrieval', 'Whisper', 'OpenCV', 'FFmpeg']],
    ['MOBILE', ['React Native*', 'Expo', 'iOS / SwiftUI', 'App Store releases']],
    ['INFRA', ['Cloudflare Workers*', 'Queues', 'Durable Objects', 'R2', 'Vercel', 'Docker', 'GitHub Actions']],
  ];
  const x0 = 210, xMax = 1240, ph = 30, gap = 8;
  const font = mono(12.5, 0.01);
  let y = 84, out = '', idx = 0, rowIndex = 0;
  const total = rows.reduce((n, r) => n + r[1].length, 0);
  const cycle = 16;
  for (const [label, items] of rows) {
    let x = x0;
    let group = text(label, { ...mono(11.5, 0.2), x: 40, y: y + 19.5 }, `fill="${c.accent}"`);
    for (const raw of items) {
      const core = raw.endsWith('*');
      const name = core ? raw.slice(0, -1) : raw;
      const w = measure(name, font) + (core ? 40 : 28);
      if (x + w > xMax) { x = x0; y += ph + 10; }
      const delay = ((idx / total) * cycle).toFixed(2);
      group += `<rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="${ph}" rx="15" fill="${c.panel}" stroke="${core ? c.accent : c.faint}"/>`;
      group += `<rect class="lit" x="${x}" y="${y}" width="${w.toFixed(1)}" height="${ph}" rx="15" fill="none" stroke="${c.glow}" stroke-width="1.5" style="animation-delay:${delay}s"/>`;
      if (core) group += `<circle cx="${x + 15}" cy="${y + 15}" r="3" fill="${c.accent}"/>`;
      group += text(name, { ...font, x: x + (core ? 26 : 14), y: y + 19.5 }, `fill="${c.ink}"`);
      x += w + gap;
      idx++;
    }
    out += `<g>${group}</g>`;
    if (rowIndex < rows.length - 1) out += `<line x1="40" y1="${y + ph + 11}" x2="1240" y2="${y + ph + 11}" stroke="${c.line}"/>`;
    y += ph + 22;
    rowIndex++;
  }
  const H = y + 14;
  const legendW = measure('DAILY DRIVERS', mono(11.5, 0.18));
  const css = `${sharedCss}
.lit{opacity:0;animation:lit ${cycle}s ease-in-out infinite}
@keyframes lit{0%{opacity:0}2%{opacity:1}7%,100%{opacity:0}}`;
  const body = `${frame(W, H, c)}
${text('TOOLBOX, BY LAYER', { ...mono(11.5, 0.18), x: 40, y: 48 }, `fill="${c.dim}"`)}
<circle cx="${1240 - legendW - 14}" cy="44" r="3" fill="${c.accent}"/>
${text('DAILY DRIVERS', { ...mono(11.5, 0.18), x: 1240, y: 48, anchor: 'end' }, `fill="${c.dim}"`)}
${out}`;
  const alt = rows.map(([l, items]) => `${l.toLowerCase()}: ${items.map((s) => s.replace('*', '')).join(', ')}`).join('; ');
  return svg({ w: W, h: H, title: `Toolbox. ${alt}.`, body, style: css });
}

// ---------- sign-off ----------
function signoff(c) {
  const W = 1280, H = 200;
  const line = 'Ship it, then iterate.';
  const f = { font: fonts.serif, size: 54 };
  const tw = measure(line, f);
  const shift = 40;
  const cx = W / 2 + shift - tw / 2 - 74;
  const css = `${sharedCss}${portalCss}`;
  const body = `${frame(W, H, c)}
${stars(c, W, H, 40, 21)}
${portal(c, cx, 96, 0.3, 's')}
${text(line, { ...f, x: W / 2 + shift, y: 112, anchor: 'middle' }, `fill="${c.ink}"`)}
${text('THANKS FOR SCROLLING · DANYALSAMEER.VERCEL.APP', { ...mono(11, 0.22), x: W / 2 + shift, y: 166, anchor: 'middle' }, `fill="${c.dim}"`)}`;
  return svg({ w: W, h: H, title: 'Ship it, then iterate. Thanks for scrolling.', body, style: css });
}

for (const [theme, c] of Object.entries(themes)) {
  save(`hero-${theme}.svg`, hero(c, theme));
  save(`mira-${theme}.svg`, miraFlow(c));
  save(`toolbox-${theme}.svg`, toolbox(c));
  save(`signoff-${theme}.svg`, signoff(c));
}

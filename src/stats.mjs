// Live activity card: contribution heatmap + streaks, regenerated daily by
// .github/workflows/stats.yml. Fails loudly (non-zero exit) so a bad API
// response never overwrites the last good card.
// Run locally: GITHUB_TOKEN=$(gh auth token) npm run stats
import { fonts, themes, text, measure, svg, save } from './lib.mjs';

const login = process.env.PROFILE_LOGIN || 'Danyalsk';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is not set');

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel weekday } }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-stats' },
  body: JSON.stringify({ query, variables: { login } }),
  signal: AbortSignal.timeout(20_000),
});
if (!res.ok) throw new Error(`GitHub GraphQL responded ${res.status}`);
const json = await res.json();
if (json.errors?.length) throw new Error(`GitHub GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`);
const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar) throw new Error(`No contribution calendar for ${login}`);

const weeks = calendar.weeks;
const days = weeks.flatMap((w) => w.contributionDays);
const today = days.at(-1);

let longest = 0, run = 0;
for (const d of days) {
  run = d.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
const activeDays = days.filter((d) => d.contributionCount > 0).length;
const best = days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a), days[0]);

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const fmt = (iso, opts) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });
const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const mono = (size, tracking = 0.16) => ({ font: fonts.mono, size, tracking });

function card(c) {
  const W = 1280, cell = 17, gap = 4, step = cell + gap;
  const x0 = 1240 - (weeks.length * step - gap), y0 = 214;
  const H = y0 + 7 * step + 64;

  const metrics = [
    [calendar.totalContributions.toLocaleString('en-US'), 'CONTRIBUTIONS', 'LAST 12 MONTHS'],
    [`${activeDays}`, 'ACTIVE DAYS', 'SHIPPED SOMETHING'],
    [`${longest}`, 'LONGEST STREAK', 'DAYS, THIS YEAR'],
    [`${best.contributionCount}`, 'BEST DAY', fmt(best.date, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()],
  ];
  const colW = (1240 - 40) / metrics.length;
  let top = '';
  metrics.forEach(([value, label, sub], i) => {
    const x = 40 + i * colW;
    top += '<g>';
    if (i) top += `<line x1="${x - 24}" y1="92" x2="${x - 24}" y2="160" stroke="${c.line}"/>`;
    top += text(value, { font: fonts.display, size: 58, x, y: 138, tracking: -0.03 }, `fill="${i === 0 ? c.accent : c.ink}"`);
    top += text(label, { ...mono(11.5, 0.18), x, y: 166 }, `fill="${c.ink}" opacity=".85"`);
    top += text(sub, { ...mono(10.5, 0.14), x: x + measure(label, mono(11.5, 0.18)) + 10, y: 166 }, `fill="${c.dim}"`);
    top += '</g>';
  });

  let cells = '', months = '', lastMonth = -1;
  weeks.forEach((w, col) => {
    const firstDay = w.contributionDays[0];
    const m = new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth();
    if (m !== lastMonth && col < weeks.length - 2) {
      if (lastMonth !== -1 || firstDay.weekday === 0) months += text(MONTHS[m], { ...mono(10, 0.12), x: x0 + col * step, y: y0 - 12 }, `fill="${c.dim}"`);
      lastMonth = m;
    }
    for (const d of w.contributionDays) {
      const x = x0 + col * step, y = y0 + d.weekday * step;
      const lvl = levels[d.contributionLevel] ?? 0;
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="${c.heat[lvl]}"><title>${d.contributionCount} on ${d.date}</title></rect>`;
    }
  });
  const tCol = weeks.length - 1, tx = x0 + tCol * step, ty = y0 + today.weekday * step;
  const dayLabels = ['MON', 'WED', 'FRI'].map((d, i) => text(d, { ...mono(10, 0.12), x: x0 - 14, y: y0 + (1 + i * 2) * step + 12.5, anchor: 'end' }, `fill="${c.dim}"`)).join('');

  const moreW = measure('MORE', mono(10, 0.14));
  let legend = '', lx = 1240 - moreW - 10 - (5 * 21 - 4);
  legend += text('LESS', { ...mono(10, 0.14), x: lx - 10, y: H - 30, anchor: 'end' }, `fill="${c.dim}"`);
  c.heat.forEach((h, i) => (legend += `<rect x="${lx + i * 21}" y="${H - 42}" width="17" height="17" rx="4" fill="${h}"/>`));
  const moreX = lx + 5 * 21 - 4 + 10;
  const updated = fmt(today.date, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

  const css = `
.sweep{animation:sweep 9s cubic-bezier(.65,0,.35,1) infinite}
@keyframes sweep{from{transform:translateX(0)}60%,to{transform:translateX(${weeks.length * step + 160}px)}}
.ping{transform-box:fill-box;transform-origin:center;animation:ping 2.2s cubic-bezier(.22,1,.36,1) infinite}
@keyframes ping{from{transform:scale(1);opacity:.9}to{transform:scale(2.2);opacity:0}}`;
  const liveW = measure(`LIVE · UPDATED ${updated}`, mono(11.5, 0.18));
  const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="20" fill="${c.bg}" stroke="${c.line}"/>
<defs>
  <linearGradient id="band" x1="0" x2="1"><stop offset="0" stop-color="${c.glow}" stop-opacity="0"/><stop offset=".5" stop-color="${c.glow}" stop-opacity=".22"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></linearGradient>
  <clipPath id="grid"><rect x="${x0}" y="${y0}" width="${weeks.length * step}" height="${7 * step}"/></clipPath>
</defs>
${text('SHIPPING LOG', { ...mono(11.5, 0.18), x: 40, y: 48 }, `fill="${c.dim}"`)}
<circle cx="${1240 - liveW - 14}" cy="44" r="4" fill="${c.ok}"/><circle class="ping" cx="${1240 - liveW - 14}" cy="44" r="4" fill="none" stroke="${c.ok}" stroke-width="1.5"/>
${text(`LIVE · UPDATED ${updated}`, { ...mono(11.5, 0.18), x: 1240, y: 48, anchor: 'end' }, `fill="${c.dim}"`)}
${top}
${months}${dayLabels}${cells}
<g clip-path="url(#grid)"><rect class="sweep" x="${x0 - 160}" y="${y0}" width="140" height="${7 * step}" fill="url(#band)"/></g>
<rect x="${tx - 2}" y="${ty - 2}" width="${cell + 4}" height="${cell + 4}" rx="6" fill="none" stroke="${c.accent}" stroke-width="1.5"/>
<rect class="ping" x="${tx}" y="${ty}" width="${cell}" height="${cell}" rx="4" fill="none" stroke="${c.accent}" stroke-width="1.5"/>
${text('REGENERATED DAILY BY GITHUB ACTIONS', { ...mono(10, 0.14), x: 40, y: H - 30 }, `fill="${c.dim}"`)}
${legend}
${text('MORE', { ...mono(10, 0.14), x: moreX, y: H - 30 }, `fill="${c.dim}"`)}`;
  const title = `GitHub activity for ${login}: ${calendar.totalContributions} contributions in the last 12 months, ${activeDays} active days, longest streak ${longest} days, best day ${best.contributionCount} on ${best.date}. Updated ${today.date}.`;
  return svg({ w: W, h: H, title, body, style: css });
}

for (const [theme, c] of Object.entries(themes)) save(`stats-${theme}.svg`, card(c));

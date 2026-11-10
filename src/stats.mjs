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
  const x0 = 1240 - (weeks.length * step - gap), y0 = 168;
  const H = y0 + 7 * step + 58;

  const metrics = [
    [calendar.totalContributions.toLocaleString('en-US'), 'CONTRIBUTIONS', 'LAST 12 MONTHS'],
    [`${activeDays}`, 'ACTIVE DAYS', ''],
    [`${longest}`, 'LONGEST STREAK', 'DAYS'],
    [`${best.contributionCount}`, 'BEST DAY', fmt(best.date, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()],
  ];
  const colW = (1240 - 40) / metrics.length;
  let top = '';
  metrics.forEach(([value, label, sub], i) => {
    const x = 40 + i * colW;
    if (i) top += `<line x1="${x - 24}" y1="44" x2="${x - 24}" y2="112" stroke="${c.line}"/>`;
    top += text(value, { font: fonts.display, size: 58, x, y: 90, tracking: -0.03 }, `fill="${i === 0 ? c.accent : c.ink}"`);
    top += text(label, { ...mono(11.5, 0.18), x, y: 118 }, `fill="${c.ink}" opacity=".85"`);
    if (sub) top += text(sub, { ...mono(10.5, 0.14), x: x + measure(label, mono(11.5, 0.18)) + 10, y: 118 }, `fill="${c.dim}"`);
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
      const lvl = levels[d.contributionLevel] ?? 0;
      cells += `<rect x="${x0 + col * step}" y="${y0 + d.weekday * step}" width="${cell}" height="${cell}" rx="4" fill="${c.heat[lvl]}"><title>${d.contributionCount} on ${d.date}</title></rect>`;
    }
  });
  const dayLabels = ['MON', 'WED', 'FRI'].map((d, i) => text(d, { ...mono(10, 0.12), x: x0 - 14, y: y0 + (1 + i * 2) * step + 12.5, anchor: 'end' }, `fill="${c.dim}"`)).join('');

  const by = H - 26;
  const moreW = measure('MORE', mono(10, 0.14));
  const lx = 1240 - moreW - 10 - (5 * 21 - 4);
  let legend = text('LESS', { ...mono(10, 0.14), x: lx - 10, y: by, anchor: 'end' }, `fill="${c.dim}"`);
  c.heat.forEach((h, i) => (legend += `<rect x="${lx + i * 21}" y="${by - 12}" width="17" height="17" rx="4" fill="${h}"/>`));
  legend += text('MORE', { ...mono(10, 0.14), x: 1240, y: by, anchor: 'end' }, `fill="${c.dim}"`);
  const updated = fmt(today.date, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

  const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="20" fill="${c.bg}" stroke="${c.line}"/>
${top}
${months}${dayLabels}${cells}
${text(`UPDATED ${updated}`, { ...mono(10, 0.14), x: 40, y: by }, `fill="${c.dim}"`)}
${legend}`;
  const title = `GitHub activity for ${login}: ${calendar.totalContributions} contributions in the last 12 months, ${activeDays} active days, longest streak ${longest} days, best day ${best.contributionCount} on ${best.date}. Updated ${today.date}.`;
  return svg({ w: W, h: H, title, body });
}

for (const [theme, c] of Object.entries(themes)) save(`stats-${theme}.svg`, card(c));

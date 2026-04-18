import * as d3 from 'd3';
import { MONTH_LABELS, MONTH_SHORT } from '../data/headcount';
import type { MonthAssignment } from '../components/headcount/RolePill';

// ---------------------------------------------------------------------------
// Email-safe palette. Gmail/Outlook drop oklch(); inline hex only.
// ---------------------------------------------------------------------------

const EMAIL_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const EMAIL_MONO =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const COLOR = {
  bg: '#fafafa',
  card: '#ffffff',
  border: '#ececec',
  text: '#202020',
  muted: '#6b6b6b',
  mutedSoft: '#8a8a8a',
  chipBg: '#f2f2f2',
  greenBg: '#f0faf0',
  greenFg: '#008500',
  redBg: '#fcf3f3',
  redFg: '#850000',
  neutralStroke: '#1e1e1e',
  negativeStroke: '#e21200',
  positiveFill: 'rgba(0, 133, 0, 0.08)',
  negativeFill: 'rgba(226, 18, 0, 0.10)',
  tick: '#d9d9d9',
  tickLabel: '#8a8a8a',
};

const TEAM_PILL_EMAIL: Record<
  string,
  { bg: string; fg: string; dot: string }
> = {
  Engineering: { bg: '#ffeae6', fg: '#57130a', dot: '#ff3d00' },
  Product:     { bg: '#ededed', fg: '#202020', dot: '#6b6b6b' },
  Design:      { bg: '#ffefcd', fg: '#4f3515', dot: '#f59e0b' },
  Data:        { bg: '#fff7f2', fg: '#3e0f06', dot: '#d94a00' },
  GTM:         { bg: '#ffeae6', fg: '#691410', dot: '#e20000' },
  Ops:         { bg: '#eaeaea', fg: '#3a3a3a', dot: '#7a7a7a' },
};

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '$0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e6) {
    const v = abs / 1e6;
    return `${sign}$${v >= 10 ? Math.round(v) : v.toFixed(1)}M`;
  }
  if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}k`;
  return `${sign}$${Math.round(abs)}`;
}

function fmtUsdFull(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
}

function fmtRunway(runwayMonths: number | null): string {
  if (runwayMonths === null) return 'Cash flow positive';
  if (runwayMonths <= 0) return '0 months';
  if (runwayMonths >= 12) return '12+ months';
  return `${runwayMonths.toFixed(1)} months`;
}

// ---------------------------------------------------------------------------
// SVG chart (standalone string — no React). Mirrors RunwayChart.tsx.
// ---------------------------------------------------------------------------

interface ChartOpts {
  balances: number[];
  assignments: Record<number, MonthAssignment[]>;
  baseYear: number;
  startMonthIndex?: number;
  xTickMode?: 'year' | 'month';
  width?: number;
  height?: number;
  showYAxis?: boolean;
}

export function renderRunwayChartSvg(opts: ChartOpts): string {
  const {
    balances,
    assignments,
    baseYear,
    startMonthIndex = 0,
    xTickMode = 'year',
    width = 560,
    height = 220,
    showYAxis = true,
  } = opts;

  const marginLeft = showYAxis ? 52 : 10;
  const marginRight = 14;
  const marginTop = 14;
  const marginBottom = 24;

  const innerW = Math.max(1, width - marginLeft - marginRight);
  const innerH = Math.max(1, height - marginTop - marginBottom);

  const data = balances.map((v, i) => ({ month: i, value: v }));
  const n = data.length;

  const xScale = d3
    .scaleLinear()
    .domain([0, Math.max(1, n - 1)])
    .range([0, innerW]);

  const minVal = d3.min(balances) ?? 0;
  const maxVal = d3.max(balances) ?? 0;
  const yMin = Math.min(0, minVal);
  const yMax = Math.max(0, maxVal);
  const yPad = (yMax - yMin) * 0.08 || 1;

  const yScale = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([innerH, 0])
    .nice(4);

  const lineGen = d3
    .line<{ month: number; value: number }>()
    .x((d) => xScale(d.month))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  const areaGen = d3
    .area<{ month: number; value: number }>()
    .x((d) => xScale(d.month))
    .y0(yScale(0))
    .y1((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  const linePath = lineGen(data) ?? '';
  const areaPath = areaGen(data) ?? '';
  const zeroY = yScale(0);

  const xTicks: { x: number; label: string }[] = [];
  if (xTickMode === 'year') {
    for (let m = 0; m < n; m += 12) {
      const absMonth = startMonthIndex + m;
      xTicks.push({
        x: xScale(m),
        label: String(baseYear + Math.floor(absMonth / 12)),
      });
    }
  } else {
    for (let m = 0; m < n; m += 1) {
      const absMonth = startMonthIndex + m;
      xTicks.push({ x: xScale(m), label: MONTH_SHORT[absMonth % 12] });
    }
  }

  const yTicks = showYAxis ? yScale.ticks(4) : [];

  const hireDots: { x: number; y: number; color: string }[] = [];
  for (const [monthStr, list] of Object.entries(assignments)) {
    const absMonth = Number(monthStr);
    const localMonth = absMonth - startMonthIndex;
    if (localMonth < 0 || localMonth >= n) continue;
    for (const a of list) {
      hireDots.push({
        x: xScale(localMonth),
        y: yScale(balances[localMonth]),
        color: TEAM_PILL_EMAIL[a.team]?.dot ?? '#666',
      });
    }
  }

  const clipPos = `clippos-${width}-${height}-${xTickMode}-${n}`;
  const clipNeg = `clipneg-${width}-${height}-${xTickMode}-${n}`;

  const yGrid = yTicks
    .map((t) => {
      const y = yScale(t);
      const dash = t === 0 ? '' : 'stroke-dasharray="2 3"';
      const sw = t === 0 ? '1' : '0.5';
      const op = t === 0 ? '1' : '0.5';
      return `<line x1="0" x2="${innerW}" y1="${y}" y2="${y}" stroke="${COLOR.tick}" stroke-width="${sw}" opacity="${op}" ${dash} />`;
    })
    .join('');

  const yLabels = yTicks
    .map((t) => {
      const y = yScale(t);
      return `<text x="-8" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="${EMAIL_MONO}" font-size="10" font-weight="500" fill="${COLOR.tickLabel}">${fmtUsd(t)}</text>`;
    })
    .join('');

  const xGrid = xTicks
    .map((t, i) => {
      const show = xTickMode === 'year' || i % 3 === 0;
      if (!show) return '';
      return `<line x1="${t.x}" x2="${t.x}" y1="0" y2="${innerH}" stroke="${COLOR.tick}" stroke-dasharray="2 3" stroke-width="0.5" opacity="0.4" />`;
    })
    .join('');

  const xLabels = xTicks
    .map((t, i) => {
      const anchor =
        xTickMode === 'month' ? 'middle' : i === 0 ? 'start' : 'middle';
      return `<text x="${t.x}" y="${innerH + 14}" text-anchor="${anchor}" font-family="${EMAIL_FONT}" font-size="10" font-weight="600" fill="${COLOR.tickLabel}">${t.label}</text>`;
    })
    .join('');

  const dots = hireDots
    .map(
      (d) =>
        `<circle cx="${d.x}" cy="${d.y}" r="3.5" fill="#fff" stroke="${d.color}" stroke-width="1.5" />`,
    )
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <clipPath id="${clipPos}"><rect x="0" y="0" width="${innerW}" height="${Math.max(0, zeroY)}" /></clipPath>
    <clipPath id="${clipNeg}"><rect x="0" y="${Math.max(0, zeroY)}" width="${innerW}" height="${Math.max(0, innerH - Math.max(0, zeroY))}" /></clipPath>
  </defs>
  <g transform="translate(${marginLeft}, ${marginTop})">
    ${yGrid}
    ${yLabels}
    ${xGrid}
    <path d="${areaPath}" fill="${COLOR.positiveFill}" clip-path="url(#${clipPos})" />
    <path d="${areaPath}" fill="${COLOR.negativeFill}" clip-path="url(#${clipNeg})" />
    <path d="${linePath}" fill="none" stroke="${COLOR.neutralStroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#${clipPos})" />
    <path d="${linePath}" fill="none" stroke="${COLOR.negativeStroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#${clipNeg})" />
    ${dots}
    ${xLabels}
  </g>
</svg>`.trim();
}

export function svgToDataUri(svg: string): string {
  const utf8 = unescape(encodeURIComponent(svg));
  return `data:image/svg+xml;base64,${btoa(utf8)}`;
}

// Gmail strips SVG data URIs for security. Rasterize to PNG via canvas so the
// image survives every major email client (Gmail web/mobile, Apple Mail,
// Outlook web/desktop).
export async function svgToPngDataUri(
  svg: string,
  width: number,
  height: number,
): Promise<string> {
  const svgDataUri = svgToDataUri(svg);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('svg load failed'));
    img.src = svgDataUri;
  });
  // Keep 1x to stay well under Gmail's 102KB message clipping threshold.
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Calendar block (inline-styled table so it renders in every email client).
// ---------------------------------------------------------------------------

function renderRolePill(a: MonthAssignment): string {
  const p = TEAM_PILL_EMAIL[a.team] ?? TEAM_PILL_EMAIL.Ops;
  const label = escapeHtml(a.label);
  return `<span style="display:inline-block;background:${p.bg};color:${p.fg};padding:2px 7px;border-radius:4px;font-family:${EMAIL_FONT};font-size:10px;font-weight:500;line-height:14px;margin:2px 2px 0 0;white-space:nowrap;">
    <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:${p.dot};margin-right:4px;vertical-align:middle;"></span>${label}
  </span>`;
}

export function buildCalendarHtml(
  assignments: Record<number, MonthAssignment[]>,
  endOfMonthBalances: number[],
  baseYear: number,
  year = 2026,
): string {
  const yearIdx = year - baseYear;
  if (yearIdx < 0) return '';
  const startMonth = yearIdx * 12;

  const cells: string[] = [];
  for (let i = 0; i < 12; i++) {
    const m = startMonth + i;
    const bal = endOfMonthBalances[m];
    const hires = assignments[m] ?? [];
    const balBg = bal < 0 ? COLOR.redBg : COLOR.greenBg;
    const balFg = bal < 0 ? COLOR.redFg : COLOR.greenFg;
    const pills = hires.map(renderRolePill).join('');
    cells.push(`
      <td valign="top" style="width:25%;padding:6px;">
        <div style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:8px;padding:10px 12px;min-height:96px;font-family:${EMAIL_FONT};">
          <div style="font-size:13px;font-weight:500;color:${COLOR.text};">${MONTH_LABELS[i]}</div>
          <div style="margin-top:6px;font-family:${EMAIL_FONT};font-size:10px;font-weight:500;color:rgba(0,0,0,0.72);background:${COLOR.chipBg};padding:2px 6px;border-radius:4px;display:inline-block;">monthly expenses.</div>
          <div style="margin-top:8px;">${pills || '<span style="font-size:10px;color:' + COLOR.mutedSoft + ';font-style:italic;">no hires</span>'}</div>
          <div style="margin-top:10px;">
            <span style="display:inline-block;background:${balBg};color:${balFg};border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;font-family:${EMAIL_FONT};">${fmtUsd(bal)}</span>
          </div>
        </div>
      </td>`);
  }

  const rows: string[] = [];
  for (let r = 0; r < 3; r++) {
    rows.push(`<tr>${cells.slice(r * 4, r * 4 + 4).join('')}</tr>`);
  }

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;">
  ${rows.join('\n')}
</table>`.trim();
}

// ---------------------------------------------------------------------------
// Yearly expense snapshot.
// ---------------------------------------------------------------------------

export interface YearlyRow {
  year: number;
  baselineBurn: number; // 12x monthly OPEX
  rolePayroll: number; // sum of role annual burn active in this year (monthly-prorated)
  totalBurn: number;
  revenue: number;
  eoyCash: number;
}

export function computeYearlyRows(args: {
  baseYear: number;
  horizonYears: number;
  baselineBurnMonthly: number;
  monthlyRevenue: number[];
  roleBurnByMonth: number[];
  endOfMonthBalances: number[];
}): YearlyRow[] {
  const {
    baseYear,
    horizonYears,
    baselineBurnMonthly,
    monthlyRevenue,
    roleBurnByMonth,
    endOfMonthBalances,
  } = args;

  const rows: YearlyRow[] = [];
  for (let y = 0; y < horizonYears; y++) {
    const start = y * 12;
    let rolePayroll = 0;
    let revenue = 0;
    for (let i = 0; i < 12; i++) {
      rolePayroll += roleBurnByMonth[start + i] ?? 0;
      revenue += monthlyRevenue[start + i] ?? 0;
    }
    const baseline = baselineBurnMonthly * 12;
    rows.push({
      year: baseYear + y,
      baselineBurn: baseline,
      rolePayroll,
      totalBurn: baseline + rolePayroll,
      revenue,
      eoyCash: endOfMonthBalances[start + 11] ?? 0,
    });
  }
  return rows;
}

export function buildYearlyExpensesHtml(rows: YearlyRow[]): string {
  const th = (label: string, align: 'left' | 'right' = 'right') =>
    `<th align="${align}" style="font-family:${EMAIL_FONT};font-size:10px;font-weight:600;color:${COLOR.mutedSoft};text-transform:uppercase;letter-spacing:0.04em;padding:10px 12px;border-bottom:1px solid ${COLOR.border};">${label}</th>`;

  const td = (
    s: string,
    align: 'left' | 'right' = 'right',
    extra = '',
  ) =>
    `<td align="${align}" style="font-family:${EMAIL_FONT};font-size:13px;color:${COLOR.text};padding:12px;border-bottom:1px solid ${COLOR.border};${extra}">${s}</td>`;

  const body = rows
    .map((r) => {
      const eoyBg = r.eoyCash < 0 ? COLOR.redBg : COLOR.greenBg;
      const eoyFg = r.eoyCash < 0 ? COLOR.redFg : COLOR.greenFg;
      const eoyPill = `<span style="display:inline-block;background:${eoyBg};color:${eoyFg};border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;font-family:${EMAIL_FONT};">${fmtUsdFull(r.eoyCash)}</span>`;
      return `
<tr>
  ${td(`<span style="font-weight:600;">${r.year}</span>`, 'left')}
  ${td(fmtUsdFull(r.baselineBurn))}
  ${td(fmtUsdFull(r.rolePayroll))}
  ${td(`<span style="font-weight:600;">${fmtUsdFull(r.totalBurn)}</span>`)}
  ${td(fmtUsdFull(r.revenue))}
  ${td(eoyPill)}
</tr>`;
    })
    .join('');

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:10px;overflow:hidden;">
  <thead>
    <tr>
      ${th('Year', 'left')}
      ${th('Baseline OPEX')}
      ${th('Role payroll')}
      ${th('Total burn')}
      ${th('Revenue')}
      ${th('Cash EOY')}
    </tr>
  </thead>
  <tbody>${body}</tbody>
</table>`.trim();
}

// ---------------------------------------------------------------------------
// Top-level email builder.
// ---------------------------------------------------------------------------

export interface DeckArgs {
  shareUrl: string;
  baseYear: number;
  horizonYears: number;
  startingCash: number;
  runwayMonths: number | null;
  monthlyBalances: number[]; // cash at start of each month, length = horizonYears*12
  endOfMonthBalances: number[]; // cash at end of each month
  roleBurnByMonth: number[]; // monthly role burn
  monthlyRevenue: number[];
  baselineBurnMonthly: number;
  assignments: Record<number, MonthAssignment[]>;
  focusedYearIndex: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function buildDeckEmailHtml(args: DeckArgs): Promise<{
  subject: string;
  html: string;
}> {
  const {
    shareUrl,
    baseYear,
    horizonYears,
    startingCash,
    runwayMonths,
    monthlyBalances,
    endOfMonthBalances,
    roleBurnByMonth,
    monthlyRevenue,
    baselineBurnMonthly,
    assignments,
    focusedYearIndex,
  } = args;

  const lastYear = baseYear + horizonYears - 1;

  const FULL_W = 600;
  const FULL_H = 240;
  const DETAIL_W = 600;
  const DETAIL_H = 220;

  const fullChartSvg = renderRunwayChartSvg({
    balances: monthlyBalances,
    assignments,
    baseYear,
    startMonthIndex: 0,
    xTickMode: 'year',
    width: FULL_W,
    height: FULL_H,
    showYAxis: true,
  });

  const focusStart = focusedYearIndex * 12;
  const focusBalances = monthlyBalances.slice(focusStart, focusStart + 12);
  const focusYear = baseYear + focusedYearIndex;
  const detailChartSvg = renderRunwayChartSvg({
    balances: focusBalances,
    assignments,
    baseYear,
    startMonthIndex: focusStart,
    xTickMode: 'month',
    width: DETAIL_W,
    height: DETAIL_H,
    showYAxis: true,
  });

  const [fullChartImg, detailChartImg] = await Promise.all([
    svgToPngDataUri(fullChartSvg, FULL_W, FULL_H),
    svgToPngDataUri(detailChartSvg, DETAIL_W, DETAIL_H),
  ]);

  const calendarHtml = buildCalendarHtml(assignments, endOfMonthBalances, baseYear, 2026);

  const yearlyRows = computeYearlyRows({
    baseYear,
    horizonYears,
    baselineBurnMonthly,
    monthlyRevenue,
    roleBurnByMonth,
    endOfMonthBalances,
  });
  const expensesHtml = buildYearlyExpensesHtml(yearlyRows);

  const runwayText = fmtRunway(runwayMonths);
  const runwayColor = runwayMonths === null || runwayMonths >= 12
    ? COLOR.greenFg
    : COLOR.redFg;

  const section = (title: string, subtitle: string, body: string) => `
<tr><td style="padding:24px 32px 8px;font-family:${EMAIL_FONT};">
  <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${COLOR.mutedSoft};">${escapeHtml(subtitle)}</div>
  <div style="font-size:18px;font-weight:600;color:${COLOR.text};margin-top:2px;">${escapeHtml(title)}</div>
</td></tr>
<tr><td style="padding:8px 32px 4px;">${body}</td></tr>`;

  const subject = `Your runway plan — ${runwayText} · ${baseYear}–${lastYear}`;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLOR.bg};">
  <tr><td align="center" style="padding:32px 16px;">

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:14px;overflow:hidden;max-width:640px;">

      <!-- Header -->
      <tr><td style="padding:28px 32px 4px;font-family:${EMAIL_FONT};">
        <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${COLOR.mutedSoft};">Headcount plan · ${baseYear}–${lastYear}</div>
        <div style="font-size:28px;font-weight:700;color:${COLOR.text};margin-top:4px;line-height:1.15;">Your runway snapshot</div>
      </td></tr>

      <!-- KPI row -->
      <tr><td style="padding:16px 32px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td valign="top" width="50%" style="padding-right:8px;">
              <div style="background:${COLOR.bg};border:1px solid ${COLOR.border};border-radius:10px;padding:14px 16px;font-family:${EMAIL_FONT};">
                <div style="font-size:12px;color:${COLOR.muted};">Starting cash</div>
                <div style="font-size:22px;font-weight:700;color:${COLOR.text};margin-top:4px;">${fmtUsdFull(startingCash)}</div>
              </div>
            </td>
            <td valign="top" width="50%" style="padding-left:8px;">
              <div style="background:${COLOR.bg};border:1px solid ${COLOR.border};border-radius:10px;padding:14px 16px;font-family:${EMAIL_FONT};">
                <div style="font-size:12px;color:${COLOR.muted};">Runway remaining</div>
                <div style="font-size:22px;font-weight:700;color:${runwayColor};margin-top:4px;">${escapeHtml(runwayText)}</div>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      ${section(
        `${baseYear}–${lastYear} cash runway`,
        'Full horizon',
        `<img src="${fullChartImg}" alt="${baseYear}–${lastYear} cash runway chart" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:1px solid ${COLOR.border};border-radius:10px;" />`,
      )}

      ${section(
        `${focusYear} monthly cash`,
        'Focused year',
        `<img src="${detailChartImg}" alt="${focusYear} monthly cash chart" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:1px solid ${COLOR.border};border-radius:10px;" />`,
      )}

      ${section('2026 hires by month', 'Calendar', calendarHtml)}

      ${section(`${baseYear}–${lastYear} yearly expenses`, 'Snapshot', expensesHtml)}

      <!-- Footer -->
      <tr><td style="padding:24px 32px 32px;font-family:${EMAIL_FONT};">
        <a href="${escapeHtml(shareUrl)}" style="display:inline-block;background:#ff3d00;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Open interactive plan →</a>
        <div style="margin-top:14px;font-size:11px;color:${COLOR.mutedSoft};">Shared from the Warp Headcount Planner.</div>
      </td></tr>

    </table>

  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

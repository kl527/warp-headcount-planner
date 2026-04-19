import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FONT_FAMILIES } from '../../constants/design';
import { TEAM_PILL_DOT } from '../../constants/roleDisplay';
import type { MonthAssignment } from './RolePill';

interface RunwayChartProps {
  balances: number[];
  assignments: Record<number, MonthAssignment[]>;
  baseYear: number;
  /** Absolute month index of balances[0] in the global horizon. */
  startMonthIndex?: number;
  xTickMode?: 'year' | 'month';
  showYAxis?: boolean;
  minHeight?: number;
}

const DEFAULT_MIN_HEIGHT = 140;

const NEUTRAL_STROKE = '#1e1e1e';
const NEGATIVE_STROKE = '#e21200';
const POSITIVE_FILL = 'rgba(0, 133, 0, 0.08)';
const NEGATIVE_FILL = 'rgba(226, 18, 0, 0.1)';
const TICK_COLOR = '#d9d9d9';
const TICK_LABEL = '#8a8a8a';

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function fmtUsd(n: number): string {
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

export function RunwayChart({
  balances,
  assignments,
  baseYear,
  startMonthIndex = 0,
  xTickMode = 'year',
  showYAxis = true,
  minHeight = DEFAULT_MIN_HEIGHT,
}: RunwayChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: 300,
    h: minHeight,
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSize({
      w: Math.max(1, rect.width),
      h: Math.max(minHeight, rect.height),
    });
  }, [minHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({
          w: Math.max(1, width),
          h: Math.max(minHeight, height),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [minHeight]);

  const marginLeft = showYAxis ? 42 : 8;
  const marginRight = 10;
  const marginTop = 10;
  const marginBottom = 20;

  const { w, h } = size;
  const innerW = Math.max(1, w - marginLeft - marginRight);
  const innerH = Math.max(1, h - marginTop - marginBottom);

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

  // X ticks (vertical gridlines + labels).
  const xTicks: { x: number; label: string }[] = [];
  if (xTickMode === 'year') {
    for (let m = 0; m < n; m += 12) {
      const absMonth = startMonthIndex + m;
      xTicks.push({ x: xScale(m), label: String(baseYear + Math.floor(absMonth / 12)) });
    }
  } else {
    for (let m = 0; m < n; m += 1) {
      const absMonth = startMonthIndex + m;
      xTicks.push({ x: xScale(m), label: MONTH_ABBR[absMonth % 12] });
    }
  }

  // Y ticks (horizontal gridlines + $ labels).
  const yTicks = showYAxis ? yScale.ticks(4) : [];

  // Hire markers.
  const hireDots: {
    month: number;
    x: number;
    y: number;
    color: string;
    label: string;
  }[] = [];
  for (const [monthStr, list] of Object.entries(assignments)) {
    const absMonth = Number(monthStr);
    const localMonth = absMonth - startMonthIndex;
    if (localMonth < 0 || localMonth >= n) continue;
    for (const a of list) {
      hireDots.push({
        month: absMonth,
        x: xScale(localMonth),
        y: yScale(balances[localMonth]),
        color: TEAM_PILL_DOT[a.team],
        label: a.label,
      });
    }
  }

  const clipIdPos = `runway-clip-pos-${w}-${h}-${xTickMode}`;
  const clipIdNeg = `runway-clip-neg-${w}-${h}-${xTickMode}`;

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id={clipIdPos}>
            <rect x={0} y={0} width={innerW} height={Math.max(0, zeroY)} />
          </clipPath>
          <clipPath id={clipIdNeg}>
            <rect
              x={0}
              y={Math.max(0, zeroY)}
              width={innerW}
              height={Math.max(0, innerH - Math.max(0, zeroY))}
            />
          </clipPath>
        </defs>

        <g transform={`translate(${marginLeft}, ${marginTop})`}>
          {/* Y-axis gridlines + labels */}
          {yTicks.map((t, i) => {
            const y = yScale(t);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={y}
                  y2={y}
                  stroke={TICK_COLOR}
                  strokeDasharray={t === 0 ? undefined : '2 3'}
                  strokeWidth={t === 0 ? 1 : 0.5}
                  opacity={t === 0 ? 1 : 0.5}
                />
                <text
                  x={-6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: FONT_FAMILIES.mono,
                    fontSize: 9,
                    fontWeight: 500,
                    fill: TICK_LABEL,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtUsd(t)}
                </text>
              </g>
            );
          })}

          {/* X-axis gridlines (vertical) */}
          {xTicks.map((t, i) => {
            const showGrid = xTickMode === 'year' || i % 3 === 0;
            return showGrid ? (
              <line
                key={`xgrid-${i}`}
                x1={t.x}
                x2={t.x}
                y1={0}
                y2={innerH}
                stroke={TICK_COLOR}
                strokeDasharray="2 3"
                strokeWidth={0.5}
                opacity={0.4}
              />
            ) : null;
          })}

          {/* Filled areas above/below zero */}
          <path d={areaPath} fill={POSITIVE_FILL} clipPath={`url(#${clipIdPos})`} />
          <path d={areaPath} fill={NEGATIVE_FILL} clipPath={`url(#${clipIdNeg})`} />

          {/* Line segments: neutral above zero, red below */}
          <path
            d={linePath}
            fill="none"
            stroke={NEUTRAL_STROKE}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#${clipIdPos})`}
          />
          <path
            d={linePath}
            fill="none"
            stroke={NEGATIVE_STROKE}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#${clipIdNeg})`}
          />

          {/* Hire markers */}
          {hireDots.map((d, i) => (
            <circle
              key={`dot-${i}`}
              cx={d.x}
              cy={d.y}
              r={3.5}
              fill="#fff"
              stroke={d.color}
              strokeWidth={1.5}
            >
              <title>{`${d.label} — month ${d.month + 1}`}</title>
            </circle>
          ))}

          {/* X labels */}
          {xTicks.map((t, i) => (
            <text
              key={`xlabel-${i}`}
              x={t.x}
              y={innerH + 12}
              textAnchor={xTickMode === 'month' ? 'middle' : i === 0 ? 'start' : 'middle'}
              style={{
                fontFamily: FONT_FAMILIES.sans,
                fontSize: 9,
                fontWeight: 600,
                fill: TICK_LABEL,
              }}
            >
              {t.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

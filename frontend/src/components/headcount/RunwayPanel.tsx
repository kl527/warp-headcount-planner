import { CalendarRange, TrendingDown } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import type { FinancialInputs } from './FinancialInputsRow';
import type { MonthAssignment } from './RolePill';
import { FundraisingCard } from './FundraisingCard';
import { RunwayChart } from './RunwayChart';
import { RunwayInsightCard } from './RunwayInsightCard';

interface RunwayPanelProps {
  runwayMonths: number | null;
  balances: number[];
  endOfMonthBalances: number[];
  assignments: Record<number, MonthAssignment[]>;
  baseYear: number;
  focusedYearIndex: number;
  financials: FinancialInputs;
}

const CHART_CARD_HEIGHT = 200;
const STACK_PEEK = 14;
const STACK_GAP = 14;
const MAX_VISIBLE_STACK = 2;

function ChartHeader({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#f5fcf3',
        borderRadius: 20,
        height: 21,
        padding: '0 12px',
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 10,
        fontWeight: 600,
        color: '#008500',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex' }}>
        {icon}
      </span>
      {text}
    </span>
  );
}

function StackedChartCards({ items }: { items: ReactNode[] }) {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const total = items.length;
  const visibleInStack = Math.min(MAX_VISIBLE_STACK, total);
  const collapsedH =
    CHART_CARD_HEIGHT + STACK_PEEK * Math.max(0, visibleInStack - 1);
  const expandedH =
    total * CHART_CARD_HEIGHT + Math.max(0, total - 1) * STACK_GAP;

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={expanded ? 'Collapse runway charts' : 'Expand runway charts'}
      onClick={() => setExpanded((v) => !v)}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setExpanded(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        setExpanded(false);
      }}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setExpanded(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
      style={{
        position: 'relative',
        height: expanded ? expandedH : collapsedH,
        transition: 'height 450ms ease',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {items.map((item, i) => {
        const clampedPos = Math.min(i, MAX_VISIBLE_STACK - 1);
        const collapsedTop = clampedPos * STACK_PEEK;
        const expandedTop = i * (CHART_CARD_HEIGHT + STACK_GAP);
        const top = expanded ? expandedTop : collapsedTop;
        const scale = expanded ? 1 : 1 - clampedPos * 0.02;
        const hiddenInStack = !expanded && i >= MAX_VISIBLE_STACK;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: CHART_CARD_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              zIndex: total - i,
              opacity: hiddenInStack ? 0 : 1,
              transition:
                'top 450ms ease, transform 450ms ease, opacity 300ms ease',
              pointerEvents: hiddenInStack ? 'none' : 'auto',
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        height: '100%',
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        padding: '14px 14px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      {header}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

export function RunwayPanel({
  runwayMonths,
  balances,
  endOfMonthBalances,
  assignments,
  baseYear,
  focusedYearIndex,
  financials,
}: RunwayPanelProps) {
  const focusStart = focusedYearIndex * 12;
  const focusYear = baseYear + focusedYearIndex;
  const focusBalances = balances.slice(focusStart, focusStart + 12);
  const horizonYears = Math.max(1, Math.round(balances.length / 12));
  const lastYear = baseYear + horizonYears - 1;

  return (
    <aside
      className="flex-shrink-0"
      style={{
        width: '100%',
        maxWidth: 318,
        background: '#f9f9f9',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: '19px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 15,
          fontWeight: 500,
          color: '#000',
        }}
      >
        Runway
      </span>

      <FundraisingCard
        runwayMonths={runwayMonths}
        endOfMonthBalances={endOfMonthBalances}
        baseYear={baseYear}
      />

      <StackedChartCards
        items={[
          <ChartCard
            key="horizon"
            header={
              <ChartHeader
                icon={<TrendingDown size={11} strokeWidth={2.2} />}
                text={`${baseYear}–${lastYear} cash runway`}
              />
            }
          >
            <RunwayChart
              balances={balances}
              assignments={assignments}
              baseYear={baseYear}
              startMonthIndex={0}
              xTickMode="year"
              showYAxis
              minHeight={140}
            />
          </ChartCard>,
          <ChartCard
            key="focus"
            header={
              <ChartHeader
                icon={<CalendarRange size={11} strokeWidth={2.2} />}
                text={`${focusYear} monthly cash`}
              />
            }
          >
            <RunwayChart
              balances={focusBalances}
              assignments={assignments}
              baseYear={baseYear}
              startMonthIndex={focusStart}
              xTickMode="month"
              showYAxis
              minHeight={140}
            />
          </ChartCard>,
        ]}
      />

      <RunwayInsightCard
        companyBalance={financials.companyBalance}
        mrr={financials.mrr}
        momGrowthPct={financials.momGrowthPct}
        runwayMonths={runwayMonths}
      />
    </aside>
  );
}

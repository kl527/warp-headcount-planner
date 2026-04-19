import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { getBackendBaseUrl } from '../../lib/backend';

interface RunwayInsightCardProps {
  companyBalance: number;
  mrr: number;
  momGrowthPct: number;
  runwayMonths: number | null;
}

const DEBOUNCE_MS = 600;

function Header() {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#f5f1ff',
        borderRadius: 20,
        height: 21,
        padding: '0 12px',
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 10,
        fontWeight: 600,
        color: '#6b3fa0',
        whiteSpace: 'nowrap',
      }}
    >
      <Sparkles size={11} strokeWidth={2.2} />
      Insight
    </span>
  );
}

export function RunwayInsightCard({
  companyBalance,
  mrr,
  momGrowthPct,
  runwayMonths,
}: RunwayInsightCardProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(false);
      fetch(`${getBackendBaseUrl()}/runway-insight`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyBalance, mrr, momGrowthPct, runwayMonths }),
        signal: ctrl.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error(`status ${r.status}`);
          return r.json();
        })
        .then((data: { insight?: string }) => {
          if (typeof data.insight === 'string' && data.insight.length > 0) {
            setInsight(data.insight);
          } else {
            setError(true);
          }
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setError(true);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [companyBalance, mrr, momGrowthPct, runwayMonths]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const showSkeleton = loading && insight === null;
  const body =
    showSkeleton
      ? null
      : error && insight === null
        ? 'Adjust a value to see an insight.'
        : insight;

  return (
    <div
      style={{
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Header />
      {showSkeleton ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            opacity: 0.6,
          }}
        >
          <div style={{ height: 10, background: '#ececec', borderRadius: 4 }} />
          <div style={{ height: 10, background: '#ececec', borderRadius: 4, width: '78%' }} />
          <div style={{ height: 10, background: '#ececec', borderRadius: 4, width: '54%' }} />
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 12,
            fontWeight: 500,
            color: error ? '#8a8a8a' : '#1e1e1e',
            lineHeight: 1.4,
            opacity: loading ? 0.65 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

import { CornerDownLeft, Pencil, Undo2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { getBackendBaseUrl } from '../../lib/backend';
import { fmtUsd } from '../../lib/emailDeck';
import {
  deriveMetrics,
  HORIZON_MONTHS,
  type DerivedMetrics,
} from '../../lib/scenarioMath';
import {
  decodeShareUrl,
  encodeState,
  type ShareableState,
} from '../../lib/shareState';
import type { LocationKey, RoleFamily } from '../../lib/salaryApi';

const EMAIL_CACHE_KEY = 'warp.compare.email';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SavedScenario {
  id: number;
  name: string | null;
  shareUrl: string;
  createdAt: string;
}

interface CompareStripProps {
  currentState: ShareableState;
  families: RoleFamily[] | null;
  locationMultiplier: number;
  locationsMap: Record<string, number> | null;
  detectedLocation: LocationKey | null;
  savedScenarios: SavedScenario[] | null;
  onSavedScenariosChange: (next: SavedScenario[] | null) => void;
  onLoad: (state: Partial<ShareableState>) => void;
  canRevert: boolean;
  onRevert: () => void;
}

function loadCachedEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(EMAIL_CACHE_KEY);
    return raw && EMAIL_RE.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

function cacheEmail(email: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (email) window.localStorage.setItem(EMAIL_CACHE_KEY, email);
    else window.localStorage.removeItem(EMAIL_CACHE_KEY);
  } catch {
    // ignore
  }
}

function fmtRunway(runwayMonths: number | null): {
  text: string;
  color: string;
} {
  if (runwayMonths === null) return { text: 'Cash-flow positive', color: '#008500' };
  if (runwayMonths <= 0) return { text: '0 mo', color: '#e21200' };
  if (runwayMonths >= 12) return { text: '12+ mo', color: '#008500' };
  return { text: `${runwayMonths.toFixed(1)} mo`, color: '#e21200' };
}

function fmtRelative(createdAt: string): string {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return '';
  const deltaSec = Math.max(0, (Date.now() - then) / 1000);
  if (deltaSec < 60) return 'just now';
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)}m ago`;
  if (deltaSec < 86_400) return `${Math.round(deltaSec / 3600)}h ago`;
  if (deltaSec < 604_800) return `${Math.round(deltaSec / 86_400)}d ago`;
  return new Date(createdAt).toLocaleDateString();
}

export function CompareStrip(props: CompareStripProps) {
  const {
    currentState,
    families,
    locationMultiplier,
    locationsMap,
    detectedLocation,
    savedScenarios,
    onSavedScenariosChange,
    onLoad,
    canRevert,
    onRevert,
  } = props;

  const [email, setEmail] = useState<string | null>(loadCachedEmail);
  const [draftEmail, setDraftEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const loading = email !== null && savedScenarios === null;

  useEffect(() => {
    if (!email || savedScenarios !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${getBackendBaseUrl()}/share-emails?email=${encodeURIComponent(email)}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setError(`Could not load scenarios (${res.status})`);
          onSavedScenariosChange([]);
          return;
        }
        const data = (await res.json()) as { scenarios: SavedScenario[] };
        if (cancelled) return;
        setError(null);
        onSavedScenariosChange(data.scenarios ?? []);
      } catch (err) {
        console.error('[compare] fetch failed', err);
        if (cancelled) return;
        setError('Could not load scenarios');
        onSavedScenariosChange([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, savedScenarios, onSavedScenariosChange]);

  const handleSignIn = () => {
    const trimmed = draftEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) return;
    setEmail(trimmed);
    cacheEmail(trimmed);
    onSavedScenariosChange(null);
  };

  const handleSwitchEmail = () => {
    cacheEmail(null);
    setEmail(null);
    setDraftEmail('');
    onSavedScenariosChange(null);
  };

  const handleRename = async (id: number, name: string) => {
    if (!email || id <= 0) return; // local placeholders not yet in DB
    try {
      const res = await fetch(
        `${getBackendBaseUrl()}/share-emails/${id}/name`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, name }),
        },
      );
      if (!res.ok) {
        console.error('[compare] rename failed', res.status);
        return;
      }
    } catch (err) {
      console.error('[compare] rename error', err);
      return;
    }
    onSavedScenariosChange(
      (savedScenarios ?? []).map((s) =>
        s.id === id ? { ...s, name: name.length > 0 ? name : null } : s,
      ),
    );
  };

  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    const t = window.setTimeout(() => setSaveState('idle'), 1800);
    return () => window.clearTimeout(t);
  }, [saveState]);

  const handleSaveCurrent = async () => {
    if (!email || saveState === 'saving') return;
    setSaveState('saving');
    const encoded = encodeState(currentState);
    const { origin, pathname } = window.location;
    const shareUrl = `${origin}${pathname}?state=${encoded}`;
    const scenarioName = `Plan · ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date())}`;
    try {
      const res = await fetch(`${getBackendBaseUrl()}/share-emails`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, shareUrl, scenarioName }),
      });
      if (!res.ok) {
        console.error('[compare] save failed', res.status);
        setSaveState('error');
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        id?: number | null;
      };
      const newEntry: SavedScenario = {
        id: typeof data.id === 'number' ? data.id : -Date.now(),
        name: scenarioName,
        shareUrl,
        createdAt: new Date().toISOString(),
      };
      onSavedScenariosChange([newEntry, ...(savedScenarios ?? [])]);
      setSaveState('saved');
    } catch (err) {
      console.error('[compare] save error', err);
      setSaveState('error');
    }
  };

  const currentLocKey =
    currentState.manualLocation ?? detectedLocation ?? 'SF';
  const currentMultiplier =
    locationsMap?.[currentLocKey] ?? locationMultiplier;
  const currentMetrics = deriveMetrics({
    state: currentState,
    families,
    locationMultiplier: currentMultiplier,
  });

  return (
    <section
      className="mt-[40px] flex flex-col gap-[14px]"
      style={{ fontFamily: FONT_FAMILIES.sans }}
    >
      <Header
        email={email}
        savedCount={savedScenarios?.length ?? 0}
        onSwitchEmail={handleSwitchEmail}
      />
      {email === null ? (
        <SignInGate
          value={draftEmail}
          onChange={setDraftEmail}
          onSubmit={handleSignIn}
        />
      ) : (
        <div className="flex flex-row gap-[12px] overflow-x-auto pb-[4px]">
          <CurrentTile
            metrics={currentMetrics}
            canRevert={canRevert}
            onRevert={onRevert}
            canSave={email !== null && !canRevert}
            saveState={saveState}
            onSave={handleSaveCurrent}
          />
          {loading && savedScenarios === null ? (
            <SkeletonTiles />
          ) : (
            (savedScenarios ?? []).map((s) => (
              <SavedTile
                key={s.id}
                scenario={s}
                families={families}
                locationsMap={locationsMap}
                detectedLocation={detectedLocation}
                onRename={handleRename}
                onLoad={onLoad}
              />
            ))
          )}
          {!loading &&
          savedScenarios !== null &&
          savedScenarios.length === 0 ? (
            <EmptyHint />
          ) : null}
        </div>
      )}
      {error ? (
        <div style={{ fontSize: 12, color: '#850000' }}>{error}</div>
      ) : null}
    </section>
  );
}

function Header({
  email,
  savedCount,
  onSwitchEmail,
}: {
  email: string | null;
  savedCount: number;
  onSwitchEmail: () => void;
}) {
  return (
    <div className="flex flex-row items-baseline gap-[12px]">
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#202020',
          margin: 0,
        }}
      >
        Compare scenarios
      </h2>
      {email ? (
        <span
          style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.55)' }}
        >
          {email} · {savedCount} saved
          <button
            type="button"
            onClick={onSwitchEmail}
            style={{
              marginLeft: 10,
              background: 'transparent',
              border: 'none',
              color: 'rgba(0, 0, 0, 0.45)',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              fontSize: 12,
            }}
          >
            switch email
          </button>
        </span>
      ) : null}
    </div>
  );
}

const GATE_INPUT_HEIGHT = 32;
const GATE_INPUT_WIDTH = 240;

function SignInGate({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const canSubmit = EMAIL_RE.test(value.trim());
  return (
    <div className="flex flex-col gap-[10px]">
      <span
        style={{
          fontSize: 13,
          color: 'rgba(0, 0, 0, 0.65)',
          fontFamily: FONT_FAMILIES.sans,
        }}
      >
        enter your email to view scenarios you've saved
      </span>
      <div
        className="inline-flex items-center"
        style={{
          width: GATE_INPUT_WIDTH,
          height: GATE_INPUT_HEIGHT,
          background: 'var(--color-card)',
          color: 'var(--color-gray-12)',
          border: '0.5px solid rgba(0, 0, 0, 0.3)',
          borderRadius: RADIUS.lg,
          paddingLeft: 12,
          paddingRight: 10,
          gap: 6,
          overflow: 'hidden',
        }}
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="sample@email.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            height: GATE_INPUT_HEIGHT - 2,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: FONT_FAMILIES.brand,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-gray-12)',
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          aria-label="View saved scenarios"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center"
          style={{
            flexShrink: 0,
            height: GATE_INPUT_HEIGHT - 2,
            padding: 0,
            background: 'transparent',
            color: canSubmit ? 'var(--color-gray-12)' : 'var(--color-gray-10)',
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'default',
            outline: 'none',
          }}
        >
          <CornerDownLeft size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function EmptyHint() {
  return (
    <div
      style={{
        alignSelf: 'stretch',
        flex: 1,
        minWidth: 220,
        padding: '18px 16px',
        background: '#fafafa',
        border: '0.5px dashed #d9d9d9',
        borderRadius: RADIUS.xl,
        fontSize: 12,
        color: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      Hit Share above to email yourself this scenario — it'll save here for
      comparison.
    </div>
  );
}

function SkeletonTiles() {
  return (
    <>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            width: 208,
            height: 180,
            background: '#f5f5f5',
            borderRadius: RADIUS.xl,
          }}
        />
      ))}
    </>
  );
}

const TILE_WIDTH = 208;

function TileShell({
  children,
  accentLeft,
}: {
  children: React.ReactNode;
  accentLeft?: boolean;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: TILE_WIDTH,
        minHeight: 180,
        background: '#fff',
        border: '0.5px solid #ececec',
        borderLeft: accentLeft
          ? '2px solid #ff3d00'
          : '0.5px solid #ececec',
        borderRadius: RADIUS.xl,
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        fontFamily: FONT_FAMILIES.sans,
      }}
    >
      {children}
    </div>
  );
}

function Sparkline({ balances }: { balances: number[] }) {
  const width = 180;
  const height = 36;
  if (balances.length < 2) return <div style={{ height }} />;
  const min = Math.min(...balances, 0);
  const max = Math.max(...balances, 0);
  const pad = (max - min) * 0.08 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const x = (i: number) => (i / (balances.length - 1)) * width;
  const y = (v: number) => height - ((v - lo) / (hi - lo)) * height;
  const pts = balances.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const zeroY = y(0);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
    >
      <line
        x1={0}
        x2={width}
        y1={zeroY}
        y2={zeroY}
        stroke="#d9d9d9"
        strokeDasharray="2 3"
        strokeWidth={0.5}
      />
      <polyline
        fill="none"
        stroke="#202020"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(' ')}
      />
    </svg>
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'rgba(0, 0, 0, 0.55)' }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          color: color ?? '#202020',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function CurrentTile({
  metrics,
  canRevert,
  onRevert,
  canSave,
  saveState,
  onSave,
}: {
  metrics: DerivedMetrics;
  canRevert: boolean;
  onRevert: () => void;
  canSave: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  onSave: () => void;
}) {
  const runway = fmtRunway(metrics.runwayMonths);
  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved!'
        : saveState === 'error'
          ? 'Failed'
          : 'Save';
  const saveDisabled = !canSave || saveState === 'saving';
  return (
    <TileShell accentLeft>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#202020',
          }}
        >
          Current
        </span>
        {canRevert ? (
          <button
            type="button"
            onClick={onRevert}
            title="Revert to the state before loading a saved scenario"
            className="inline-flex items-center"
            style={{
              height: 22,
              gap: 4,
              padding: '0 8px',
              background: 'transparent',
              border: '0.5px solid rgba(0, 0, 0, 0.2)',
              borderRadius: RADIUS.sm,
              color: '#202020',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            <Undo2 size={10} strokeWidth={2.25} />
            Revert
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            title={
              canSave
                ? 'Save this scenario to your email'
                : 'Sign in with email to save scenarios'
            }
            className="inline-flex items-center"
            style={{
              height: 22,
              padding: '0 8px',
              background:
                saveState === 'saved'
                  ? '#202020'
                  : saveState === 'error'
                    ? '#691410'
                    : canSave
                      ? '#ff3d00'
                      : '#f2f2f2',
              color:
                saveState === 'saved' || saveState === 'error'
                  ? '#fff'
                  : canSave
                    ? '#fff'
                    : 'rgba(0,0,0,0.4)',
              border: 'none',
              borderRadius: RADIUS.sm,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: saveDisabled ? 'default' : 'pointer',
              transition: 'background 160ms ease, color 160ms ease',
            }}
          >
            {saveLabel}
          </button>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          color: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        {canRevert ? 'viewing saved · edits paused' : 'live · editing now'}
      </span>
      <Sparkline balances={metrics.balances} />
      <MetricRow label="Runway" value={runway.text} color={runway.color} />
      <MetricRow label="End cash" value={fmtUsd(metrics.endingCash)} />
      <MetricRow label="Peak burn" value={fmtUsd(metrics.peakMonthlyBurn)} />
      <MetricRow label="Hires" value={String(metrics.totalHires)} />
    </TileShell>
  );
}

function SavedTile({
  scenario,
  families,
  locationsMap,
  detectedLocation,
  onRename,
  onLoad,
}: {
  scenario: SavedScenario;
  families: RoleFamily[] | null;
  locationsMap: Record<string, number> | null;
  detectedLocation: LocationKey | null;
  onRename: (id: number, name: string) => void;
  onLoad: (state: Partial<ShareableState>) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(scenario.name ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const decoded = decodeShareUrl(scenario.shareUrl);
  const metrics = computeTileMetrics(
    decoded,
    families,
    locationsMap,
    detectedLocation,
  );

  const commitRename = () => {
    const next = draftName.trim().slice(0, 60);
    setRenaming(false);
    if (next === (scenario.name ?? '')) return;
    onRename(scenario.id, next);
  };

  const handleLoad = () => {
    if (!decoded) return;
    onLoad(decoded);
  };

  const runway = metrics
    ? fmtRunway(metrics.runwayMonths)
    : { text: '—', color: '#8a8a8a' };

  return (
    <TileShell>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {renaming ? (
          <input
            ref={inputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitRename();
              } else if (e.key === 'Escape') {
                setDraftName(scenario.name ?? '');
                setRenaming(false);
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              height: 22,
              padding: '0 4px',
              border: '0.5px solid rgba(0,0,0,0.3)',
              borderRadius: RADIUS.sm,
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftName(scenario.name ?? '');
              setRenaming(true);
            }}
            title="Rename"
            style={{
              flex: 1,
              minWidth: 0,
              padding: 0,
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              fontSize: 13,
              fontWeight: 600,
              color: '#202020',
              cursor: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {scenario.name ?? 'Untitled'}
            </span>
            <Pencil size={10} strokeWidth={2} color="rgba(0,0,0,0.4)" />
          </button>
        )}
        <button
          type="button"
          onClick={handleLoad}
          disabled={!decoded}
          title={decoded ? 'Load into editor' : 'Cannot decode'}
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: decoded ? '#202020' : '#c0c0c0',
            cursor: decoded ? 'pointer' : 'default',
            padding: 0,
            borderRadius: RADIUS.sm,
          }}
        >
          <Upload size={13} strokeWidth={2} />
        </button>
      </div>
      <span style={{ fontSize: 11, color: 'rgba(0, 0, 0, 0.5)' }}>
        {fmtRelative(scenario.createdAt)}
      </span>
      {metrics ? (
        <>
          <Sparkline balances={metrics.balances} />
          <MetricRow label="Runway" value={runway.text} color={runway.color} />
          <MetricRow label="End cash" value={fmtUsd(metrics.endingCash)} />
          <MetricRow
            label="Peak burn"
            value={fmtUsd(metrics.peakMonthlyBurn)}
          />
          <MetricRow label="Hires" value={String(metrics.totalHires)} />
        </>
      ) : (
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
          Could not decode saved state.
        </span>
      )}
    </TileShell>
  );
}

function computeTileMetrics(
  decoded: Partial<ShareableState> | null,
  families: RoleFamily[] | null,
  locationsMap: Record<string, number> | null,
  detectedLocation: LocationKey | null,
): DerivedMetrics | null {
  if (!decoded) return null;
  if (!decoded.financials || !decoded.expenseValues || !decoded.assignments) {
    return null;
  }
  const locKey =
    (decoded.manualLocation as LocationKey | null | undefined) ??
    detectedLocation ??
    ('SF' as LocationKey);
  const multiplier = locationsMap?.[locKey] ?? 1;
  const state: Pick<
    ShareableState,
    'financials' | 'expenseValues' | 'assignments' | 'roleSalaryOverrides'
  > = {
    financials: decoded.financials,
    expenseValues: decoded.expenseValues,
    assignments: decoded.assignments,
    roleSalaryOverrides: decoded.roleSalaryOverrides ?? {},
  };
  const metrics = deriveMetrics({
    state,
    families,
    locationMultiplier: multiplier,
  });
  // The tile sparkline expects exactly HORIZON_MONTHS points.
  if (metrics.balances.length !== HORIZON_MONTHS) return null;
  return metrics;
}

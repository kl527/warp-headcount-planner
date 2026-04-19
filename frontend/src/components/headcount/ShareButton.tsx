import { Check, CornerDownLeft, Loader2, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { getBackendBaseUrl } from '../../lib/backend';
import { track } from '../../lib/analytics';

export interface SendDeckResult {
  url: string;
  subject: string;
  html: string;
  scenarioName: string;
}

interface ShareButtonProps {
  onShare: () => Promise<SendDeckResult>;
  onSent?: (entry: {
    email: string;
    name: string;
    shareUrl: string;
    createdAt: string;
  }) => void;
}

type Mode = 'idle' | 'input' | 'sending' | 'sent' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEIGHT = 32;
const IDLE_WIDTH = 104;
const INPUT_WIDTH = 240;
const SENDING_WIDTH = 150;
const SENT_WIDTH = 164;
const ERROR_WIDTH = 180;
const MORPH_DURATION = 320;
const MORPH_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

async function copyToClipboard(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    return;
  } catch {
    // fall through
  }
  const ta = document.createElement('textarea');
  ta.value = url;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // ignore
  }
  document.body.removeChild(ta);
}

export function ShareButton({ onShare, onSent }: ShareButtonProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const changeDebounceRef = useRef<number | null>(null);

  const handleEmailChange = (next: string) => {
    setEmail(next);
    if (changeDebounceRef.current !== null) {
      window.clearTimeout(changeDebounceRef.current);
    }
    changeDebounceRef.current = window.setTimeout(() => {
      const trimmed = next.trim();
      track.emailInputChanged({
        valid: EMAIL_RE.test(trimmed),
        length: trimmed.length,
      });
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (changeDebounceRef.current !== null) {
        window.clearTimeout(changeDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode === 'input') {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'sent' && mode !== 'error') return;
    const t = setTimeout(() => {
      setMode('idle');
      setEmail('');
    }, mode === 'sent' ? 2200 : 2600);
    return () => clearTimeout(t);
  }, [mode]);

  const handleOpen = () => {
    if (mode === 'idle') {
      setMode('input');
      track.shareButtonClicked();
    }
  };

  const trySubmit = async () => {
    const trimmed = email.trim();
    const valid = EMAIL_RE.test(trimmed);
    track.emailSubmitAttempted({ valid });
    if (!valid) {
      track.emailValidationFailed();
      inputRef.current?.focus();
      return;
    }
    if (mode === 'sending') return;
    setMode('sending');
    let deck: SendDeckResult;
    try {
      deck = await onShare();
    } catch (err) {
      console.error('[share] deck build failed', err);
      track.shareDeckFailed({ stage: 'build' });
      setMode('error');
      return;
    }
    const { url, subject, html, scenarioName } = deck;
    // Clipboard as a bonus — independent of send success.
    void copyToClipboard(url);
    try {
      const res = await fetch(`${getBackendBaseUrl()}/share-deck`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          shareUrl: url,
          subject,
          html,
          scenarioName,
        }),
      });
      if (!res.ok) {
        console.error('[share] send failed', res.status, await res.text());
        track.shareDeckFailed({ stage: 'server' });
        setMode('error');
        return;
      }
      onSent?.({
        email: trimmed.toLowerCase(),
        name: scenarioName,
        shareUrl: url,
        createdAt: new Date().toISOString(),
      });
      track.shareDeckSent({
        scenario_name: scenarioName,
        email: trimmed.toLowerCase(),
      });
      setMode('sent');
    } catch (err) {
      console.error('[share] send error', err);
      track.shareDeckFailed({ stage: 'network' });
      setMode('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void trySubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMode('idle');
      setEmail('');
    }
  };

  const width =
    mode === 'input'
      ? INPUT_WIDTH
      : mode === 'sending'
        ? SENDING_WIDTH
        : mode === 'sent'
          ? SENT_WIDTH
          : mode === 'error'
            ? ERROR_WIDTH
            : IDLE_WIDTH;

  const successBg = 'var(--color-gray-12)';
  const errorBg = '#691410';
  const baseBg = 'var(--color-card)';
  const bg =
    mode === 'sent'
      ? successBg
      : mode === 'error'
        ? errorBg
        : baseBg;
  const fg =
    mode === 'sent' || mode === 'error' ? '#fff' : 'var(--color-gray-12)';

  return (
    <div
      className="relative inline-flex items-center"
      style={{
        height: HEIGHT,
        width,
        background: bg,
        color: fg,
        border: '0.5px solid rgba(0, 0, 0, 0.3)',
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        transition: `width ${MORPH_DURATION}ms ${MORPH_EASING}, background 200ms ease, color 200ms ease`,
      }}
    >
      <IdleFace active={mode === 'idle'} onClick={handleOpen} />
      <InputFace
        active={mode === 'input'}
        email={email}
        onEmailChange={handleEmailChange}
        onFocus={() => track.emailInputFocused()}
        onKeyDown={handleKeyDown}
        onSubmit={() => void trySubmit()}
        canSubmit={EMAIL_RE.test(email.trim())}
        inputRef={inputRef}
      />
      <CenterFace
        active={mode === 'sending'}
        icon={<Loader2 size={14} strokeWidth={2.25} className="share-spin" />}
        label="Sending…"
      />
      <CenterFace
        active={mode === 'sent'}
        icon={<Check size={14} strokeWidth={2.25} />}
        label="Sent to inbox!"
      />
      <CenterFace
        active={mode === 'error'}
        icon={null}
        label="Send failed — link copied"
      />
      <style>{`@keyframes share-spin { to { transform: rotate(360deg); } }
.share-spin { animation: share-spin 0.9s linear infinite; }`}</style>
    </div>
  );
}

function IdleFace({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share plan"
      tabIndex={active ? 0 : -1}
      className="absolute inset-0 inline-flex items-center justify-center cursor-pointer"
      style={{
        gap: 7,
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        fontFamily: FONT_FAMILIES.brand,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: `${HEIGHT}px`,
        padding: '0 14px',
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
        transition: `opacity ${MORPH_DURATION / 2}ms ease ${active ? MORPH_DURATION / 2 : 0}ms`,
        outline: 'none',
      }}
    >
      <Share2 size={14} strokeWidth={2.25} />
      <span>Share</span>
    </button>
  );
}

function InputFace({
  active,
  email,
  onEmailChange,
  onFocus,
  onKeyDown,
  onSubmit,
  canSubmit,
  inputRef,
}: {
  active: boolean;
  email: string;
  onEmailChange: (v: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      aria-hidden={!active}
      className="absolute inset-0 inline-flex items-center"
      style={{
        paddingLeft: 12,
        paddingRight: 10,
        gap: 6,
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
        transition: `opacity ${MORPH_DURATION / 2}ms ease ${active ? MORPH_DURATION / 2 : 0}ms`,
      }}
    >
      <input
        ref={inputRef}
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        placeholder="send deck to email…"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        tabIndex={active ? 0 : -1}
        style={{
          flex: 1,
          minWidth: 0,
          height: HEIGHT - 2,
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
        aria-label="Send deck to email"
        tabIndex={active ? 0 : -1}
        disabled={!canSubmit}
        className="inline-flex items-center justify-center"
        style={{
          flexShrink: 0,
          height: HEIGHT - 2,
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
  );
}

function CenterFace({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      aria-hidden={!active}
      className="absolute inset-0 inline-flex items-center justify-center"
      style={{
        gap: 7,
        padding: '0 14px',
        fontFamily: FONT_FAMILIES.brand,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: `${HEIGHT}px`,
        color: 'inherit',
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
        whiteSpace: 'nowrap',
        transition: `opacity ${MORPH_DURATION / 2}ms ease ${active ? MORPH_DURATION / 2 : 0}ms`,
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

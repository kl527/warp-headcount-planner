import { Check, CornerDownLeft, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { getBackendBaseUrl } from '../../lib/backend';

interface ShareButtonProps {
  onShare: () => string;
}

type Mode = 'idle' | 'input' | 'copied';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEIGHT = 32;
const IDLE_WIDTH = 104;
const INPUT_WIDTH = 220;
const COPIED_WIDTH = 138;
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

export function ShareButton({ onShare }: ShareButtonProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mode === 'input') {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'copied') return;
    const t = setTimeout(() => {
      setMode('idle');
      setEmail('');
    }, 1800);
    return () => clearTimeout(t);
  }, [mode]);

  const handleOpen = () => {
    if (mode === 'idle') setMode('input');
  };

  const trySubmit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      inputRef.current?.focus();
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const url = onShare();
    await copyToClipboard(url);
    try {
      await fetch(`${getBackendBaseUrl()}/share-emails`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed, shareUrl: url }),
      });
    } catch (err) {
      console.error('[share] email save failed', err);
    }
    setSubmitting(false);
    setMode('copied');
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
    mode === 'input' ? INPUT_WIDTH : mode === 'copied' ? COPIED_WIDTH : IDLE_WIDTH;

  const copiedBg = 'var(--color-gray-12)';
  const baseBg = 'var(--color-card)';

  return (
    <div
      className="relative inline-flex items-center"
      style={{
        height: HEIGHT,
        width,
        background: mode === 'copied' ? copiedBg : baseBg,
        color: mode === 'copied' ? '#fff' : 'var(--color-gray-12)',
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
        onEmailChange={setEmail}
        onKeyDown={handleKeyDown}
        onSubmit={() => void trySubmit()}
        canSubmit={EMAIL_RE.test(email.trim()) && !submitting}
        inputRef={inputRef}
      />
      <CopiedFace active={mode === 'copied'} />
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
  onKeyDown,
  onSubmit,
  canSubmit,
  inputRef,
}: {
  active: boolean;
  email: string;
  onEmailChange: (v: string) => void;
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
        placeholder="sample@email.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
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
        aria-label="Submit email and copy link"
        tabIndex={active ? 0 : -1}
        disabled={!canSubmit}
        className="inline-flex items-center justify-center"
        style={{
          flexShrink: 0,
          height: HEIGHT - 2,
          padding: 0,
          background: 'transparent',
          color: 'var(--color-gray-10)',
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

function CopiedFace({ active }: { active: boolean }) {
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
        transition: `opacity ${MORPH_DURATION / 2}ms ease ${active ? MORPH_DURATION / 2 : 0}ms`,
      }}
    >
      <Check size={14} strokeWidth={2.25} />
      <span>Link copied!</span>
    </div>
  );
}

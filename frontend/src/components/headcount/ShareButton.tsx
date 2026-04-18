import { Check, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';

interface ShareButtonProps {
  onShare: () => string;
}

export function ShareButton({ onShare }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const handleClick = async () => {
    const url = onShare();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
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
    setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Copy share link"
      title={copied ? 'Link copied' : 'Copy share link'}
      className="inline-flex items-center justify-center cursor-pointer"
      style={{
        height: 32,
        padding: '0 14px',
        gap: 7,
        background: copied ? 'var(--color-gray-12)' : 'var(--color-card)',
        color: copied ? '#fff' : 'var(--color-gray-12)',
        border: '0.5px solid rgba(0, 0, 0, 0.3)',
        borderRadius: RADIUS.lg,
        fontFamily: FONT_FAMILIES.brand,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: '32px',
        transition: 'background 160ms ease, color 160ms ease',
        outline: 'none',
      }}
    >
      {copied ? <Check size={14} strokeWidth={2.25} /> : <Share2 size={14} strokeWidth={2.25} />}
      <span>{copied ? 'Copied' : 'Share'}</span>
    </button>
  );
}

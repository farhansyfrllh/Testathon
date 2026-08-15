import { useState, useCallback, useRef } from 'react';
import type { QuestionOption } from '../../types';

interface McqCardProps {
  option: QuestionOption;
  /** Letter label shown in the left badge: A, B, C, D … */
  label: string;
  isSelected: boolean;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

/**
 * McqCard — single-select pixel-art option card.
 *
 * Visual states:
 *  - default  : gray border (#334), dark background
 *  - hover    : white border (#e0e0e0), scale 1.02
 *  - selected : gold border (#FFD700), subtle gold background glow
 *  - disabled : reduced opacity, no pointer events
 *
 * Accessibility: role="radio", aria-checked, keyboard (Enter / Space)
 */
export default function McqCard({
  option,
  label,
  isSelected,
  onSelect,
  disabled = false,
}: McqCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const bounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Bounce animation helper ─────────────────────────── */
  const triggerBounce = useCallback(() => {
    if (bounceTimer.current) clearTimeout(bounceTimer.current);
    setIsBouncing(true);
    bounceTimer.current = setTimeout(() => setIsBouncing(false), 300);
  }, []);

  /* ── Interaction handlers ────────────────────────────── */
  const handleClick = useCallback(() => {
    if (disabled) return;
    triggerBounce();
    onSelect(option.id);
  }, [disabled, option.id, onSelect, triggerBounce]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  /* ── Dynamic styles ──────────────────────────────────── */
  const borderColor = isSelected
    ? '#FFD700'
    : isHovered && !disabled
      ? '#e0e0e0'
      : '#334455';

  const boxShadow = isSelected
    ? '4px 4px 0px #8B7500'
    : isHovered && !disabled
      ? '4px 4px 0px #222'
      : '4px 4px 0px #000';

  const backgroundColor = isSelected
    ? 'rgba(255, 215, 0, 0.08)'
    : 'var(--pixel-card)';

  let scale = '1';
  if (isBouncing) {
    scale = '0.95';
  } else if (isHovered && !disabled) {
    scale = '1.02';
  }

  return (
    <>
      {/* Bounce keyframes injected once */}
      <style>{`
        @keyframes mcq-bounce {
          0%   { transform: scale(0.95); }
          60%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div
        role="radio"
        aria-checked={isSelected}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.75rem 1rem',
          backgroundColor,
          border: `4px solid ${borderColor}`,
          boxShadow,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          outline: 'none',
          userSelect: 'none',
          transform: `scale(${scale})`,
          transition: isBouncing
            ? 'none'
            : 'transform 0.15s ease, border-color 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease',
          animation: isBouncing ? 'mcq-bounce 0.3s ease forwards' : 'none',
          /* ensure pixel-sharp rendering */
          imageRendering: 'pixelated',
        }}
      >
        {/* Option letter badge (pixel font) */}
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.55rem',
            color: isSelected ? '#FFD700' : '#aaa',
            backgroundColor: isSelected ? 'rgba(255,215,0,0.15)' : '#0f1a2e',
            border: `2px solid ${isSelected ? '#FFD700' : '#446'}`,
            transition: 'color 0.12s, border-color 0.12s, background-color 0.12s',
          }}
        >
          {label}
        </span>

        {/* Option text (system font for readability) */}
        <span
          style={{
            fontSize: '0.875rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: isSelected ? '#FFD700' : '#d8d8d8',
            lineHeight: 1.5,
            transition: 'color 0.12s',
          }}
        >
          {option.optionText}
        </span>

        {/* Selected checkmark */}
        {isSelected && (
          <span
            aria-hidden="true"
            style={{
              marginLeft: 'auto',
              fontSize: '1rem',
              color: '#FFD700',
              flexShrink: 0,
            }}
          >
            ✓
          </span>
        )}
      </div>
    </>
  );
}

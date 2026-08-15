import { useState, useCallback, useRef } from 'react';
import type { QuestionOption } from '../../types';

interface MultiSelectCardProps {
  option: QuestionOption;
  /** Letter label shown in the left badge: A, B, C, D … */
  label: string;
  isSelected: boolean;
  onToggle: (optionId: string) => void;
  disabled?: boolean;
}

/**
 * MultiSelectCard — multi-select pixel-art option card.
 *
 * Same visual language as McqCard but:
 *  - Supports toggling (multiple cards can be selected simultaneously)
 *  - ⚡ icon in the top-right corner:
 *      dim  when deselected (color #446, no glow)
 *      glow when selected   (color #FFD700, drop-shadow CSS filter)
 *  - Hidden checkbox for semantic accessibility
 *  - role="checkbox", aria-checked
 */
export default function MultiSelectCard({
  option,
  label,
  isSelected,
  onToggle,
  disabled = false,
}: MultiSelectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const bounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Bounce helper ───────────────────────────────────── */
  const triggerBounce = useCallback(() => {
    if (bounceTimer.current) clearTimeout(bounceTimer.current);
    setIsBouncing(true);
    bounceTimer.current = setTimeout(() => setIsBouncing(false), 300);
  }, []);

  /* ── Handlers ────────────────────────────────────────── */
  const handleClick = useCallback(() => {
    if (disabled) return;
    triggerBounce();
    onToggle(option.id);
  }, [disabled, option.id, onToggle, triggerBounce]);

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
  if (isBouncing) scale = '0.95';
  else if (isHovered && !disabled) scale = '1.02';

  /* ⚡ glow filter when selected */
  const boltFilter = isSelected
    ? 'drop-shadow(0 0 6px #FFD700) drop-shadow(0 0 12px #FFA500)'
    : 'none';

  return (
    <>
      <style>{`
        @keyframes ms-bounce {
          0%   { transform: scale(0.95); }
          60%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Hidden checkbox for screen-readers */}
      <input
        type="checkbox"
        id={`ms-option-${option.id}`}
        checked={isSelected}
        onChange={handleClick}
        disabled={disabled}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        role="checkbox"
        aria-checked={isSelected}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.75rem 1rem',
          paddingRight: '2.5rem', /* room for ⚡ */
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
          animation: isBouncing ? 'ms-bounce 0.3s ease forwards' : 'none',
          imageRendering: 'pixelated',
        }}
      >
        {/* ⚡ icon — top-right corner */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '0.35rem',
            right: '0.5rem',
            fontSize: '0.85rem',
            color: isSelected ? '#FFD700' : '#446677',
            filter: boltFilter,
            transition: 'color 0.15s, filter 0.15s',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          ⚡
        </span>

        {/* Option letter badge */}
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

        {/* Option text */}
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

        {/* Checkmark when selected */}
        {isSelected && (
          <span
            aria-hidden="true"
            style={{
              marginLeft: 'auto',
              marginRight: '1.2rem', /* avoid overlap with ⚡ */
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

interface XpProgressBarProps {
  current: number;
  max: number;
}

export default function XpProgressBar({ current, max }: XpProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--pixel-card)',
        border: '4px solid var(--pixel-gold)',
        boxShadow: '4px 4px 0 #8B7500',
      }}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`XP progress: ${current} of ${max}`}
    >
      {/* Label */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <span
          className="pixel-font"
          style={{ fontSize: '0.5rem', color: 'var(--pixel-gold)', letterSpacing: '0.05em' }}
        >
          ⭐ XP
        </span>
        <span
          className="pixel-font"
          style={{ fontSize: '0.5rem', color: 'var(--pixel-gold)' }}
        >
          {current}/{max}
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#0f1a2e',
          border: '2px solid #8B7500',
          overflow: 'hidden',
        }}
      >
        {/* Bar fill with CSS transition */}
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: 'var(--pixel-gold)',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: pct > 0 ? '0 0 8px var(--pixel-gold)' : 'none',
          }}
        />
      </div>

      {/* Percentage label below */}
      {pct > 0 && (
        <div
          style={{
            textAlign: 'right',
            marginTop: '0.25rem',
            fontSize: '0.6rem',
            color: '#aaa',
          }}
        >
          {pct}%
        </div>
      )}
    </div>
  );
}

import React from 'react';

interface GradeBadgeProps {
  grade: string;
  size?: 'sm' | 'md' | 'lg';
}

const GRADE_CONFIG: Record<string, { color: string; shadow: string; icon: string }> = {
  Unranked: { color: '#888888', shadow: '#444', icon: '?' },
  Bronze:   { color: '#CD7F32', shadow: '#7A4A18', icon: '🥉' },
  Silver:   { color: '#C0C0C0', shadow: '#808080', icon: '🥈' },
  Gold:     { color: '#FFD700', shadow: '#8B7500', icon: '🥇' },
};

const SIZE_CONFIG = {
  sm: { fontSize: '0.35rem', padding: '0.2rem 0.45rem', borderWidth: '2px', iconSize: '0.7rem', gap: '0.25rem' },
  md: { fontSize: '0.45rem', padding: '0.3rem 0.65rem', borderWidth: '3px', iconSize: '0.9rem', gap: '0.35rem' },
  lg: { fontSize: '0.55rem', padding: '0.4rem 0.85rem', borderWidth: '4px', iconSize: '1.1rem', gap: '0.45rem' },
};

const GradeBadge: React.FC<GradeBadgeProps> = ({ grade, size = 'md' }) => {
  const config = GRADE_CONFIG[grade] ?? GRADE_CONFIG['Unranked'];
  const sizeConf = SIZE_CONFIG[size];

  return (
    <span
      className="pixel-font"
      role="status"
      aria-label={`Grade: ${grade}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeConf.gap,
        color: config.color,
        border: `${sizeConf.borderWidth} solid ${config.color}`,
        boxShadow: `${sizeConf.borderWidth} ${sizeConf.borderWidth} 0 ${config.shadow}`,
        padding: sizeConf.padding,
        fontSize: sizeConf.fontSize,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        lineHeight: 1.4,
      }}
    >
      <span
        style={{ fontSize: sizeConf.iconSize, lineHeight: 1 }}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      {grade.toUpperCase()}
    </span>
  );
};

export default GradeBadge;

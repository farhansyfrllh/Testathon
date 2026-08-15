import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface PixelButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  size?: Size;
  className?: string;
  'aria-label'?: string;
}

const VARIANT_STYLES: Record<Variant, { color: string; border: string; shadow: string; bg: string }> = {
  primary: {
    color: 'var(--pixel-gold)',
    border: '3px solid var(--pixel-gold)',
    shadow: '3px 3px 0 #8B7500',
    bg: 'var(--pixel-accent)',
  },
  secondary: {
    color: '#aaa',
    border: '3px solid #446',
    shadow: '3px 3px 0 #000',
    bg: 'transparent',
  },
  danger: {
    color: '#e74c3c',
    border: '3px solid #e74c3c',
    shadow: '3px 3px 0 #7a0000',
    bg: 'transparent',
  },
};

const SIZE_STYLES: Record<Size, { padding: string; fontSize: string }> = {
  sm: { padding: '0.35rem 0.75rem', fontSize: '0.7rem' },
  md: { padding: '0.55rem 1.1rem', fontSize: '0.82rem' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '0.9rem' },
};

export default function PixelButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  fullWidth = false,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}: PixelButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`pixel-btn ${className}`}
      style={{
        display: fullWidth ? 'block' : 'inline-block',
        width: fullWidth ? '100%' : undefined,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: disabled ? '#556' : v.color,
        backgroundColor: disabled ? '#1a2a3a' : v.bg,
        border: disabled ? '3px solid #334' : v.border,
        boxShadow: disabled ? 'none' : v.shadow,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 0,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        transition: 'transform 0.1s, box-shadow 0.1s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

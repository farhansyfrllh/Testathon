import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan, coba lagi.';
      // Extract backend error message if available
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      setServerError(
        axiosErr?.response?.data?.error ||
          axiosErr?.response?.data?.message ||
          msg
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'var(--pixel-bg)',
    border: '3px solid #334',
    color: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '0.95rem',
    outline: 'none',
    borderRadius: 0,
  };

  const inputErrorStyle: React.CSSProperties = {
    ...inputStyle,
    border: '3px solid #e74c3c',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--pixel-bg)',
        padding: '1rem',
      }}
    >
      <div
        className="pixel-card pixel-border"
        style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            className="pixel-font"
            style={{ color: 'var(--pixel-gold)', fontSize: '0.75rem', lineHeight: 1.8 }}
          >
            TALENT BRIDGE
          </h1>
          <p
            className="pixel-font"
            style={{ color: '#aaa', fontSize: '0.5rem', marginTop: '0.5rem' }}
          >
            SIGN IN
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div
            style={{
              backgroundColor: '#2d0a0a',
              border: '3px solid #e74c3c',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              color: '#e74c3c',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.85rem',
            }}
            role="alert"
            aria-live="assertive"
          >
            ⚠ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="email"
              className="pixel-font"
              style={{ display: 'block', fontSize: '0.45rem', color: '#aaa', marginBottom: '0.5rem' }}
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
              style={errors.email ? inputErrorStyle : inputStyle}
              placeholder="your@email.com"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && (
              <p id="email-error" style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label
              htmlFor="password"
              className="pixel-font"
              style={{ display: 'block', fontSize: '0.45rem', color: '#aaa', marginBottom: '0.5rem' }}
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
              style={errors.password ? inputErrorStyle : inputStyle}
              placeholder="••••••••"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && (
              <p id="password-error" style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="pixel-btn pixel-border"
            style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: loading ? '#0f3460' : 'var(--pixel-accent)',
              color: loading ? '#aaa' : 'var(--pixel-gold)',
              border: '4px solid var(--pixel-gold)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '0.55rem',
              letterSpacing: '0.05em',
            }}
            aria-busy={loading}
          >
            {loading ? 'SIGNING IN...' : 'LOGIN'}
          </button>
        </form>

        {/* Register link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.85rem',
            color: '#aaa',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--pixel-gold)', textDecoration: 'none', fontWeight: 600 }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

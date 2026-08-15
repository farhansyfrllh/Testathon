import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import GradeBadge from '../components/ui/GradeBadge';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const ACCEPTED_EXTS = '.pdf,.png,.jpg,.jpeg';

interface UploadResult {
  cvId: string;
  matchScore: number;
  grade: string;
  skills: Array<{ name: string; score: number }>;
  method: 'ai' | 'rule_based';
}

/* ── Match Score Bar ──────────────────────────────────────── */
function MatchScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(score)));
  // gradient: red (0%) → orange (50%) → green (100%)
  const r = pct < 50 ? 255 : Math.round(255 - (pct - 50) * 5.1);
  const g = pct > 50 ? 200 : Math.round(pct * 4);
  const barColor = `rgb(${r},${g},40)`;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Match Score
        </span>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: barColor }}>{pct}%</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '14px',
          backgroundColor: '#2a2a4a',
          border: '2px solid #334',
          position: 'relative',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`CV match score: ${pct}%`}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, #e74c3c, ${barColor})`,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── Skill Chip ───────────────────────────────────────────── */
function SkillChip({ name, score }: { name: string; score: number }) {
  const pct = Math.round(score);
  let borderColor = '#e74c3c';
  if (pct >= 60) borderColor = 'var(--pixel-gold)';
  else if (pct >= 40) borderColor = 'var(--pixel-bronze)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.25rem 0.6rem',
        border: `2px solid ${borderColor}`,
        backgroundColor: 'var(--pixel-accent)',
        fontSize: '0.75rem',
        margin: '0.2rem',
      }}
      role="listitem"
    >
      {name}
      <span style={{ fontSize: '0.65rem', color: borderColor, fontWeight: 700 }}>{pct}%</span>
    </span>
  );
}

/* ── Grade Animation Wrapper ──────────────────────────────── */
function GradeAnimation({ show, grade }: { show: boolean; grade: string }) {
  if (!show) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem',
        animation: 'gradeAppear 0.5s ease-out',
      }}
    >
      <span
        className="pixel-font"
        style={{ fontSize: '0.4rem', color: '#aaa', letterSpacing: '0.1em' }}
        aria-live="polite"
      >
        ⭐ NEW GRADE ACHIEVED ⭐
      </span>
      <GradeBadge grade={grade} size="lg" />
      <style>{`
        @keyframes gradeAppear {
          0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
          60%  { transform: scale(1.15) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function CvUploadPage() {
  const navigate = useNavigate();
  const { user, updateGrade } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [gradeChanged, setGradeChanged] = useState(false);

  /* ── File validation & selection ── */
  function validateAndSetFile(f: File) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Only PDF, PNG, JPG, or JPEG files are accepted.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }
    setError(null);
    setResult(null);
    setGradeChanged(false);
    setFile(f);
  }

  /* ── Drag & Drop handlers ── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) validateAndSetFile(picked);
  };

  /* ── Upload ── */
  async function handleUpload() {
    if (!file || !user) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post<{
        success: boolean;
        data: {
          cvId: string;
          matchScore: number;
          grade: string;
          skills: Array<{ name: string; score: number }>;
          method: 'ai' | 'rule_based';
        };
        error?: string;
      }>('/api/cv/upload', formData);

      if (!res.data.success) throw new Error(res.data.error ?? 'Upload failed');

      const data = res.data.data;
      const previousGrade = user.grade;
      const gradeOrder: Record<string, number> = { Unranked: 0, Bronze: 1, Silver: 2, Gold: 3 };
      const improved = (gradeOrder[data.grade] ?? 0) > (gradeOrder[previousGrade] ?? 0);

      updateGrade(data.grade);
      setResult(data);
      setGradeChanged(improved);
    } catch (err: unknown) {
      // Extract the most useful error message available
      let msg = 'Terjadi kesalahan, coba lagi';
      if (err instanceof Error) {
        msg = err.message;
      }
      // Try to extract server-side error detail from Axios response
      const axiosErr = err as { response?: { data?: { error?: string; message?: string }; status?: number } };
      if (axiosErr?.response?.data?.error) {
        msg = axiosErr.response.data.error;
      } else if (axiosErr?.response?.data?.message) {
        msg = axiosErr.response.data.message;
      } else if (axiosErr?.response?.status === 401) {
        msg = 'Sesi kadaluarsa. Silakan login ulang.';
      } else if (axiosErr?.response?.status === 400) {
        msg = axiosErr?.response?.data?.error ?? 'File tidak valid atau AI service tidak dapat diakses. Pastikan Flask service berjalan di port 5000.';
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  /* ── Reset state ── */
  function handleUploadAnother() {
    setFile(null);
    setResult(null);
    setError(null);
    setGradeChanged(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          className="pixel-font"
          style={{ fontSize: '0.75rem', color: 'var(--pixel-gold)', marginBottom: '0.4rem' }}
        >
          📤 UPLOAD CV
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#aaa', margin: 0 }}>
          Upload your CV to get your grade and skill analysis.
        </p>
      </div>

      {/* ── RESULT SECTION (shown after success) ── */}
      {result && !uploading && (
        <section
          className="pixel-card"
          style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'var(--pixel-gold)' }}
          aria-labelledby="result-heading"
          aria-live="polite"
        >
          <h2
            className="pixel-font"
            id="result-heading"
            style={{ fontSize: '0.55rem', color: 'var(--pixel-gold)', marginBottom: '1.25rem' }}
          >
            ✅ ANALYSIS COMPLETE
          </h2>

          {/* Method badge */}
          <div style={{ marginBottom: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.5rem',
                border: `2px solid ${result.method === 'ai' ? '#4a9ade' : '#888'}`,
                color: result.method === 'ai' ? '#4a9ade' : '#888',
                backgroundColor: 'var(--pixel-accent)',
              }}
            >
              {result.method === 'ai' ? '🤖 AI Analysis' : '📋 Rule-Based Analysis'}
            </span>
          </div>

          {/* Grade animation if improved */}
          <GradeAnimation show={gradeChanged} grade={result.grade} />

          {/* If no grade change, still show badge */}
          {!gradeChanged && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Your Grade:</span>
              <GradeBadge grade={result.grade} size="md" />
            </div>
          )}

          {/* Match score bar */}
          <MatchScoreBar score={result.matchScore} />

          {/* Skills */}
          {result.skills.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p
                style={{
                  fontSize: '0.7rem',
                  color: '#aaa',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Detected Skills ({result.skills.length})
              </p>
              <div role="list" aria-label="Detected skills">
                {result.skills.map((s) => (
                  <SkillChip key={s.name} name={s.name} score={s.score} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              className="pixel-btn"
              onClick={handleUploadAnother}
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--pixel-gold)',
                border: '2px solid var(--pixel-gold)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
              aria-label="Upload another CV"
            >
              📤 Upload Another
            </button>
            <button
              className="pixel-btn"
              onClick={() => navigate('/learning-path')}
              style={{
                padding: '0.65rem 1.25rem',
                backgroundColor: 'var(--pixel-accent)',
                color: '#9b59b6',
                border: '3px solid #9b59b6',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                boxShadow: '4px 4px 0 #5b1f8a',
              }}
              aria-label="View Skill Gaps and Learning Path"
            >
              🗺️ View Skill Gaps & Path
            </button>
          </div>
        </section>
      )}

      {/* ── UPLOAD FORM (hidden after result) ── */}
      {!result && (
        <div className="pixel-card" style={{ padding: '1.5rem' }}>
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop CV here or click to upload"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `3px dashed ${dragOver ? 'var(--pixel-gold)' : file ? '#2ecc71' : '#446'}`,
              backgroundColor: dragOver
                ? '#1a2a0a'
                : file
                ? '#0a1a0a'
                : 'var(--pixel-bg)',
              padding: '2.5rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background-color 0.15s',
              userSelect: 'none',
              marginBottom: '1.25rem',
            }}
          >
            {file ? (
              /* ── File selected state ── */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem' }} aria-hidden="true">
                  {file.type === 'application/pdf' ? '📄' : '🖼️'}
                </span>
                <p
                  style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2ecc71', margin: 0, wordBreak: 'break-all' }}
                >
                  {file.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
                  {formatBytes(file.size)}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#555', margin: 0 }}>
                  Click to change file
                </p>
              </div>
            ) : (
              /* ── Empty state ── */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '3rem' }} aria-hidden="true">📤</span>
                <p
                  className="pixel-font"
                  style={{ fontSize: '0.45rem', color: dragOver ? 'var(--pixel-gold)' : '#aaa', margin: 0 }}
                >
                  DROP CV HERE
                </p>
                <p style={{ fontSize: '0.78rem', color: '#666', margin: 0 }}>or click to browse</p>
                <p style={{ fontSize: '0.7rem', color: '#555', margin: 0 }}>
                  PDF, PNG, JPG — max 10 MB
                </p>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTS}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label="Select CV file"
          />

          {/* Error message */}
          {error && (
            <div
              role="alert"
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e74c3c',
                backgroundColor: '#2d1a1a',
                color: '#e74c3c',
                fontSize: '0.8rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Upload button */}
          <button
            className="pixel-btn"
            onClick={handleUpload}
            disabled={!file || uploading}
            aria-disabled={!file || uploading}
            aria-label={uploading ? 'Processing CV' : 'Upload CV'}
            style={{
              width: '100%',
              padding: '0.8rem',
              backgroundColor: !file || uploading ? '#2a2a4a' : 'var(--pixel-accent)',
              color: !file || uploading ? '#555' : 'var(--pixel-gold)',
              border: `3px solid ${!file || uploading ? '#334' : 'var(--pixel-gold)'}`,
              boxShadow: !file || uploading ? 'none' : '4px 4px 0 #8B7500',
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.1s',
            }}
          >
            {uploading ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid var(--pixel-gold)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                  aria-hidden="true"
                />
                Processing CV...
              </>
            ) : (
              <>📤 {file ? 'Upload CV' : 'Select a file first'}</>
            )}
          </button>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

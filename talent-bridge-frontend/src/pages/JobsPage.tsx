import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import GradeBadge from '../components/ui/GradeBadge';
import type { Job } from '../types';

/* ── Types ───────────────────────────────────────────────── */
type LocationFilter = 'all' | 'Batam' | 'Singapore';

/* ── Skeleton Block ──────────────────────────────────────── */
function SkeletonBlock({ height = '1.5rem', width = '100%' }: { height?: string; width?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        backgroundColor: '#2a2a4a',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

/* ── Job Card Skeleton ───────────────────────────────────── */
function JobCardSkeleton() {
  return (
    <div
      className="pixel-card"
      style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      aria-hidden="true"
    >
      <SkeletonBlock height="0.8rem" width="60%" />
      <SkeletonBlock height="1rem" width="40%" />
      <SkeletonBlock height="0.75rem" width="80%" />
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <SkeletonBlock height="1.5rem" width="5rem" />
        <SkeletonBlock height="1.5rem" width="5rem" />
        <SkeletonBlock height="1.5rem" width="5rem" />
      </div>
      <SkeletonBlock height="1.8rem" />
    </div>
  );
}

/* ── Skill Chip ──────────────────────────────────────────── */
function SkillChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.45rem',
        fontSize: '0.65rem',
        backgroundColor: '#0f3460',
        border: '1px solid #4a9ade',
        color: '#4a9ade',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

/* ── Location Badge ──────────────────────────────────────── */
function LocationBadge({ location }: { location: string }) {
  const isBatam = location.toLowerCase().includes('batam');
  const color = isBatam ? '#4a9ade' : '#2ecc71';
  const bg = isBatam ? '#0f2a4a' : '#0a2a1a';
  const flag = isBatam ? '🇮🇩' : '🇸🇬';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        fontSize: '0.65rem',
        fontWeight: 600,
        backgroundColor: bg,
        border: `2px solid ${color}`,
        color,
        boxShadow: `2px 2px 0 ${color}44`,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true">{flag}</span>
      {location}
    </span>
  );
}

/* ── Job Card ────────────────────────────────────────────── */
interface JobCardProps {
  job: Job;
  isBestMatch: boolean;
}

function JobCard({ job, isBestMatch }: JobCardProps) {
  const navigate = useNavigate();
  // Parse required skills safely
  let requiredSkills: string[] = [];
  try {
    const parsed = JSON.parse(job.requiredSkillsJson ?? '[]');
    requiredSkills = Array.isArray(parsed) ? parsed : [];
  } catch {
    requiredSkills = [];
  }

  // matchScore from API is already 0-100 (percentage), not 0-1
  const hasMatchScore = typeof job.matchScore === 'number' && job.matchScore > 0;
  const matchPct = hasMatchScore ? Math.round(job.matchScore as number) : null;

  // Description truncated to 100 chars
  const shortDesc = job.description
    ? job.description.length > 100
      ? job.description.slice(0, 100) + '…'
      : job.description
    : null;

  return (
    <article
      className="pixel-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
        position: 'relative',
        borderColor: isBestMatch ? 'var(--pixel-gold)' : '#334',
        boxShadow: isBestMatch ? '4px 4px 0 #8B7500' : '4px 4px 0 #000',
      }}
      aria-label={`Job: ${job.title} at ${job.company ?? 'Unknown Company'}`}
    >
      {/* Best Match badge */}
      {isBestMatch && (
        <div
          className="pixel-font"
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: 'var(--pixel-gold)',
            color: '#000',
            fontSize: '0.38rem',
            padding: '0.25rem 0.5rem',
            letterSpacing: '0.05em',
            lineHeight: 1.4,
          }}
          aria-label="Best match job"
        >
          ⭐ BEST MATCH
        </div>
      )}

      {/* Title row: pixel font */}
      <div style={{ paddingRight: isBestMatch ? '7rem' : 0 }}>
        <h3
          className="pixel-font"
          style={{
            margin: 0,
            fontSize: '0.5rem',
            color: isBestMatch ? 'var(--pixel-gold)' : '#e0e0e0',
            lineHeight: 1.8,
            letterSpacing: '0.05em',
          }}
        >
          {job.title.toUpperCase()}
        </h3>
      </div>

      {/* Company name — system font for readability */}
      {job.company && (
        <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 500 }}>
          {job.company}
        </span>
      )}

      {/* Location + Grade badges row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
        <LocationBadge location={job.location} />
        <GradeBadge grade={job.minGrade} size="sm" />
        {matchPct !== null && (
          <span
            style={{
              display: 'inline-block',
              padding: '0.15rem 0.45rem',
              fontSize: '0.62rem',
              fontWeight: 700,
              backgroundColor: '#1a2e1a',
              border: '2px solid #2ecc71',
              color: '#2ecc71',
              boxShadow: '2px 2px 0 #145e32',
            }}
            aria-label={`Match score: ${matchPct}%`}
          >
            {matchPct}% match
          </span>
        )}
      </div>

      {/* Short description */}
      {shortDesc && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#bbb', lineHeight: 1.6 }}>
          {shortDesc}
        </p>
      )}

      {/* Required skills chips */}
      {requiredSkills.length > 0 && (
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}
          aria-label="Required skills"
        >
          {requiredSkills.map((skill) => (
            <SkillChip key={skill} label={skill} />
          ))}
        </div>
      )}

      {/* View Detail button */}
      <button
        className="pixel-btn"
        onClick={() => navigate(`/jobs/${job.id}`)}
        style={{
          marginTop: 'auto',
          padding: '0.5rem 1rem',
          backgroundColor: 'transparent',
          color: 'var(--pixel-gold)',
          border: '2px solid var(--pixel-gold)',
          boxShadow: '3px 3px 0 #8B7500',
          cursor: 'pointer',
          fontSize: '0.72rem',
          fontWeight: 700,
          width: '100%',
        }}
        aria-label={`View details for ${job.title}`}
      >
        🔍 View Details &amp; Learning Path
      </button>
    </article>
  );
}

/* ── Filter Tab Button ───────────────────────────────────── */
interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className="pixel-btn"
      style={{
        padding: '0.5rem 1rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        backgroundColor: active ? 'var(--pixel-accent)' : 'transparent',
        color: active ? 'var(--pixel-gold)' : '#aaa',
        border: `2px solid ${active ? 'var(--pixel-gold)' : '#446'}`,
        borderBottom: active ? `4px solid var(--pixel-gold)` : '2px solid #446',
        boxShadow: active ? '3px 3px 0 #8B7500' : 'none',
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
      }}
      aria-pressed={active}
      aria-label={`Filter: ${label}`}
    >
      {label}
    </button>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function JobsPage() {
  const user = useAuthStore((s) => s.user);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<LocationFilter>('all');

  const isUnranked = !user?.grade || user.grade === 'Unranked';

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    apiClient
      .get<{ success: boolean; data: Job[] }>(`/api/jobs/matched/${user.id}`)
      .then((res) => {
        if (!cancelled) {
          if (res.data.success) {
            setJobs(res.data.data ?? []);
          } else {
            setJobs([]);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // 404 → no CV / no matches yet, treat as empty
          if (err?.response?.status === 404) {
            setJobs([]);
          } else {
            const msg = err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi';
            setError(msg);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  /* ── Filtering ── */
  const filteredJobs = jobs.filter((job) => {
    if (activeFilter === 'all') return true;
    return job.location.toLowerCase().includes(activeFilter.toLowerCase());
  });

  /* ── Best match: top 2 by matchScore ── */
  const bestMatchIds = new Set(
    [...jobs]
      .filter((j) => typeof j.matchScore === 'number' && j.matchScore > 0)
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      .slice(0, 2)
      .map((j) => j.id)
  );

  /* ── Empty-state helpers ── */
  const showCvUploadPrompt = isUnranked && jobs.length === 0 && !loading && !error;
  const showNoJobs = !isUnranked && jobs.length === 0 && !loading && !error;
  const showNoFilterResults = jobs.length > 0 && filteredJobs.length === 0 && !loading;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1
          className="pixel-font"
          style={{ fontSize: '0.75rem', color: 'var(--pixel-gold)', margin: '0 0 0.5rem', letterSpacing: '0.08em' }}
        >
          💼 JOB BOARD
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#aaa', margin: 0 }}>
          Matched opportunities based on your skills and grade
        </p>
      </div>

      {/* ── FILTER TABS ── */}
      <div
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}
        role="tablist"
        aria-label="Filter jobs by location"
      >
        <TabButton label="All Jobs" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
        <TabButton label="Batam 🇮🇩" active={activeFilter === 'Batam'} onClick={() => setActiveFilter('Batam')} />
        <TabButton label="Singapore 🇸🇬" active={activeFilter === 'Singapore'} onClick={() => setActiveFilter('Singapore')} />
      </div>

      {/* ── ERROR STATE ── */}
      {error && !loading && (
        <div
          className="pixel-card"
          style={{ padding: '1.5rem', textAlign: 'center', borderColor: '#e74c3c' }}
          role="alert"
        >
          <p style={{ fontSize: '0.85rem', color: '#e74c3c', margin: '0 0 1rem' }}>⚠ {error}</p>
          <button
            className="pixel-btn"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#e74c3c',
              border: '2px solid #e74c3c',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── LOADING SKELETON ── */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
          aria-label="Loading jobs"
          aria-busy="true"
        >
          {[1, 2, 3, 4].map((i) => <JobCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── CV UPLOAD PROMPT (Unranked + no jobs) ── */}
      {showCvUploadPrompt && (
        <div
          className="pixel-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderStyle: 'dashed',
            borderColor: '#446',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
          role="status"
          aria-label="No jobs available — upload CV first"
        >
          <p style={{ fontSize: '2.5rem', margin: 0 }} aria-hidden="true">📄</p>
          <p
            className="pixel-font"
            style={{ fontSize: '0.45rem', color: '#aaa', lineHeight: 2, maxWidth: '380px' }}
          >
            Upload your CV first to see matched jobs
          </p>
          <p style={{ fontSize: '0.8rem', color: '#777', margin: 0 }}>
            We'll match jobs to your skills and grade after you upload your CV.
          </p>
          <Link
            to="/cv-upload"
            className="pixel-btn"
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.65rem 1.4rem',
              backgroundColor: 'var(--pixel-accent)',
              color: 'var(--pixel-gold)',
              border: '3px solid var(--pixel-gold)',
              boxShadow: '4px 4px 0 #8B7500',
              fontSize: '0.75rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
            aria-label="Go to CV upload page"
          >
            📤 Upload CV
          </Link>
        </div>
      )}

      {/* ── NO JOBS (has grade but API returned nothing) ── */}
      {showNoJobs && (
        <div
          className="pixel-card"
          style={{ padding: '3rem', textAlign: 'center', borderStyle: 'dashed', borderColor: '#446' }}
          role="status"
        >
          <p style={{ fontSize: '2rem', margin: '0 0 1rem' }} aria-hidden="true">📭</p>
          <p style={{ fontSize: '0.85rem', color: '#aaa' }}>No jobs available at the moment.</p>
        </div>
      )}

      {/* ── NO RESULTS FOR FILTER ── */}
      {showNoFilterResults && (
        <div
          className="pixel-card"
          style={{ padding: '2rem', textAlign: 'center', borderColor: '#446' }}
          role="status"
        >
          <p style={{ fontSize: '1.5rem', margin: '0 0 0.75rem' }} aria-hidden="true">🔍</p>
          <p style={{ fontSize: '0.85rem', color: '#aaa' }}>
            No jobs in{' '}
            <strong style={{ color: '#e0e0e0' }}>
              {activeFilter === 'Batam' ? 'Batam 🇮🇩' : 'Singapore 🇸🇬'}
            </strong>
            .
          </p>
          <button
            className="pixel-btn"
            onClick={() => setActiveFilter('all')}
            style={{
              marginTop: '0.75rem',
              padding: '0.45rem 0.9rem',
              backgroundColor: 'transparent',
              color: 'var(--pixel-gold)',
              border: '2px solid var(--pixel-gold)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            Show All Jobs
          </button>
        </div>
      )}

      {/* ── JOB COUNT + GRID ── */}
      {!loading && !error && filteredJobs.length > 0 && (
        <>
          {/* Job count */}
          <p
            style={{
              fontSize: '0.75rem',
              color: '#888',
              margin: '0 0 1rem',
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            <span style={{ color: 'var(--pixel-gold)', fontWeight: 700 }}>{filteredJobs.length}</span>{' '}
            {filteredJobs.length === 1 ? 'job' : 'jobs'} found
          </p>

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
            role="list"
            aria-label="Job listings"
          >
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isBestMatch={bestMatchIds.has(job.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import type { Course, RecommendedCourse, CourseModule } from '../types';

/* ── Skeleton Block ──────────────────────────────────────── */
function SkeletonBlock({ height = '1.5rem' }: { height?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height,
        backgroundColor: '#2a2a4a',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
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
      }}
    >
      {label}
    </span>
  );
}

/* ── Course Card ──────────────────────────────────────────── */
interface CourseCardProps {
  course: Course;
  recommended: boolean;
  missingSkills?: string[];
}

function CourseCard({ course, recommended, missingSkills }: CourseCardProps) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // Parse requiredSkillsJson safely
  let requiredSkills: string[] = [];
  try {
    requiredSkills = JSON.parse(course.requiredSkillsJson ?? '[]');
  } catch {
    requiredSkills = [];
  }

  const handleStartCourse = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await apiClient.get<{ success: boolean; data: CourseModule[] }>(
        `/api/courses/${course.id}/modules`
      );
      if (res.data.success && res.data.data.length > 0) {
        const sorted = [...res.data.data].sort((a, b) => a.orderIndex - b.orderIndex);
        navigate(`/courses/${course.id}/quiz/${sorted[0].id}`);
      } else {
        setError('No modules found for this course.');
      }
    } catch {
      setError('Failed to load course modules.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <article
      className="pixel-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        borderColor: recommended ? 'var(--pixel-gold)' : '#334',
        boxShadow: recommended ? '4px 4px 0 #8B7500' : '4px 4px 0 #000',
        transition: 'border-color 0.2s',
      }}
      aria-label={`Course: ${course.title}`}
    >
      {/* Recommended badge */}
      {recommended && (
        <div
          className="pixel-font"
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: 'var(--pixel-gold)',
            color: '#000',
            fontSize: '0.45rem',
            padding: '0.25rem 0.5rem',
            letterSpacing: '0.05em',
          }}
          aria-label="Recommended course"
        >
          ⭐ RECOMMENDED
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: '0.9rem',
          fontWeight: 700,
          color: recommended ? 'var(--pixel-gold)' : '#e0e0e0',
          lineHeight: 1.4,
          paddingRight: recommended ? '6rem' : 0,
        }}
      >
        {course.title}
      </h3>

      {/* Category badge */}
      <div>
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.65rem',
            padding: '0.2rem 0.5rem',
            backgroundColor: '#1a3a5c',
            border: '1px solid #4a9ade',
            color: '#4a9ade',
          }}
        >
          {course.category}
        </span>
      </div>

      {/* Required skills chips */}
      {requiredSkills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }} aria-label="Required skills">
          {requiredSkills.map((skill) => (
            <SkillChip key={skill} label={skill} />
          ))}
        </div>
      )}

      {/* Missing skills (if recommended) */}
      {recommended && missingSkills && missingSkills.length > 0 && (
        <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
          <span style={{ color: '#e74c3c' }}>Missing: </span>
          {missingSkills.slice(0, 3).map((s) => (
            <span
              key={s}
              style={{
                display: 'inline-block',
                margin: '0 0.2rem 0.2rem 0',
                padding: '0.1rem 0.35rem',
                backgroundColor: '#2d1a1a',
                border: '1px solid #e74c3c',
                color: '#e74c3c',
                fontSize: '0.62rem',
              }}
            >
              {s}
            </span>
          ))}
          {missingSkills.length > 3 && (
            <span style={{ color: '#888', fontSize: '0.62rem' }}>+{missingSkills.length - 3} more</span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ margin: 0, fontSize: '0.7rem', color: '#e74c3c' }} role="alert">
          {error}
        </p>
      )}

      {/* Start Course button */}
      <button
        className="pixel-btn"
        onClick={handleStartCourse}
        disabled={starting}
        style={{
          marginTop: 'auto',
          padding: '0.6rem 1rem',
          backgroundColor: starting ? '#333' : 'var(--pixel-accent)',
          color: starting ? '#888' : 'var(--pixel-gold)',
          border: `2px solid ${starting ? '#555' : 'var(--pixel-gold)'}`,
          boxShadow: starting ? 'none' : '3px 3px 0 #8B7500',
          cursor: starting ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          width: '100%',
        }}
        aria-label={`Start course: ${course.title}`}
      >
        {starting ? '⏳ Loading...' : '▶ START COURSE'}
      </button>
    </article>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function CoursesPage() {
  const user = useAuthStore((s) => s.user);

  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<Set<string>>(new Set());
  const [recommendedMap, setRecommendedMap] = useState<Record<string, RecommendedCourse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const fetchAll = async () => {
      try {
        // Fetch all courses
        const coursesRes = await apiClient.get<{ success: boolean; data: Course[] }>('/api/courses');

        if (!cancelled) {
          if (coursesRes.data.success) {
            setCourses(coursesRes.data.data ?? []);
          } else {
            setError('Failed to load courses.');
          }
        }

        // Fetch recommended courses if user is logged in
        if (user?.id) {
          try {
            const recRes = await apiClient.get<{ success: boolean; data: RecommendedCourse[] }>(
              `/api/courses/recommended/${user.id}`
            );
            if (!cancelled && recRes.data.success) {
              const rec = recRes.data.data ?? [];
              const ids = new Set(rec.map((r) => r.id));
              const map: Record<string, RecommendedCourse> = {};
              rec.forEach((r) => { map[r.id] = r; });
              setRecommendedIds(ids);
              setRecommendedMap(map);
            }
          } catch {
            // Recommended fetch failing is non-fatal
          }
        }
      } catch {
        if (!cancelled) setError('Terjadi kesalahan, coba lagi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          className="pixel-font"
          style={{ fontSize: '0.75rem', color: 'var(--pixel-gold)', margin: '0 0 0.5rem', letterSpacing: '0.08em' }}
        >
          📚 COURSES
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#aaa', margin: 0 }}>
          Browse available courses and start learning
        </p>
      </div>

      {/* Error state */}
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

      {/* Loading skeleton grid */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
          aria-label="Loading courses"
          aria-busy="true"
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="pixel-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <SkeletonBlock height="1.2rem" />
              <SkeletonBlock height="1.5rem" />
              <SkeletonBlock height="1rem" />
              <SkeletonBlock height="2.5rem" />
            </div>
          ))}
        </div>
      )}

      {/* Courses grid */}
      {!loading && !error && courses.length === 0 && (
        <div
          className="pixel-card"
          style={{ padding: '3rem', textAlign: 'center', borderStyle: 'dashed', borderColor: '#446' }}
        >
          <p style={{ fontSize: '2rem', margin: '0 0 1rem' }} aria-hidden="true">📭</p>
          <p style={{ fontSize: '0.85rem', color: '#aaa' }}>No courses available yet.</p>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
          role="list"
          aria-label="Available courses"
        >
          {/* Sort recommended courses first */}
          {[...courses]
            .sort((a, b) => {
              const aRec = recommendedIds.has(a.id) ? 0 : 1;
              const bRec = recommendedIds.has(b.id) ? 0 : 1;
              return aRec - bRec;
            })
            .map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                recommended={recommendedIds.has(course.id)}
                missingSkills={recommendedMap[course.id]?.missingSkills}
              />
            ))}
        </div>
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

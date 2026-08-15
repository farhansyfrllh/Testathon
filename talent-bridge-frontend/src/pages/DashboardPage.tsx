import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import GradeBadge from '../components/ui/GradeBadge';
import type { Skill, RecommendedCourse } from '../types';

/* ── Skeleton helpers ─────────────────────────────────────── */
function SkeletonBlock({ width = '100%', height = '1.5rem' }: { width?: string; height?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        backgroundColor: '#2a2a4a',
        borderRadius: 0,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

/* ── Skill Progress Card ──────────────────────────────────── */
function SkillCard({ skill }: { skill: Skill }) {
  const pct = Math.min(100, Math.round(skill.proficiencyScore));
  let barColor = '#e74c3c';
  if (pct >= 60) barColor = 'var(--pixel-gold)';
  else if (pct >= 40) barColor = 'var(--pixel-bronze)';

  return (
    <div
      className="pixel-card"
      style={{ padding: '0.75rem 1rem' }}
      role="listitem"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.4rem',
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{skill.skillName}</span>
        <span style={{ fontSize: '0.75rem', color: barColor, fontWeight: 700 }}>
          {pct}%
        </span>
      </div>
      {/* progress bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#2a2a4a',
          border: '2px solid #334',
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${skill.skillName} proficiency ${pct}%`}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: barColor,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── Recommended Course Card ──────────────────────────────── */
function CourseCard({ course }: { course: RecommendedCourse }) {
  const navigate = useNavigate();
  const missing: string[] = course.missingSkills ?? [];

  return (
    <div
      className="pixel-card"
      style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      role="listitem"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--pixel-gold)', lineHeight: 1.4 }}>
          {course.title}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            padding: '0.1rem 0.4rem',
            backgroundColor: '#1a3a5c',
            border: '1px solid #4a9ade',
            color: '#4a9ade',
            whiteSpace: 'nowrap',
          }}
        >
          {course.category}
        </span>
      </div>

      {missing.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: '#aaa' }}>
          Missing:{' '}
          {missing.slice(0, 3).map((s) => (
            <span
              key={s}
              style={{
                display: 'inline-block',
                margin: '0.1rem 0.2rem',
                padding: '0.1rem 0.35rem',
                backgroundColor: '#2d1a1a',
                border: '1px solid #e74c3c',
                color: '#e74c3c',
                fontSize: '0.65rem',
              }}
            >
              {s}
            </span>
          ))}
          {missing.length > 3 && (
            <span style={{ color: '#888', fontSize: '0.65rem' }}> +{missing.length - 3} more</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#e74c3c' }}>
          Gap: {Math.round(course.gapScore)}%
        </span>
        <button
          className="pixel-btn"
          onClick={() => navigate('/courses')}
          style={{
            fontSize: '0.6rem',
            padding: '0.3rem 0.6rem',
            backgroundColor: 'transparent',
            color: 'var(--pixel-gold)',
            border: '2px solid var(--pixel-gold)',
            cursor: 'pointer',
          }}
          aria-label={`Start course: ${course.title}`}
        >
          START →
        </button>
      </div>
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="pixel-card"
      style={{
        padding: '1rem 1.25rem',
        flex: 1,
        minWidth: '140px',
        borderColor: accent ?? '#334',
        boxShadow: accent ? `4px 4px 0 ${accent}44` : '4px 4px 0 #000',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      <span style={{ fontSize: '0.65rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: accent ?? '#e0e0e0' }}>{value}</div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [hasCV, setHasCV] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    // Fetch CV result → skills
    setLoadingSkills(true);
    apiClient
      .get<{ success: boolean; data: { skills: Array<{ name?: string; skillName?: string; score?: number; proficiencyScore?: number }>; grade: string } }>(
        `/api/cv/${user.id}/result`
      )
      .then((res) => {
        if (cancelled) return;
        if (res.data.success && res.data.data) {
          const raw = res.data.data.skills ?? [];
          const mapped: Skill[] = raw.map((s, i) => ({
            id: String(i),
            // Backend SkillResult record serialises as {name, score} in camelCase
            skillName: s.skillName ?? s.name ?? 'Unknown',
            proficiencyScore: s.proficiencyScore ?? s.score ?? 0,
          }));
          setSkills(mapped);
          setHasCV(true);
        } else {
          setHasCV(false);
        }
      })
      .catch(() => {
        if (!cancelled) setHasCV(false);
      })
      .finally(() => { if (!cancelled) setLoadingSkills(false); });

    // Fetch recommended courses
    setLoadingCourses(true);
    apiClient
      .get<{ success: boolean; data: RecommendedCourse[] }>(`/api/courses/recommended/${user.id}`)
      .then((res) => {
        if (!cancelled && res.data.success) setCourses((res.data.data ?? []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCourses(false); });

    return () => { cancelled = true; };
  }, [user?.id]);

  const gradeColor: Record<string, string> = {
    Unranked: '#888',
    Bronze: '#CD7F32',
    Silver: '#C0C0C0',
    Gold: '#FFD700',
  };
  const currentGradeColor = gradeColor[user?.grade ?? 'Unranked'] ?? '#888';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* ── HEADER ── */}
      <div
        className="pixel-card"
        style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
          borderColor: currentGradeColor,
          boxShadow: `4px 4px 0 ${currentGradeColor}66`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              className="pixel-font"
              style={{ fontSize: '0.65rem', color: currentGradeColor, marginBottom: '0.4rem', lineHeight: 1.6 }}
            >
              WELCOME BACK,
            </h1>
            <h2
              className="pixel-font"
              style={{ fontSize: '0.85rem', color: '#e0e0e0', margin: 0, lineHeight: 1.6 }}
            >
              {user?.name?.toUpperCase() ?? 'TALENT'}
            </h2>
          </div>
          <GradeBadge grade={user?.grade ?? 'Unranked'} size="lg" />
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
        role="list"
        aria-label="Quick stats"
      >
        <StatCard
          label="Current Grade"
          value={<GradeBadge grade={user?.grade ?? 'Unranked'} size="sm" />}
          accent={currentGradeColor}
        />
        <StatCard
          label="Skills Detected"
          value={loadingSkills ? '—' : skills.length}
          accent={skills.length > 0 ? '#4a9ade' : undefined}
        />
        <StatCard
          label="Courses Available"
          value={loadingCourses ? '—' : courses.length}
          accent="#2ecc71"
        />
      </div>

      {/* ── SKILLS SECTION ── */}
      <section style={{ marginBottom: '2rem' }} aria-labelledby="skills-heading">
        <h3
          className="pixel-font"
          id="skills-heading"
          style={{ fontSize: '0.55rem', color: '#aaa', marginBottom: '1rem', letterSpacing: '0.1em' }}
        >
          ⚡ YOUR SKILLS
        </h3>

        {loadingSkills ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map((i) => <SkeletonBlock key={i} height="3.5rem" />)}
          </div>
        ) : !hasCV || skills.length === 0 ? (
          <div
            className="pixel-card"
            style={{
              padding: '2rem',
              textAlign: 'center',
              borderStyle: 'dashed',
              borderColor: '#446',
            }}
          >
            <p style={{ fontSize: '2rem', margin: '0 0 0.75rem' }} aria-hidden="true">📄</p>
            <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>
              Upload your CV to discover your skills
            </p>
            <button
              className="pixel-btn pixel-border"
              onClick={() => navigate('/cv-upload')}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: 'var(--pixel-accent)',
                color: 'var(--pixel-gold)',
                border: '3px solid var(--pixel-gold)',
                boxShadow: '3px 3px 0 #8B7500',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
              aria-label="Upload CV to detect skills"
            >
              📤 Upload CV
            </button>
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}
            role="list"
            aria-label="Skill list"
          >
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>

      {/* ── RECOMMENDED COURSES ── */}
      <section style={{ marginBottom: '2rem' }} aria-labelledby="courses-heading">
        <h3
          className="pixel-font"
          id="courses-heading"
          style={{ fontSize: '0.55rem', color: '#aaa', marginBottom: '1rem', letterSpacing: '0.1em' }}
        >
          📚 RECOMMENDED COURSES
        </h3>

        {loadingCourses ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2].map((i) => <SkeletonBlock key={i} height="5rem" />)}
          </div>
        ) : courses.length === 0 ? (
          <div
            className="pixel-card"
            style={{ padding: '1.5rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}
          >
            No recommendations yet. Upload your CV first.
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}
            role="list"
            aria-label="Recommended courses"
          >
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section aria-labelledby="actions-heading">
        <h3
          className="pixel-font"
          id="actions-heading"
          style={{ fontSize: '0.55rem', color: '#aaa', marginBottom: '1rem', letterSpacing: '0.1em' }}
        >
          🎮 QUICK ACTIONS
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            className="pixel-btn"
            onClick={() => navigate('/cv-upload')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--pixel-accent)',
              color: 'var(--pixel-gold)',
              border: '3px solid var(--pixel-gold)',
              boxShadow: '4px 4px 0 #8B7500',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
            aria-label="Upload CV"
          >
            📤 Upload CV
          </button>
          <button
            className="pixel-btn"
            onClick={() => navigate('/jobs')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--pixel-accent)',
              color: '#4a9ade',
              border: '3px solid #4a9ade',
              boxShadow: '4px 4px 0 #1a4a7a',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
            aria-label="Browse Jobs"
          >
            💼 Browse Jobs
          </button>
          <button
            className="pixel-btn"
            onClick={() => navigate('/courses')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--pixel-accent)',
              color: '#2ecc71',
              border: '3px solid #2ecc71',
              boxShadow: '4px 4px 0 #14733e',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
            aria-label="View Courses"
          >
            📚 View Courses
          </button>
          <button
            className="pixel-btn"
            onClick={() => navigate('/learning-path')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--pixel-accent)',
              color: '#9b59b6',
              border: '3px solid #9b59b6',
              boxShadow: '4px 4px 0 #5b1f8a',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
            aria-label="View Learning Path"
          >
            🗺️ Learning Path
          </button>
        </div>
      </section>

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

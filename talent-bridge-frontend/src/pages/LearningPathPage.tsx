import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import type { CourseProgress, RecommendedCourse } from '../types';

/* ── Module Progress Row ─────────────────────────────────── */
function ModuleRow({ mod }: { mod: CourseProgress['modules'][0] }) {
  const typeIcon: Record<string, string> = { mcq: '❓', multi_select: '⚡', drag_drop: '🔀' };
  const scoreColor = mod.score >= 70 ? '#2ecc71' : mod.score >= 40 ? '#FFD700' : '#e74c3c';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.6rem 0.75rem',
      backgroundColor: mod.completed ? '#0a1a0a' : 'transparent',
      border: `1px solid ${mod.completed ? '#2ecc7133' : '#334'}`,
      marginBottom: '0.35rem',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }} aria-hidden="true">
        {mod.completed ? '✅' : '⬜'}
      </span>
      <span style={{ fontSize: '0.7rem' }} aria-hidden="true">{typeIcon[mod.moduleType] ?? '📄'}</span>
      <span style={{ flex: 1, fontSize: '0.8rem', color: mod.completed ? '#e0e0e0' : '#888' }}>
        {mod.moduleTitle}
      </span>
      {mod.completed && (
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor }}>
          {mod.score}%
        </span>
      )}
    </div>
  );
}

/* ── Course Progress Card ────────────────────────────────── */
function CourseProgressCard({
  progress,
  recommended,
  onStart,
}: {
  progress: CourseProgress;
  recommended: boolean;
  onStart: (courseId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(progress.completionPercent);
  const barColor = pct === 100 ? '#2ecc71' : pct > 0 ? '#4a9ade' : '#446';
  const statusLabel = pct === 100 ? 'COMPLETED' : pct > 0 ? 'IN PROGRESS' : 'NOT STARTED';
  const statusColor = pct === 100 ? '#2ecc71' : pct > 0 ? '#4a9ade' : '#666';

  return (
    <article className="pixel-card" style={{
      padding: '1.25rem',
      borderColor: pct === 100 ? '#2ecc71' : recommended ? 'var(--pixel-gold)' : '#334',
      boxShadow: pct === 100 ? '4px 4px 0 #14733e' : recommended ? '4px 4px 0 #8B7500' : '4px 4px 0 #000',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: pct === 100 ? '#2ecc71' : '#e0e0e0', lineHeight: 1.4 }}>
            {progress.courseTitle}
          </h3>
          <span style={{
            display: 'inline-block', marginTop: '0.3rem', padding: '0.15rem 0.4rem',
            fontSize: '0.62rem', backgroundColor: '#1a3a5c', border: '1px solid #4a9ade', color: '#4a9ade',
          }}>
            {progress.courseCategory}
          </span>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="pixel-font" style={{ fontSize: '0.38rem', color: statusColor, letterSpacing: '0.05em' }}>
            {statusLabel}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: barColor }}>{pct}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '10px', backgroundColor: '#2a2a4a', border: '2px solid #334', marginBottom: '0.75rem', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', backgroundColor: barColor,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.75rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e0e0' }}>
            {progress.completedModules}/{progress.totalModules}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#aaa' }}>Modules</div>
        </div>
        {progress.averageScore > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: progress.averageScore >= 70 ? '#2ecc71' : '#FFD700' }}>
              {Math.round(progress.averageScore)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: '#aaa' }}>Avg Score</div>
          </div>
        )}
        {recommended && pct < 100 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--pixel-gold)', fontWeight: 600 }}>⭐ Recommended</div>
          </div>
        )}
      </div>

      {/* Module list toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', color: '#4a9ade',
          cursor: 'pointer', fontSize: '0.72rem', padding: 0, marginBottom: '0.6rem',
        }}
      >
        {expanded ? '▲ Hide modules' : `▼ View ${progress.totalModules} modules`}
      </button>

      {expanded && (
        <div style={{ marginBottom: '0.75rem' }}>
          {progress.modules.map(mod => <ModuleRow key={mod.moduleId} mod={mod} />)}
        </div>
      )}

      {/* CTA */}
      {pct < 100 && (
        <button
          className="pixel-btn"
          onClick={() => onStart(progress.courseId)}
          style={{
            width: '100%', padding: '0.55rem',
            backgroundColor: 'var(--pixel-accent)',
            color: pct > 0 ? '#4a9ade' : 'var(--pixel-gold)',
            border: `2px solid ${pct > 0 ? '#4a9ade' : 'var(--pixel-gold)'}`,
            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
          }}
        >
          {pct > 0 ? '▶ Continue Course' : '▶ Start Course'}
        </button>
      )}
    </article>
  );
}

/* ── Skill Gap Summary (Feature 5) ──────────────────────────── */
function SkillGapSummary({ recommended }: { recommended: RecommendedCourse[] }) {
  // Collect all unique missing skills across recommended courses, ranked by frequency
  const skillCount: Record<string, number> = {};
  recommended.forEach(course => {
    (course.missingSkills ?? []).forEach(skill => {
      skillCount[skill] = (skillCount[skill] ?? 0) + 1;
    });
  });

  const sorted = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (sorted.length === 0) return null;

  return (
    <section className="pixel-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h2 className="pixel-font" style={{ fontSize: '0.5rem', color: '#e74c3c', margin: '0 0 1rem', letterSpacing: '0.08em' }}>
        🔍 SKILL GAPS TO CLOSE
      </h2>
      <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 1rem' }}>
        These are the skills most needed across your recommended courses:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {sorted.map(([skill, count]) => (
          <div key={skill} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.7rem', border: '2px solid #e74c3c',
            backgroundColor: '#2d1a1a',
          }}>
            <span style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: 600 }}>{skill}</span>
            {count > 1 && (
              <span style={{
                fontSize: '0.6rem', color: '#000', backgroundColor: '#e74c3c',
                padding: '0.1rem 0.3rem', fontWeight: 700,
              }}>{count}x</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function LearningPathPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [recommended, setRecommended] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inprogress' | 'notstarted' | 'completed'>('all');

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    Promise.all([
      apiClient.get<{ success: boolean; data: CourseProgress[] }>(`/api/courses/progress/${user.id}`),
      apiClient.get<{ success: boolean; data: RecommendedCourse[] }>(`/api/courses/recommended/${user.id}`),
    ]).then(([progRes, recRes]) => {
      if (progRes.data.success) setProgress(progRes.data.data ?? []);
      if (recRes.data.success) setRecommended(recRes.data.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  const handleStartCourse = async (courseId: string) => {
    try {
      const res = await apiClient.get<{ success: boolean; data: Array<{ id: string; orderIndex: number }> }>(
        `/api/courses/${courseId}/modules`
      );
      if (res.data.success && res.data.data.length > 0) {
        const sorted = [...res.data.data].sort((a, b) => a.orderIndex - b.orderIndex);
        navigate(`/courses/${courseId}/quiz/${sorted[0].id}`);
      }
    } catch { /* ignore */ }
  };

  const recommendedIds = new Set(recommended.map(r => r.id));

  const filteredProgress = progress.filter(p => {
    if (filter === 'completed') return p.completionPercent === 100;
    if (filter === 'inprogress') return p.completionPercent > 0 && p.completionPercent < 100;
    if (filter === 'notstarted') return p.completionPercent === 0;
    return true;
  });

  // Summary stats
  const completedCount = progress.filter(p => p.completionPercent === 100).length;
  const inProgressCount = progress.filter(p => p.completionPercent > 0 && p.completionPercent < 100).length;
  const overallPct = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.completionPercent, 0) / progress.length)
    : 0;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="pixel-font" style={{ fontSize: '0.75rem', color: 'var(--pixel-gold)', margin: '0 0 0.4rem', letterSpacing: '0.08em' }}>
          🗺️ LEARNING PATH
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#aaa', margin: 0 }}>
          Track your course progress and close skill gaps
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '6rem', backgroundColor: '#2a2a4a', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Overall stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Overall Progress', value: `${overallPct}%`, color: '#4a9ade' },
              { label: 'Completed', value: completedCount, color: '#2ecc71' },
              { label: 'In Progress', value: inProgressCount, color: '#FFD700' },
              { label: 'Total Courses', value: progress.length, color: '#aaa' },
            ].map(({ label, value, color }) => (
              <div key={label} className="pixel-card" style={{
                padding: '0.85rem 1.25rem', flex: 1, minWidth: '130px',
                borderColor: color, boxShadow: `3px 3px 0 ${color}44`,
              }}>
                <div style={{ fontSize: '0.6rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Skill gap summary */}
          <SkillGapSummary recommended={recommended} />

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {([['all', 'All'], ['inprogress', '▶ In Progress'], ['notstarted', '○ Not Started'], ['completed', '✓ Completed']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className="pixel-btn"
                style={{
                  padding: '0.4rem 0.85rem', fontSize: '0.7rem', fontWeight: 600,
                  backgroundColor: filter === val ? 'var(--pixel-accent)' : 'transparent',
                  color: filter === val ? 'var(--pixel-gold)' : '#aaa',
                  border: `2px solid ${filter === val ? 'var(--pixel-gold)' : '#446'}`,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Course progress grid */}
          {filteredProgress.length === 0 ? (
            <div className="pixel-card" style={{ padding: '2.5rem', textAlign: 'center', borderStyle: 'dashed', borderColor: '#446' }}>
              <p style={{ color: '#aaa', fontSize: '0.85rem', margin: 0 }}>No courses match this filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {/* Sort: recommended first, then in-progress, then not started, then completed */}
              {[...filteredProgress]
                .sort((a, b) => {
                  const aRec = recommendedIds.has(a.courseId) ? 0 : 1;
                  const bRec = recommendedIds.has(b.courseId) ? 0 : 1;
                  if (aRec !== bRec) return aRec - bRec;
                  const statusOrder = (p: CourseProgress) =>
                    p.completionPercent === 100 ? 2 : p.completionPercent > 0 ? 0 : 1;
                  return statusOrder(a) - statusOrder(b);
                })
                .map(p => (
                  <CourseProgressCard
                    key={p.courseId}
                    progress={p}
                    recommended={recommendedIds.has(p.courseId)}
                    onStart={handleStartCourse}
                  />
                ))}
            </div>
          )}

          {/* Link to jobs */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center', padding: '1.5rem', backgroundColor: '#1a1a2e', border: '2px dashed #4a9ade', borderRadius: '8px' }}>
            <h3 className="pixel-font" style={{ fontSize: '0.65rem', color: 'var(--pixel-gold)', margin: '0 0 0.75rem', letterSpacing: '0.05em' }}>
              🚀 LEVEL UP YOUR CAREER
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#e0e0e0', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Complete recommended courses to close your skill gaps, upgrade your grade, and <strong style={{ color: '#2ecc71' }}>unlock better jobs</strong>!
            </p>
            <button
              className="pixel-btn"
              onClick={() => navigate('/jobs')}
              style={{
                padding: '0.75rem 1.75rem', backgroundColor: 'var(--pixel-accent)',
                color: '#2ecc71', border: '3px solid #2ecc71', boxShadow: '4px 4px 0 #14733e',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
              }}
            >
              💼 Unlock Better Jobs
            </button>
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}

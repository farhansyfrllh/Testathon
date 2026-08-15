import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import GradeBadge from '../components/ui/GradeBadge';
import type { JobDetail, LearningPath } from '../types';

/* ── Skill Pill ─────────────────────────────────────────────── */
function SkillPill({ label, matched }: { label: string; matched: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.25rem 0.6rem', margin: '0.2rem',
      fontSize: '0.75rem', fontWeight: 600,
      border: `2px solid ${matched ? '#2ecc71' : '#e74c3c'}`,
      backgroundColor: matched ? '#0a2a1a' : '#2d1a1a',
      color: matched ? '#2ecc71' : '#e74c3c',
    }}>
      {matched ? '✓' : '✗'} {label}
    </span>
  );
}

/* ── Learning Path Step Card ────────────────────────────────── */
function StepCard({ step, onStart }: { step: LearningPath['steps'][0]; onStart: (courseId: string) => void }) {
  const moduleTypeColor: Record<string, string> = { mcq: '#4a9ade', multi_select: '#9b59b6', drag_drop: '#e67e22' };

  return (
    <div className="pixel-card" style={{
      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
      borderColor: '#4a9ade', position: 'relative',
    }}>
      {/* Step number */}
      <div style={{
        position: 'absolute', top: '-12px', left: '1rem',
        backgroundColor: '#4a9ade', color: '#000',
        padding: '0.2rem 0.6rem', fontSize: '0.65rem', fontWeight: 700,
      }}>
        STEP {step.step}
      </div>

      <h4 style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#e0e0e0' }}>
        {step.courseTitle}
      </h4>

      <span style={{
        display: 'inline-block', fontSize: '0.65rem', padding: '0.15rem 0.45rem',
        backgroundColor: '#1a3a5c', border: '1px solid #4a9ade', color: '#4a9ade',
      }}>
        {step.courseCategory}
      </span>

      {/* Skills you'll gain */}
      <div>
        <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          🎯 Skills you'll gain:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {step.skillsGained.map(s => (
            <span key={s} style={{
              padding: '0.15rem 0.45rem', fontSize: '0.65rem',
              backgroundColor: '#0a2a1a', border: '1px solid #2ecc71', color: '#2ecc71',
            }}>+{s}</span>
          ))}
        </div>
      </div>

      {/* Reason */}
      {step.reasonForOrder && (
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#888', fontStyle: 'italic' }}>
          💡 {step.reasonForOrder}
        </p>
      )}

      <button
        className="pixel-btn"
        onClick={() => onStart(step.courseId)}
        style={{
          padding: '0.5rem 1rem', backgroundColor: 'var(--pixel-accent)',
          color: '#4a9ade', border: '2px solid #4a9ade', cursor: 'pointer',
          fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-start',
        }}
      >
        ▶ Start Course
      </button>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPath, setShowPath] = useState(false);

  useEffect(() => {
    if (!jobId || !user?.id) return;
    setLoading(true);

    Promise.all([
      apiClient.get<{ success: boolean; data: JobDetail }>(`/api/jobs/${jobId}/detail/${user.id}`),
      apiClient.get<{ success: boolean; data: LearningPath }>(`/api/jobs/${jobId}/learning-path/${user.id}`),
    ]).then(([detailRes, pathRes]) => {
      if (detailRes.data.success) setDetail(detailRes.data.data);
      if (pathRes.data.success) setPath(pathRes.data.data);
    }).catch(() => {
      navigate('/jobs');
    }).finally(() => setLoading(false));
  }, [jobId, user?.id]);

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

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '4rem', backgroundColor: '#2a2a4a', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      </div>
    );
  }

  if (!detail) return null;

  let requiredSkills: string[] = [];
  try { requiredSkills = JSON.parse(detail.requiredSkillsJson ?? '[]'); } catch { requiredSkills = []; }

  const gradeColors: Record<string, string> = { Unranked: '#888', Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700' };
  const matchColor = detail.matchScore >= 80 ? '#2ecc71' : detail.matchScore >= 50 ? '#FFD700' : '#e74c3c';
  const isBatam = detail.location.toLowerCase().includes('batam');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/jobs')}
        style={{ background: 'none', border: 'none', color: '#4a9ade', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '1rem', padding: 0 }}
      >
        ← Back to Jobs
      </button>

      {/* Header card */}
      <div className="pixel-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: detail.matchScore >= 80 ? 'var(--pixel-gold)' : '#334' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h1 className="pixel-font" style={{ fontSize: '0.65rem', color: 'var(--pixel-gold)', margin: '0 0 0.5rem', lineHeight: 1.8 }}>
              {detail.title.toUpperCase()}
            </h1>
            {detail.company && (
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#aaa', fontWeight: 500 }}>{detail.company}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 600,
                backgroundColor: isBatam ? '#0f2a4a' : '#0a2a1a',
                border: `2px solid ${isBatam ? '#4a9ade' : '#2ecc71'}`,
                color: isBatam ? '#4a9ade' : '#2ecc71',
              }}>
                {isBatam ? '🇮🇩' : '🇸🇬'} {detail.location}
              </span>
              <GradeBadge grade={detail.minGrade} size="sm" />
            </div>
          </div>

          {/* Match Score Circle */}
          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <div style={{
              width: '80px', height: '80px', border: `4px solid ${matchColor}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.4rem', boxShadow: `0 0 12px ${matchColor}44`,
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: matchColor, lineHeight: 1 }}>
                {Math.round(detail.matchScore)}
              </span>
              <span style={{ fontSize: '0.55rem', color: matchColor }}>% match</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: detail.userMeetsGrade ? '#2ecc71' : '#e74c3c' }}>
              {detail.userMeetsGrade ? '✓ Grade OK' : '✗ Grade needed'}
            </span>
          </div>
        </div>

        {detail.description && (
          <p style={{ margin: '1rem 0 0', fontSize: '0.82rem', color: '#bbb', lineHeight: 1.7 }}>
            {detail.description}
          </p>
        )}
      </div>

      {/* Skill Gap Analysis */}
      <section className="pixel-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 className="pixel-font" style={{ fontSize: '0.5rem', color: '#aaa', margin: '0 0 1rem', letterSpacing: '0.08em' }}>
          ⚡ SKILL GAP ANALYSIS
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2ecc71' }}>{detail.matchedSkills.length}</div>
            <div style={{ fontSize: '0.65rem', color: '#aaa' }}>Skills Matched</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e74c3c' }}>{detail.missingSkills.length}</div>
            <div style={{ fontSize: '0.65rem', color: '#aaa' }}>Skills Missing</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--pixel-gold)' }}>{requiredSkills.length}</div>
            <div style={{ fontSize: '0.65rem', color: '#aaa' }}>Total Required</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ height: '12px', backgroundColor: '#2a2a4a', border: '2px solid #334', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: `${detail.matchScore}%`, height: '100%',
              background: `linear-gradient(90deg, #e74c3c, ${matchColor})`,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>

        <div role="list" aria-label="Required skills">
          {requiredSkills.map(skill => (
            <SkillPill key={skill} label={skill} matched={detail.matchedSkills.some(m => m.toLowerCase() === skill.toLowerCase())} />
          ))}
        </div>
      </section>

      {/* Learning Path */}
      {path && (
        <section className="pixel-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="pixel-font" style={{ fontSize: '0.5rem', color: '#aaa', margin: 0, letterSpacing: '0.08em' }}>
              🗺️ LEARNING PATH TO GET THIS JOB
            </h2>
            <button
              onClick={() => setShowPath(!showPath)}
              style={{
                background: 'none', border: '2px solid #4a9ade', color: '#4a9ade',
                cursor: 'pointer', padding: '0.3rem 0.7rem', fontSize: '0.7rem', fontWeight: 600,
              }}
            >
              {showPath ? '▲ Hide' : '▼ Show Path'}
            </button>
          </div>

          {path.alreadyEligible ? (
            <div style={{ padding: '1rem', backgroundColor: '#0a2a1a', border: '2px solid #2ecc71', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600 }}>
                🎉 You already meet all requirements for this job!
              </p>
            </div>
          ) : showPath && (
            <>
              <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 1rem' }}>
                Complete these {path.steps.length} course{path.steps.length !== 1 ? 's' : ''} to qualify for <strong style={{ color: '#e0e0e0' }}>{path.targetJobTitle}</strong>:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {path.steps.map(step => (
                  <StepCard key={step.step} step={step} onStart={handleStartCourse} />
                ))}
              </div>

              {path.steps.length === 0 && (
                <p style={{ color: '#aaa', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>
                  No specific courses found. Your skills are close — keep practicing!
                </p>
              )}

              <button
                className="pixel-btn"
                onClick={() => navigate('/courses')}
                style={{
                  marginTop: '1.5rem', width: '100%', padding: '0.75rem',
                  backgroundColor: 'var(--pixel-accent)', color: 'var(--pixel-gold)',
                  border: '3px solid var(--pixel-gold)', boxShadow: '4px 4px 0 #8B7500',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                }}
              >
                📚 Browse All Courses
              </button>
            </>
          )}
        </section>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}

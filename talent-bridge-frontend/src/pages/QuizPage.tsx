import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useQuizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';
import XpProgressBar from '../components/quiz/XpProgressBar';
import McqCard from '../components/quiz/McqCard';
import MultiSelectCard from '../components/quiz/MultiSelectCard';
import DragDropQuiz from '../components/quiz/DragDropQuiz';
import GradeBadge from '../components/ui/GradeBadge';
import ConfettiReward from '../components/ui/ConfettiReward';
import type { CourseModule, QuizSubmitRequest, QuizResult } from '../types';

const XP_MAX = 300;

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

/* ── Module Type Badge ───────────────────────────────────── */
function ModuleTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    mcq: { label: '🔘 MCQ', color: '#4a9ade', bg: '#1a3a5c' },
    multi_select: { label: '⚡ MULTI-SELECT', color: '#2ecc71', bg: '#1a3a2a' },
    drag_drop: { label: '🔀 DRAG & DROP', color: '#e67e22', bg: '#2a1a0a' },
  };
  const c = config[type] ?? { label: type.toUpperCase(), color: '#888', bg: '#222' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.5rem',
        fontSize: '0.6rem',
        backgroundColor: c.bg,
        border: `1px solid ${c.color}`,
        color: c.color,
      }}
    >
      {c.label}
    </span>
  );
}

/* ── Result Card ─────────────────────────────────────────── */
function ResultCard({
  result,
  onNext,
  onBack,
  hasNext,
  prevGrade,
}: {
  result: QuizResult;
  onNext: () => void;
  onBack: () => void;
  hasNext: boolean;
  prevGrade: string | null;
}) {
  const GRADE_ORDER: Record<string, number> = { Unranked: 0, Bronze: 1, Silver: 2, Gold: 3 };
  const gradeUp =
    prevGrade !== null &&
    (GRADE_ORDER[result.grade] ?? 0) > (GRADE_ORDER[prevGrade] ?? 0);

  const passed = result.passed;
  return (
    <div
      className="pixel-card"
      style={{
        padding: '2rem',
        textAlign: 'center',
        borderColor: passed ? 'var(--pixel-gold)' : '#e74c3c',
        boxShadow: passed ? '4px 4px 0 #8B7500' : '4px 4px 0 #7a0000',
      }}
      role="region"
      aria-label="Quiz result"
    >
      <p style={{ fontSize: '3rem', margin: '0 0 0.75rem' }} aria-hidden="true">
        {passed ? '🏆' : '😅'}
      </p>
      <h2
        className="pixel-font"
        style={{ fontSize: '0.65rem', color: passed ? 'var(--pixel-gold)' : '#e74c3c', marginBottom: '1rem' }}
      >
        {passed ? 'MODULE COMPLETE!' : 'KEEP PRACTICING!'}
      </h2>

      {/* Score — large display */}
      <div
        style={{
          fontSize: '3rem',
          fontWeight: 900,
          color: passed ? 'var(--pixel-gold)' : '#e74c3c',
          lineHeight: 1,
          marginBottom: '1rem',
        }}
        aria-label={`Score: ${Math.round(result.score)}%`}
      >
        {Math.round(result.score)}%
      </div>

      {/* Grade badge + XP */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.55rem', color: '#aaa', marginBottom: '0.5rem', fontFamily: "'Press Start 2P', cursive" }}>GRADE</div>
          <GradeBadge grade={result.grade} size="lg" />
          {gradeUp && (
            <div
              style={{
                marginTop: '0.4rem',
                fontSize: '0.5rem',
                color: 'var(--pixel-gold)',
                fontFamily: "'Press Start 2P', cursive",
                animation: 'gradeUp 0.6s ease-out forwards',
              }}
              aria-label="Grade up!"
            >
              ▲ GRADE UP!
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.55rem', color: '#aaa', marginBottom: '0.5rem', fontFamily: "'Press Start 2P', cursive" }}>XP GAINED</div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              color: 'var(--pixel-gold)',
              animation: 'xpPop 0.5s ease-out forwards',
            }}
            aria-label={`XP gained: ${result.xpGained}`}
          >
            +{result.xpGained} XP
            {Math.round(result.score) === 100 && (
              <div style={{ fontSize: '0.5rem', color: '#e74c3c', marginTop: '0.5rem', animation: 'pulse 1s infinite' }}>
                🔥 PERFECT COMBO 2X!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {hasNext && (
          <button
            className="pixel-btn"
            onClick={onNext}
            style={{
              padding: '0.7rem 1.5rem',
              backgroundColor: 'var(--pixel-accent)',
              color: 'var(--pixel-gold)',
              border: '2px solid var(--pixel-gold)',
              boxShadow: '3px 3px 0 #8B7500',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            ▶ NEXT MODULE
          </button>
        )}
        <button
          className="pixel-btn"
          onClick={onBack}
          style={{
            padding: '0.7rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#aaa',
            border: '2px solid #446',
            boxShadow: '3px 3px 0 #000',
            cursor: 'pointer',
            fontSize: '0.75rem',
          }}
        >
          ← BACK TO COURSES
        </button>
      </div>

      {/* XP pop animation + grade-up animation */}
      <style>{`
        @keyframes xpPop {
          0%   { transform: scale(0.5) translateY(10px); opacity: 0; }
          60%  { transform: scale(1.2) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes gradeUp {
          0%   { transform: scale(0.8) translateY(6px); opacity: 0; }
          60%  { transform: scale(1.15) translateY(-3px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function QuizPage() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();

  const xp = useQuizStore((s) => s.xp);
  const answers = useQuizStore((s) => s.answers);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);
  const setCurrentModule = useQuizStore((s) => s.setCurrentModule);

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [prevGrade, setPrevGrade] = useState<string | null>(null);

  // Fetch modules on mount / courseId change
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setResult(null);

    apiClient
      .get<{ success: boolean; data: CourseModule[] }>(`/api/courses/${courseId}/modules`)
      .then((res) => {
        if (!cancelled) {
          if (res.data.success) {
            const sorted = [...(res.data.data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
            setModules(sorted);
          } else {
            setError('Failed to load course modules.');
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Terjadi kesalahan, coba lagi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [courseId]);

  // Reset quiz state when moduleId changes
  useEffect(() => {
    resetQuiz();
    setQuestionIndex(0);
    setResult(null);
    setSubmitError('');
    if (moduleId) setCurrentModule(moduleId);
  }, [moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentModule = modules.find((m) => m.id === moduleId);
  const questions = currentModule?.questions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[questionIndex];

  const moduleIndex = modules.findIndex((m) => m.id === moduleId);
  const nextModule = modules[moduleIndex + 1] ?? null;
  const prevModule = modules[moduleIndex - 1] ?? null;

  const handleNextQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((i) => i + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    if (!moduleId) return;
    setSubmitting(true);
    setSubmitError('');

    // Capture current grade before submit so we can show grade-up indicator
    const currentGrade = useAuthStore.getState().user?.grade ?? null;
    setPrevGrade(currentGrade);

    try {
      // Build answers payload
      // For drag_drop modules, each question needs its own slot→optionId mapping.
      // For mcq/multi_select, selectedOptionIds carries the answer.
      const answersPayload: QuizSubmitRequest['answers'] = questions.map((q) => {
        const base = {
          questionId: q.id,
          selectedOptionIds: answers[q.id] ?? [],
        };
        if (currentModule?.moduleType === 'drag_drop') {
          const dragMap = useQuizStore.getState().getDragDropMappingForQuestion(q.id);
          return { ...base, dragDropMapping: dragMap };
        }
        return base;
      });

      const res = await apiClient.post<{ success: boolean; data: QuizResult }>(
        `/api/quiz/${moduleId}/submit`,
        { answers: answersPayload } satisfies QuizSubmitRequest
      );

      if (res.data.success) {
        const quizResult = res.data.data;
        setResult(quizResult);
        // Add XP to quiz store so XP bar updates
        useQuizStore.getState().addXp(quizResult.xpGained);
        // Update grade in auth store
        useAuthStore.getState().updateGrade(quizResult.grade);
      } else {
        setSubmitError('Submission failed. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextModule = () => {
    if (nextModule && courseId) {
      navigate(`/courses/${courseId}/quiz/${nextModule.id}`);
    }
  };

  // Theme selection based on module title
  let themeStyle: React.CSSProperties = { backgroundColor: 'transparent' };
  if (currentModule) {
    const title = currentModule.title.toLowerCase();
    if (title.includes('cyber') || title.includes('security')) {
      // Server room malam
      themeStyle = { backgroundColor: '#051014', backgroundImage: 'radial-gradient(#1a3c34 1px, transparent 1px)', backgroundSize: '20px 20px', minHeight: '100vh' };
    } else if (title.includes('network') || title.includes('connect')) {
      // Control room
      themeStyle = { backgroundColor: '#0b162c', backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(30, 80, 150, .3) 25%, rgba(30, 80, 150, .3) 26%, transparent 27%, transparent 74%, rgba(30, 80, 150, .3) 75%, rgba(30, 80, 150, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(30, 80, 150, .3) 25%, rgba(30, 80, 150, .3) 26%, transparent 27%, transparent 74%, rgba(30, 80, 150, .3) 75%, rgba(30, 80, 150, .3) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px', minHeight: '100vh' };
    } else if (title.includes('data') || title.includes('fundamental')) {
      // Server rack
      themeStyle = { backgroundColor: '#1a1025', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #2a1045 19px, #2a1045 20px)', backgroundSize: '20px 20px', minHeight: '100vh' };
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={themeStyle}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Loading state */}
      {loading && (
        <div aria-busy="true" aria-label="Loading quiz">
          <SkeletonBlock height="3rem" />
          <div style={{ height: '1rem' }} />
          <SkeletonBlock height="1.5rem" />
          <div style={{ height: '1rem' }} />
          <SkeletonBlock height="10rem" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          className="pixel-card"
          style={{ padding: '2rem', textAlign: 'center', borderColor: '#e74c3c' }}
          role="alert"
        >
          <p style={{ fontSize: '0.85rem', color: '#e74c3c', margin: '0 0 1rem' }}>⚠ {error}</p>
          <button
            className="pixel-btn"
            onClick={() => navigate('/courses')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#aaa',
              border: '2px solid #446',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            ← Back to Courses
          </button>
        </div>
      )}

      {/* Main quiz content */}
      {!loading && !error && (
        <>
          {/* XP Progress Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <XpProgressBar current={xp} max={XP_MAX} />
          </div>

          {/* Module Breadcrumb / Nav */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
              fontSize: '0.72rem',
              color: '#aaa',
            }}
            aria-label="Module navigation"
          >
            <button
              onClick={() => navigate('/courses')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4a9ade',
                cursor: 'pointer',
                fontSize: '0.72rem',
                padding: 0,
              }}
            >
              📚 Courses
            </button>
            <span aria-hidden="true">›</span>
            {modules.map((m, idx) => (
              <span key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {idx > 0 && <span aria-hidden="true" style={{ color: '#446' }}>›</span>}
                <button
                  onClick={() => navigate(`/courses/${courseId}/quiz/${m.id}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.3rem',
                    color: m.id === moduleId ? 'var(--pixel-gold)' : '#888',
                    fontWeight: m.id === moduleId ? 700 : 400,
                    borderBottom: m.id === moduleId ? '2px solid var(--pixel-gold)' : 'none',
                  }}
                  aria-current={m.id === moduleId ? 'page' : undefined}
                >
                  M{idx + 1}
                </button>
              </span>
            ))}
          </nav>

          {/* Module not found */}
          {!currentModule && (
            <div
              className="pixel-card"
              style={{ padding: '2rem', textAlign: 'center', borderColor: '#e74c3c' }}
              role="alert"
            >
              <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                Module not found.
              </p>
              <button
                className="pixel-btn"
                onClick={() => navigate('/courses')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#aaa',
                  border: '2px solid #446',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                ← Back to Courses
              </button>
            </div>
          )}

          {/* Quiz area */}
          {currentModule && !result && (
            <>
              {/* Module header */}
              <div
                className="pixel-card"
                style={{
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <h1
                    style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e0e0e0', lineHeight: 1.4 }}
                    aria-label={`Current module: ${currentModule.title}`}
                  >
                    {currentModule.title}
                  </h1>
                  <div style={{ marginTop: '0.4rem' }}>
                    <ModuleTypeBadge type={currentModule.moduleType} />
                  </div>
                </div>

                {/* Module navigation arrows */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {prevModule && (
                    <button
                      className="pixel-btn"
                      onClick={() => navigate(`/courses/${courseId}/quiz/${prevModule.id}`)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'transparent',
                        color: '#aaa',
                        border: '2px solid #446',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                      }}
                      aria-label="Previous module"
                    >
                      ← Prev
                    </button>
                  )}
                  {nextModule && (
                    <button
                      className="pixel-btn"
                      onClick={() => navigate(`/courses/${courseId}/quiz/${nextModule.id}`)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'transparent',
                        color: '#4a9ade',
                        border: '2px solid #4a9ade',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                      }}
                      aria-label="Next module"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>

              {/* Question counter */}
              {totalQuestions > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.5rem 0',
                    borderBottom: '2px solid #334',
                  }}
                >
                  <span
                    className="pixel-font"
                    style={{ fontSize: '0.5rem', color: '#aaa', letterSpacing: '0.05em' }}
                    aria-live="polite"
                    aria-label={`Question ${questionIndex + 1} of ${totalQuestions}`}
                  >
                    QUESTION {questionIndex + 1}/{totalQuestions}
                  </span>
                  {/* Progress dots */}
                  <div style={{ display: 'flex', gap: '0.3rem' }} aria-hidden="true">
                    {questions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setQuestionIndex(i)}
                        style={{
                          width: '10px',
                          height: '10px',
                          border: '2px solid',
                          borderColor: i === questionIndex ? 'var(--pixel-gold)' : '#446',
                          backgroundColor: i < questionIndex ? 'var(--pixel-gold)' : 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        aria-label={`Go to question ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Question content area */}
              <div
                className="pixel-card"
                style={{ 
                  padding: '1.5rem', 
                  marginBottom: '1.25rem', 
                  minHeight: '200px',
                  borderColor: (questionIndex + 1) % 5 === 0 ? '#e74c3c' : '#334',
                  boxShadow: (questionIndex + 1) % 5 === 0 ? '0 0 15px #e74c3c' : '4px 4px 0 #000',
                  animation: (questionIndex + 1) % 5 === 0 ? 'shake 0.5s' : 'none'
                }}
              >
                {currentQuestion ? (
                  <div>
                    {(questionIndex + 1) % 5 === 0 && (
                      <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#e74c3c', fontSize: '1.2rem', fontWeight: 900, fontFamily: "'Press Start 2P', cursive", animation: 'pulse 1s infinite' }}>
                        💀 BOSS LEVEL 💀
                      </div>
                    )}
                    <p
                      style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e0e0e0', margin: '0 0 1.25rem', lineHeight: 1.6 }}
                    >
                      {currentQuestion.questionText}
                    </p>

                    {/* MCQ & True/False — single-select */}
                    {(currentModule.moduleType === 'mcq' || currentModule.moduleType === 'true_false') && (
                      <div
                        role="radiogroup"
                        aria-label={`Options for question ${questionIndex + 1}`}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
                      >
                        {currentQuestion.options
                          .slice()
                          .sort((a, b) => a.position - b.position)
                          .map((opt, idx) => {
                            const label = String.fromCharCode(65 + idx); // A, B, C, D …
                            const selectedIds = answers[currentQuestion.id] ?? [];
                            const isSelected = selectedIds.includes(opt.id);
                            return (
                              <McqCard
                                key={opt.id}
                                option={opt}
                                label={label}
                                isSelected={isSelected}
                                onSelect={(optionId) => {
                                  // Single-select: replace any previous answer
                                  useQuizStore.getState().setAnswer(currentQuestion.id, [optionId]);
                                }}
                              />
                            );
                          })}
                      </div>
                    )}

                    {/* Multi-select — toggle multiple */}
                    {currentModule.moduleType === 'multi_select' && (
                      <div
                        role="group"
                        aria-label={`Options for question ${questionIndex + 1} (select all that apply)`}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
                      >
                        <p
                          style={{
                            fontSize: '0.7rem',
                            color: '#2ecc71',
                            margin: '0 0 0.5rem',
                            fontFamily: "'Press Start 2P', cursive",
                          }}
                        >
                          ⚡ SELECT ALL THAT APPLY
                        </p>
                        {currentQuestion.options
                          .slice()
                          .sort((a, b) => a.position - b.position)
                          .map((opt, idx) => {
                            const label = String.fromCharCode(65 + idx);
                            const selectedIds = answers[currentQuestion.id] ?? [];
                            const isSelected = selectedIds.includes(opt.id);
                            return (
                              <MultiSelectCard
                                key={opt.id}
                                option={opt}
                                label={label}
                                isSelected={isSelected}
                                onToggle={(optionId) => {
                                  const current = answers[currentQuestion.id] ?? [];
                                  const updated = current.includes(optionId)
                                    ? current.filter((id) => id !== optionId)
                                    : [...current, optionId];
                                  useQuizStore.getState().setAnswer(currentQuestion.id, updated);
                                }}
                              />
                            );
                          })}
                      </div>
                    )}

                    {currentModule.moduleType === 'drag_drop' && currentQuestion && (
                      <DragDropQuiz
                        key={currentQuestion.id}
                        question={currentQuestion}
                        initialMapping={useQuizStore.getState().getDragDropMappingForQuestion(currentQuestion.id)}
                        onMappingChange={(mapping) => {
                          // mapping: { slotPosition: optionId }
                          // sync each entry into quizStore keyed by questionId::slotId
                          const { setDragDrop } = useQuizStore.getState();
                          for (const [slotId, componentId] of Object.entries(mapping)) {
                            setDragDrop(currentQuestion.id, slotId, componentId);
                          }
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    style={{ textAlign: 'center', color: '#aaa', fontSize: '0.85rem', padding: '2rem 0' }}
                  >
                    No questions available for this module.
                  </div>
                )}
              </div>

              {/* Navigation + Submit buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Prev / Next question */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="pixel-btn"
                    onClick={handlePrevQuestion}
                    disabled={questionIndex === 0}
                    style={{
                      padding: '0.6rem 1rem',
                      backgroundColor: 'transparent',
                      color: questionIndex === 0 ? '#446' : '#aaa',
                      border: `2px solid ${questionIndex === 0 ? '#334' : '#446'}`,
                      cursor: questionIndex === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                    }}
                    aria-label="Previous question"
                  >
                    ← Prev
                  </button>
                  {questionIndex < totalQuestions - 1 ? (
                    <button
                      className="pixel-btn"
                      onClick={handleNextQuestion}
                      style={{
                        padding: '0.6rem 1rem',
                        backgroundColor: 'var(--pixel-accent)',
                        color: '#4a9ade',
                        border: '2px solid #4a9ade',
                        boxShadow: '3px 3px 0 #1a4a7a',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                      aria-label="Next question"
                    >
                      Next Question →
                    </button>
                  ) : null}
                </div>

                {/* Submit Quiz */}
                <button
                  className="pixel-btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: submitting ? '#333' : 'var(--pixel-accent)',
                    color: submitting ? '#888' : 'var(--pixel-gold)',
                    border: `2px solid ${submitting ? '#555' : 'var(--pixel-gold)'}`,
                    boxShadow: submitting ? 'none' : '3px 3px 0 #8B7500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                  aria-label="Submit quiz"
                >
                  {submitting ? '⏳ Grading...' : '✅ Submit Quiz'}
                </button>
              </div>

              {/* Submit error */}
              {submitError && (
                <p
                  style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#e74c3c' }}
                  role="alert"
                >
                  ⚠ {submitError}
                </p>
              )}
            </>
          )}

          {/* Confetti reward when passed */}
          <ConfettiReward show={result !== null && result.passed} />

          {/* Result screen */}
          {currentModule && result && (
            <ResultCard
              result={result}
              onNext={handleNextModule}
              onBack={() => navigate('/courses')}
              hasNext={!!nextModule}
              prevGrade={prevGrade}
            />
          )}
        </>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
      </div>
    </div>
  );
}

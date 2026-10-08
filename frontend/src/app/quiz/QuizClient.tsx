'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateQuiz } from '@/lib/api';
import { Quiz, QuizQuestion } from '@/types';

function QuestionCard({ q, index, onAnswer, answered }: {
  q: QuizQuestion;
  index: number;
  onAnswer: (qId: number, selectedId: string) => void;
  answered: string | null;
}) {
  const isCorrect = answered === q.correct_option_id;
  return (
    <div className="card fade-up" style={{ marginBottom: '1rem', animationDelay: `${index * 0.07}s` }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <span className="badge badge-purple">Q{index + 1}</span>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.5 }}>{q.question}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {q.options.map(opt => {
          const isSelected = answered === opt.id;
          const isRight = opt.id === q.correct_option_id;
          let bg = 'var(--bg-glass)', border = 'var(--border)', color = 'var(--text-secondary)';
          if (answered) {
            if (isRight)   { bg = 'rgba(16,185,129,0.12)'; border = 'var(--green)'; color = 'var(--green)'; }
            if (isSelected && !isRight) { bg = 'rgba(239,68,68,0.1)'; border = 'var(--red)'; color = 'var(--red)'; }
          }
          return (
            <button
              key={opt.id}
              disabled={!!answered}
              onClick={() => onAnswer(q.id, opt.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 1rem',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 'var(--radius-md)',
                cursor: answered ? 'default' : 'pointer',
                color, fontSize: '0.875rem', textAlign: 'left',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{
                width: 26, height: 26, flexShrink: 0,
                borderRadius: '50%',
                background: isRight && answered ? 'var(--green)' : (isSelected && answered ? 'var(--red)' : 'var(--border)'),
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem',
              }}>{opt.id}</span>
              {opt.text}
            </button>
          );
        })}
      </div>
      {answered && (
        <div style={{
          marginTop: '0.85rem', padding: '0.8rem', borderRadius: 'var(--radius-md)',
          background: isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 600, color: isCorrect ? 'var(--green)' : 'var(--red)' }}>
            {isCorrect ? '✅ Correct! ' : '❌ Incorrect. '}
          </span>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

export default function QuizClient() {
  const params = useSearchParams();
  const docId = params.get('doc') || '';
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [numQ, setNumQ] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const generate = async () => {
    if (!docId) { setError('No document selected. Go to Dashboard and upload a document first.'); return; }
    setError('');
    setAnswers({});
    setIsLoading(true);
    try {
      const result = await generateQuiz(docId, numQ);
      setQuiz(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (qId: number, selectedId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: selectedId }));
  };

  const answered = Object.keys(answers).length;
  const correct = quiz ? quiz.questions.filter(q => answers[q.id] === q.correct_option_id).length : 0;
  const completed = quiz ? answered === quiz.questions.length : false;
  const score = quiz ? Math.round((correct / quiz.questions.length) * 100) : 0;

  return (
    <div className="container section">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>✏️ Practice Quiz</h2>
        <p style={{ marginTop: '0.3rem' }}>AI-generated multiple-choice questions from your study materials.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {docId ? (
          <span className="badge badge-purple">📎 doc: {docId.slice(0, 8)}…</span>
        ) : (
          <span className="badge badge-amber">⚠️ No document selected</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Questions:</label>
          <select value={numQ} onChange={e => setNumQ(Number(e.target.value))} className="input" style={{ width: '70px', padding: '0.4rem 0.6rem' }}>
            {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn btn-primary" onClick={generate} disabled={isLoading || !docId}>
            {isLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating…</> : '⚡ Generate Quiz'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', marginBottom: '1rem' }}>⚠️ {error}</p>}

      {/* Score Banner */}
      {completed && quiz && (
        <div className="card fade-up" style={{
          marginBottom: '1.5rem',
          background: score >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${score >= 70 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{score >= 90 ? '🏆' : score >= 70 ? '🎯' : '📚'}</div>
          <h3 style={{ marginBottom: '0.3rem' }}>Quiz Complete!</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: score >= 70 ? 'var(--green)' : 'var(--amber)' }}>
            {correct} / {quiz.questions.length} — {score}%
          </p>
          <div className="progress-bar" style={{ margin: '1rem auto', maxWidth: '300px' }}>
            <div className="progress-fill" style={{ width: `${score}%` }} />
          </div>
          <button className="btn btn-secondary" onClick={() => { setQuiz(null); setAnswers({}); }}>
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Progress during quiz */}
      {quiz && !completed && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>{answered} of {quiz.questions.length} answered</span>
            <span>{correct} correct so far</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(answered / quiz.questions.length) * 100}%` }} />
          </div>
        </div>
      )}

      {!quiz && !isLoading && (
        <div className="empty-state">
          <div className="empty-icon">✏️</div>
          <p style={{ color: 'var(--text-secondary)' }}>No quiz generated yet.</p>
          <p style={{ fontSize: '0.83rem', marginTop: '0.4rem' }}>{docId ? 'Click "Generate Quiz" to begin.' : 'Upload a document from the Dashboard first.'}</p>
        </div>
      )}

      {quiz && (
        <>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{quiz.title}</h3>
          {quiz.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              answered={answers[q.id] ?? null}
              onAnswer={handleAnswer}
            />
          ))}
        </>
      )}
    </div>
  );
}

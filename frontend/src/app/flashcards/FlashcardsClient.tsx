'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateFlashcards } from '@/lib/api';
import { Flashcard } from '@/types';

function FlipCard({ card, index }: { card: Flashcard; index: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(f => !f)}
      className="fade-up"
      style={{
        animationDelay: `${index * 0.07}s`,
        perspective: '1000px',
        cursor: 'pointer',
        height: '200px',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', textAlign: 'center',
        }}>
          {card.tag && <span className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>{card.tag}</span>}
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 }}>{card.front}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Click to reveal answer</p>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.65 }}>{card.back}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-light)', marginTop: '1rem' }}>Click to flip back</p>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsClient() {
  const params = useSearchParams();
  const docId = params.get('doc') || '';
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [count, setCount] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!docId) { setError('No document selected. Go to Dashboard and upload a document first.'); return; }
    setError('');
    setIsLoading(true);
    try {
      const result = await generateFlashcards(docId, count);
      setCards(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container section">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>🃏 Flashcards</h2>
        <p style={{ marginTop: '0.3rem' }}>AI-generated flip cards from your study materials. Click a card to reveal the answer.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {docId ? (
          <span className="badge badge-purple">📎 doc: {docId.slice(0, 8)}…</span>
        ) : (
          <span className="badge badge-amber">⚠️ No document selected</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Count:</label>
          <select
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="input"
            style={{ width: '70px', padding: '0.4rem 0.6rem' }}
          >
            {[3, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn btn-primary" onClick={generate} disabled={isLoading || !docId}>
            {isLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating…</> : '✨ Generate'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', marginBottom: '1rem' }}>⚠️ {error}</p>}

      {cards.length === 0 && !isLoading ? (
        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <p style={{ color: 'var(--text-secondary)' }}>No flashcards yet.</p>
          <p style={{ fontSize: '0.83rem', marginTop: '0.4rem' }}>{docId ? 'Click "Generate" to create a flashcard deck.' : 'Upload a document from the Dashboard first.'}</p>
        </div>
      ) : (
        <>
          {cards.length > 0 && (
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {cards.length} cards generated · Click any card to flip it
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {cards.map((card, i) => <FlipCard key={i} card={card} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}

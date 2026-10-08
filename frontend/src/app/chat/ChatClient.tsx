'use client';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendChatMessage } from '@/lib/api';
import { ChatMessage, SourceChunk } from '@/types';

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className="fade-up" style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
      gap: '0.6rem',
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--teal))',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem',
        }}>🎓</div>
      )}
      <div style={{ maxWidth: '72%' }}>
        <div style={{
          padding: '0.85rem 1.1rem',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? 'var(--accent)' : 'var(--bg-card)',
          border: isUser ? 'none' : '1px solid var(--border)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>📌 Sources</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {msg.sources.map((s, i) => (
                <span key={i} className="badge badge-purple" title={s.content.slice(0, 120)}>
                  Chunk #{s.chunk_index} · {s.score ? `${(s.score * 100).toFixed(0)}%` : '—'}
                </span>
              ))}
            </div>
          </div>
        )}
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function ChatClient() {
  const params = useSearchParams();
  const docId = params.get('doc') || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await sendChatMessage(userMsg.content, docId || undefined);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources as SourceChunk[],
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${e.message}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container section">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>💬 AI Study Chat</h2>
        <p style={{ marginTop: '0.3rem' }}>Ask anything about your study materials — answers are grounded in your documents.</p>
        {docId && (
          <span className="badge badge-purple" style={{ marginTop: '0.5rem' }}>
            📎 doc: {docId.slice(0, 8)}…
          </span>
        )}
        {!docId && (
          <span className="badge badge-amber" style={{ marginTop: '0.5rem' }}>
            ⚠️ No document selected — using general knowledge
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="card" style={{ height: '55vh', overflowY: 'auto', marginBottom: '1rem', padding: '1.25rem' }}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p style={{ color: 'var(--text-secondary)' }}>Ask your first question to get started!</p>
            <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>Try: <em>"Explain the main concepts in this document"</em></p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--accent), var(--teal))',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
            }}>🎓</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: `pulse-glow 1s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <textarea
          className="textarea"
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={isLoading || !input.trim()}>
          {isLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : '➤'}
        </button>
      </div>
    </div>
  );
}

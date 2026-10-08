'use client';
import { useState } from 'react';
import Link from 'next/link';
import DocumentUpload from '@/components/DocumentUpload';
import { DocumentMetadata } from '@/types';

export default function DashboardClient() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  const handleUpload = (meta: DocumentMetadata) => {
    setDocuments(prev => [meta, ...prev]);
    setActiveDoc(meta.document_id);
  };

  const features = [
    { icon: '💬', title: 'AI Study Chat',   desc: 'Ask questions grounded in your documents using RAG.', href: '/chat',       color: 'var(--accent)' },
    { icon: '🃏', title: 'Flashcards',       desc: 'Auto-generate flip-card decks from your notes.',         href: '/flashcards',color: 'var(--teal)' },
    { icon: '✏️', title: 'Practice Quiz',    desc: 'Multiple-choice tests with answers & explanations.',    href: '/quiz',       color: 'var(--green)' },
  ];

  return (
    <div className="container section">

      {/* Hero */}
      <div className="fade-up" style={{ textAlign: 'center', padding: '3rem 0 2.5rem' }}>
        <span className="badge badge-purple" style={{ marginBottom: '1rem' }}>⚡ Powered by RAG + Gemini</span>
        <h1 style={{ marginBottom: '1rem' }}>
          Your AI-Powered
          <span style={{ display: 'block', background: 'linear-gradient(135deg, var(--accent-light), var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Study Assistant
          </span>
        </h1>
        <p style={{ maxWidth: '540px', margin: '0 auto 2rem', fontSize: '1.1rem', lineHeight: 1.7 }}>
          Upload your study materials and let AI help you understand, memorize, and get tested—all grounded in <em>your own notes</em>.
        </p>
      </div>

      {/* Upload Section */}
      <div className="card fade-up" style={{ marginBottom: '2rem', animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <h3>📤 Upload Study Material</h3>
          {documents.length > 0 && (
            <span className="badge badge-green">{documents.length} uploaded</span>
          )}
        </div>
        <DocumentUpload onUploadSuccess={handleUpload} />
      </div>

      {/* Uploaded Docs List */}
      {documents.length > 0 && (
        <div className="card fade-up" style={{ marginBottom: '2rem', animationDelay: '0.15s' }}>
          <h3 style={{ marginBottom: '1rem' }}>📚 Your Documents</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {documents.map(doc => (
              <div
                key={doc.document_id}
                onClick={() => setActiveDoc(doc.document_id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: activeDoc === doc.document_id ? 'rgba(139,92,246,0.1)' : 'var(--bg-glass)',
                  border: `1px solid ${activeDoc === doc.document_id ? 'var(--border-active)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {doc.file_type === '.pdf' ? '📕' : '📝'}
                  </span>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{doc.filename}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.total_chunks} chunks indexed</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {activeDoc === doc.document_id && (
                    <span className="badge badge-purple">Active</span>
                  )}
                  <span className="badge badge-teal">{doc.file_type}</span>
                </div>
              </div>
            ))}
          </div>
          {activeDoc && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              ✅ Active document ID: <code style={{ color: 'var(--accent-light)', fontSize: '0.78rem' }}>{activeDoc.slice(0, 16)}…</code>
              — all study features will use this document.
            </p>
          )}
        </div>
      )}

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {features.map((f, i) => (
          <Link
            key={f.href}
            href={activeDoc ? `${f.href}?doc=${activeDoc}` : f.href}
            className="card fade-up"
            style={{ animationDelay: `${0.2 + i * 0.08}s`, display: 'block' }}
          >
            <div style={{
              width: '48px', height: '48px',
              borderRadius: 'var(--radius-md)',
              background: `${f.color}22`,
              border: `1px solid ${f.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', marginBottom: '1rem',
            }}>
              {f.icon}
            </div>
            <h3 style={{ marginBottom: '0.4rem' }}>{f.title}</h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
            <div style={{ marginTop: '1rem', color: f.color, fontSize: '0.85rem', fontWeight: 600 }}>
              {activeDoc ? 'Start →' : 'Upload a document to start →'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useState, useCallback } from 'react';
import { uploadDocument } from '@/lib/api';
import { DocumentMetadata } from '@/types';

interface Props {
  onUploadSuccess: (meta: DocumentMetadata) => void;
}

export default function DocumentUpload({ onUploadSuccess }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setIsUploading(true);
    try {
      const result = await uploadDocument(file);
      if (result.success) onUploadSuccess(result.metadata);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        textAlign: 'center',
        background: isDragging ? 'rgba(139,92,246,0.06)' : 'var(--bg-glass)',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
        {isUploading ? '⚙️' : '📄'}
      </div>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>
        {isUploading ? 'Processing document…' : 'Drop your study material here'}
      </p>
      <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Supports <strong style={{ color: 'var(--accent-light)' }}>PDF, TXT, MD</strong> · Max 25 MB
      </p>

      {isUploading ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          <span>📂</span> Browse Files
          <input type="file" accept=".pdf,.txt,.md" style={{ display: 'none' }} onChange={onInputChange} />
        </label>
      )}

      {error && (
        <p style={{ color: 'var(--red)', marginTop: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</p>
      )}
    </div>
  );
}

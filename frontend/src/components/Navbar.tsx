'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';

export default function Navbar() {
  const path = usePathname();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    checkHealth().then(() => setOnline(true)).catch(() => setOnline(false));
  }, []);

  const links = [
    { href: '/',            label: 'Dashboard', icon: '⊞' },
    { href: '/chat',        label: 'Chat',      icon: '💬' },
    { href: '/flashcards',  label: 'Flashcards',icon: '🃏' },
    { href: '/quiz',        label: 'Quiz',      icon: '✏️' },
  ];

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            <div className="navbar-logo">🎓</div>
            <span>StudyAI</span>
          </Link>

          <ul className="navbar-nav">
            {links.map(l => (
              <li key={l.href}>
                <Link href={l.href} className={path === l.href ? 'active' : ''}>
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className={`status-dot ${online ? 'online' : ''}`} title={online ? 'Backend online' : 'Backend offline'} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {online ? 'API Online' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

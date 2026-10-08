import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI Study Assistant – Learn Smarter with RAG',
  description: 'Upload your study materials and let AI help you chat, create flashcards, and generate quizzes using Retrieval-Augmented Generation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

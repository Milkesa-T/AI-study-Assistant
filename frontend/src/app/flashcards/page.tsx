import type { Metadata } from 'next';
import FlashcardsClient from './FlashcardsClient';

export const metadata: Metadata = {
  title: 'Flashcards – AI Study Assistant',
  description: 'Auto-generate interactive flip-card flashcards from your uploaded study materials.',
};

export default function FlashcardsPage() {
  return <FlashcardsClient />;
}

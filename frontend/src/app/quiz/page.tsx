import type { Metadata } from 'next';
import QuizClient from './QuizClient';

export const metadata: Metadata = {
  title: 'Quiz – AI Study Assistant',
  description: 'Take an AI-generated multiple-choice quiz from your uploaded study materials.',
};

export default function QuizPage() {
  return <QuizClient />;
}

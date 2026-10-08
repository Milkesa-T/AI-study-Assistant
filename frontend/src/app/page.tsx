import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard – AI Study Assistant',
  description: 'Upload your study materials and manage your AI-powered learning session.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}

import type { Metadata } from 'next';
import ChatClient from './ChatClient';

export const metadata: Metadata = {
  title: 'Chat – AI Study Assistant',
  description: 'Ask questions about your uploaded study materials and receive grounded, cited AI answers.',
};

export default function ChatPage() {
  return <ChatClient />;
}

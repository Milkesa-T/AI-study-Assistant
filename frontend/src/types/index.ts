export interface DocumentMetadata {
  document_id: string;
  filename: string;
  file_type: string;
  total_chunks: number;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  timestamp: string;
}

export interface SourceChunk {
  content: string;
  document_id: string;
  chunk_index: number;
  score?: number;
}

export interface Flashcard {
  front: string;
  back: string;
  tag?: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  correct_option_id: string;
  explanation: string;
}

export interface Quiz {
  document_id?: string;
  title: string;
  questions: QuizQuestion[];
}

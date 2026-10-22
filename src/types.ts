export interface VocabItem {
  no: number;
  chapter: number;
  japanese: string;
  kanji?: string;
  indonesian: string;
  notes?: string;
}

export interface ChapterMeta {
  chapter: number;
  title: string;
  level: 'N5' | 'N4';
}

export interface QuizQuestion {
  id: number;
  chapter: number;
  chapterLabel: string;
  japanese: string;
  kanji?: string;
  hiragana: string;
  meaning: string;
  questionPrompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  questionType?: 'jp_to_id' | 'id_to_jp';
}

export interface QuizResult {
  id: string;
  participantName: string;
  chapterMode: string;
  chapterModeTitle: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  timeRemainingSeconds: number;
  wrongQuestionIndices: number[];
  questions: QuizQuestion[];
  userAnswers: Record<number, number>;
  completedAt: string;
}

export type AppView = 'home' | 'quiz' | 'result' | 'dictionary' | 'flashcards' | 'editor' | 'history';

export interface QuizConfig {
  participantName: string;
  mode: string; // 'bab1', 'bab2', ..., 'shokyuu1', 'shokyuu2', 'all', 'custom'
  selectedChapters?: number[];
  questionLimit: 'all' | 10 | 20 | 30;
  questionType: 'jp_to_id' | 'id_to_jp' | 'mixed';
  instantFeedback: boolean;
  showHiraganaForKanji: boolean;
  autoPlayAudio: boolean;
  autoAdvance?: boolean;
}

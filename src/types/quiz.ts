export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  category: string;
  difficulty: Difficulty;
  points: number;
}

export interface QuizCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  gradient: string;
  badgeColor: string;
  questions: QuizQuestion[];
}

export interface UserAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  timeTakenSecs: number;
}

export interface QuizResultData {
  id: string;
  quizTitle: string;
  category: string;
  totalQuestions: number;
  correctAnswersCount: number;
  score: number;
  maxScore: number;
  timeSpentSecs: number;
  date: string;
  answers: UserAnswer[];
  questions: QuizQuestion[];
}

export interface QuizSettings {
  timerSeconds: number; // 0 for untimed, or 15, 30, 45
  soundEnabled: boolean;
  shuffleQuestions: boolean;
  showImmediateFeedback: boolean;
}

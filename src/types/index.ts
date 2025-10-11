// Core types for the quiz application

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option (0-3)
}

export interface Quiz {
  topic: string;
  questions: Question[];
}

export interface UserAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  answers: UserAnswer[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// AI Service types
export interface GenerateQuestionsRequest {
  topic: string;
  count: number;
}

export interface GenerateQuestionsResponse {
  questions: Question[];
}

export interface GenerateFeedbackRequest {
  topic: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface GenerateFeedbackResponse {
  message: string;
}

// API Error types
export interface APIError {
  message: string;
  code?: string;
}

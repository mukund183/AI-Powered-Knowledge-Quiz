import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Question, UserAnswer, QuizResult } from '../types';

interface QuizContextType {
  // Quiz state
  currentTopic: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  quizResult: QuizResult | null;
  isLoading: boolean;
  error: string | null;
  isReviewMode: boolean;
  isDarkMode: boolean;

  // Actions
  setTopic: (topic: string) => void;
  setQuestions: (questions: Question[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  answerQuestion: (questionId: string, selectedOption: number, correctAnswer: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishQuiz: () => void;
  // New: finalizeQuiz builds result synchronously from provided answers
  finalizeQuiz: (answers: UserAnswer[]) => void;
  resetQuiz: () => void;
  setReviewMode: (isReview: boolean) => void;
  toggleTheme: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within QuizProvider');
  }
  return context;
};

interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [questions, setQuestionsState] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  // Dark mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark mode class to document body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev: boolean) => !prev);
  }, []);

  const setTopic = useCallback((topic: string) => {
    setCurrentTopic(topic);
    setError(null);
  }, []);

  const setQuestions = useCallback((newQuestions: Question[]) => {
    setQuestionsState(newQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const answerQuestion = useCallback((questionId: string, selectedOption: number, correctAnswer: number) => {
    const isCorrect = selectedOption === correctAnswer;
    
    // Update or add answer
    setUserAnswers(currentAnswers => {
      const existingAnswerIndex = currentAnswers.findIndex(a => a.questionId === questionId);
      
      if (existingAnswerIndex >= 0) {
        // Update existing answer
        const newAnswers = [...currentAnswers];
        newAnswers[existingAnswerIndex] = {
          questionId,
          selectedOption,
          isCorrect
        };
        return newAnswers;
      } else {
        // Add new answer
        return [...currentAnswers, {
          questionId,
          selectedOption,
          isCorrect
        }];
      }
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex(current => {
      if (current < questions.length - 1) {
        return current + 1;
      }
      return current;
    });
  }, [questions.length]);

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex(current => {
      if (current > 0) {
        return current - 1;
      }
      return current;
    });
  }, []);

  const finishQuiz = useCallback(() => {
    setUserAnswers(currentAnswers => {
      const correctAnswers = currentAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = questions.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      const result: QuizResult = {
        totalQuestions,
        correctAnswers,
        score,
        answers: currentAnswers
      };

      setQuizResult(result);
      return currentAnswers;
    });
  }, [questions.length]);

  // Compute and set quiz result synchronously from a provided answers array.
  // This is useful to avoid timing issues when navigating immediately after final answer.
  const finalizeQuiz = useCallback((answers: UserAnswer[]) => {
    setUserAnswers(answers);

    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    const result: QuizResult = {
      totalQuestions,
      correctAnswers,
      score,
      answers
    };

    setQuizResult(result);
  }, [questions.length]);

  const resetQuiz = useCallback(() => {
    setCurrentTopic(null);
    setQuestionsState([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setIsLoading(false);
    setError(null);
    setIsReviewMode(false);
  }, []);

  const setReviewMode = useCallback((isReview: boolean) => {
    setIsReviewMode(isReview);
    if (isReview) {
      setCurrentQuestionIndex(0);
    }
  }, []);

  const value: QuizContextType = {
    currentTopic,
    questions,
    currentQuestionIndex,
    userAnswers,
    quizResult,
    isLoading,
    error,
    isReviewMode,
    isDarkMode,
    setTopic,
    setQuestions,
    setLoading,
    setError,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    finishQuiz,
  finalizeQuiz,
    resetQuiz,
    setReviewMode,
    toggleTheme
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

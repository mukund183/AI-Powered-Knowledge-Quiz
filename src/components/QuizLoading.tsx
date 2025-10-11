import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { generateQuestions } from '../services/aiService';
import { QUIZ_CONFIG } from '../constants';
import { ThemeToggle } from './ThemeToggle';
import './QuizLoading.css';

const QuizLoading: React.FC = () => {
  const navigate = useNavigate();
  const { currentTopic, setQuestions, setLoading, setError } = useQuiz();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple calls
    if (hasLoadedRef.current) return;

    const loadQuestions = async () => {
      if (!currentTopic) {
        navigate('/');
        return;
      }

      hasLoadedRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await generateQuestions({
          topic: currentTopic,
          count: QUIZ_CONFIG.QUESTIONS_PER_QUIZ
        });

        setQuestions(response.questions);
        setLoading(false);
        
        // Navigate to quiz screen after a brief delay for UX
        setTimeout(() => {
          navigate('/quiz');
        }, 500);

      } catch (err: any) {
        setError(err.message || 'Failed to generate questions. Please try again.');
        setLoading(false);
        hasLoadedRef.current = false; // Allow retry
      }
    };

    loadQuestions();
  }, [currentTopic, navigate, setQuestions, setLoading, setError]);

  const { error } = useQuiz();

  if (error) {
    return (
      <div className="quiz-loading-container">
        <ThemeToggle />
        <div className="quiz-loading-content">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={() => navigate('/')}>
              Try Another Topic
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-loading-container">
      <ThemeToggle />
      <div className="quiz-loading-content">
        <div className="loading-animation">
          <div className="spinner"></div>
        </div>
        
        <h2 className="loading-title">Generating Your Quiz...</h2>
        <p className="loading-subtitle">
          AI is creating {QUIZ_CONFIG.QUESTIONS_PER_QUIZ} personalized questions about {currentTopic}
        </p>

        <div className="loading-steps">
          <div className="step active">
            <div className="step-icon">🤖</div>
            <div className="step-text">Analyzing topic</div>
          </div>
          <div className="step active">
            <div className="step-icon">📝</div>
            <div className="step-text">Crafting questions</div>
          </div>
          <div className="step active">
            <div className="step-icon">✨</div>
            <div className="step-text">Adding final touches</div>
          </div>
        </div>

        <div className="skeleton-questions">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-option"></div>
              <div className="skeleton-line skeleton-option"></div>
              <div className="skeleton-line skeleton-option"></div>
              <div className="skeleton-line skeleton-option"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizLoading;

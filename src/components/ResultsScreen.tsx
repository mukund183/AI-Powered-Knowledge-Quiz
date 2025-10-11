import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { generateFeedback } from '../services/aiService';
import { ThemeToggle } from './ThemeToggle';
import './ResultsScreen.css';

const ResultsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentTopic, quizResult, questions, resetQuiz, setReviewMode } = useQuiz();
  const [feedback, setFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!quizResult) {
      navigate('/');
      return;
    }

    // Only fetch feedback once - on first mount
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;

    const loadFeedback = async () => {
      setLoadingFeedback(true);
      try {
        const response = await generateFeedback({
          topic: currentTopic || 'this topic',
          score: quizResult.score,
          correctAnswers: quizResult.correctAnswers,
          totalQuestions: quizResult.totalQuestions
        });
        setFeedback(response.message);
      } catch (error) {
        console.error('Failed to load feedback:', error);
        setFeedback('');
      } finally {
        setLoadingFeedback(false);
      }
    };

    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!quizResult) {
    return null;
  }

  const { score, correctAnswers, totalQuestions } = quizResult;

  const getScoreEmoji = () => {
    if (score === 100) return '🏆';
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    if (score >= 40) return '💪';
    return '📚';
  };

  const getScoreColor = () => {
    if (score === 100) return '#f6ad55';
    if (score >= 80) return '#48bb78';
    if (score >= 60) return '#4299e1';
    if (score >= 40) return '#ed8936';
    return '#fc8181';
  };

  const handleTryAgain = () => {
    resetQuiz();
    navigate('/');
  };

  const handleReviewAnswers = () => {
    setReviewMode(true);
    navigate('/quiz');
  };

  return (
    <div className="results-screen-container">
      <ThemeToggle />
      <div className="results-screen-content">
        <div className="results-card">
          <div className="score-emoji">{getScoreEmoji()}</div>
          
          <h1 className="results-title">Quiz Complete!</h1>
          
          <div className="score-circle" style={{ borderColor: getScoreColor() }}>
            <div className="score-value" style={{ color: getScoreColor() }}>
              {score}%
            </div>
            <div className="score-label">Score</div>
          </div>

          <div className="score-details">
            <div className="score-stat">
              <div className="stat-value">{correctAnswers}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="score-divider"></div>
            <div className="score-stat">
              <div className="stat-value">{totalQuestions - correctAnswers}</div>
              <div className="stat-label">Incorrect</div>
            </div>
            <div className="score-divider"></div>
            <div className="score-stat">
              <div className="stat-value">{totalQuestions}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>

          <div className="feedback-section">
            {loadingFeedback ? (
              <div className="feedback-loading">
                <div className="feedback-spinner"></div>
                <p>AI is generating personalized feedback...</p>
              </div>
            ) : feedback ? (
              <div className="feedback-message">
                <div className="feedback-icon">💬</div>
                <p>{feedback}</p>
              </div>
            ) : null}
          </div>

          <div className="answer-review">
            <h3>Answer Summary</h3>
            <div className="review-grid">
              {questions.map((question, index) => {
                const userAnswer = quizResult.answers.find(a => a.questionId === question.id);
                const isCorrect = userAnswer?.isCorrect ?? false;

                return (
                  <div key={question.id} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <span className="review-number">Q{index + 1}</span>
                    <span className="review-status">{isCorrect ? '✓' : '✗'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-button primary" onClick={handleTryAgain}>
              Try Another Topic
            </button>
            <button className="action-button secondary" onClick={handleReviewAnswers}>
              Review Answers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;

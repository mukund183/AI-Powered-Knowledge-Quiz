import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { ThemeToggle } from './ThemeToggle';
import './QuizScreen.css';

const QuizScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    questions,
    currentQuestionIndex,
    userAnswers,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    finalizeQuiz,
    isReviewMode,
    setReviewMode
  } = useQuiz();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Get user's answer for current question
  const userAnswer = userAnswers.find(a => a.questionId === currentQuestion?.id);

  // Load existing answer when question changes
  useEffect(() => {
    const existingAnswer = userAnswers.find(a => a.questionId === currentQuestion?.id);
    setSelectedOption(existingAnswer?.selectedOption ?? null);
  }, [currentQuestionIndex, currentQuestion, userAnswers]);

  if (!currentQuestion) {
    navigate('/');
    return null;
  }

  const handleOptionSelect = (optionIndex: number) => {
    if (isReviewMode) return; // Don't allow changes in review mode
    setSelectedOption(optionIndex);
    answerQuestion(currentQuestion.id, optionIndex, currentQuestion.correctAnswer);
  };

  const handleNext = () => {
    if (isReviewMode) {
      if (isLastQuestion) {
        navigate('/results');
      } else {
        nextQuestion();
      }
      return;
    }

    if (isLastQuestion) {
      // Ensure the latest selected option is recorded
      if (selectedOption !== null) {
        answerQuestion(currentQuestion.id, selectedOption, currentQuestion.correctAnswer);
      }

      // Build final answers synchronously from current state so ResultsScreen receives
      // a stable `quizResult` immediately (avoids flicker when ResultsScreen requests feedback).
      const finalAnswers = (userAnswers || []).slice();
      const existingIndex = finalAnswers.findIndex(a => a.questionId === currentQuestion.id);
      const finalAnswer = {
        questionId: currentQuestion.id,
        selectedOption: selectedOption ?? (existingIndex >= 0 ? finalAnswers[existingIndex].selectedOption : -1),
        isCorrect: (selectedOption ?? (existingIndex >= 0 ? finalAnswers[existingIndex].selectedOption : -1)) === currentQuestion.correctAnswer
      };

      if (existingIndex >= 0) {
        finalAnswers[existingIndex] = finalAnswer;
      } else {
        finalAnswers.push(finalAnswer);
      }

      finalizeQuiz(finalAnswers);
      navigate('/results');
    } else {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    previousQuestion();
  };

  const handleExitReview = () => {
    setReviewMode(false);
    navigate('/results');
  };

  const canProceed = selectedOption !== null || isReviewMode;

  // Get option class based on review mode
  const getOptionClass = (optionIndex: number) => {
    const classes = ['option-button'];
    
    if (isReviewMode && userAnswer) {
      // In review mode, show correct and incorrect answers
      if (optionIndex === currentQuestion.correctAnswer) {
        classes.push('correct-answer');
      }
      if (optionIndex === userAnswer.selectedOption && !userAnswer.isCorrect) {
        classes.push('wrong-answer');
      }
    } else {
      // Normal mode
      if (selectedOption === optionIndex) {
        classes.push('selected');
      }
    }
    
    return classes.join(' ');
  };

  return (
    <div className="quiz-screen-container">
      <ThemeToggle />
      <div className="quiz-screen-content">
        {/* Review mode banner */}
        {isReviewMode && (
          <div className="review-mode-banner">
            <span>📝 Review Mode - Viewing your answers</span>
            <button className="exit-review-button" onClick={handleExitReview}>
              Back to Results
            </button>
          </div>
        )}

        {/* Progress bar */}
        <div className="progress-section">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Question card */}
        <div className="question-card">
          <div className="question-number">Question {currentQuestionIndex + 1}</div>
          <h2 className="question-text">{currentQuestion.question}</h2>

          {isReviewMode && userAnswer && (
            <div className={`review-result ${userAnswer.isCorrect ? 'correct' : 'incorrect'}`}>
              {userAnswer.isCorrect ? (
                <>
                  <span className="result-icon">✓</span>
                  <span className="result-text">Correct!</span>
                </>
              ) : (
                <>
                  <span className="result-icon">✗</span>
                  <span className="result-text">Incorrect</span>
                </>
              )}
            </div>
          )}

          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={getOptionClass(index)}
                onClick={() => handleOptionSelect(index)}
                disabled={isReviewMode}
              >
                <div className="option-indicator">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="option-text">{option}</div>
                {isReviewMode && index === currentQuestion.correctAnswer && (
                  <div className="correct-badge">✓ Correct Answer</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="navigation-buttons">
          <button
            className="nav-button secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            ← Previous
          </button>

          <button
            className={`nav-button primary ${!canProceed ? 'disabled' : ''}`}
            onClick={handleNext}
            disabled={!canProceed}
          >
            {isLastQuestion ? (isReviewMode ? 'Back to Results' : 'Finish Quiz') : 'Next →'}
          </button>
        </div>

        {/* Question indicators */}
        <div className="question-indicators">
          {questions.map((_, index) => {
            const isAnswered = userAnswers.some(a => a.questionId === questions[index].id);
            const isCurrent = index === currentQuestionIndex;
            const answer = userAnswers.find(a => a.questionId === questions[index].id);
            
            return (
              <div
                key={index}
                className={`indicator ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''} ${isReviewMode && answer ? (answer.isCorrect ? 'indicator-correct' : 'indicator-incorrect') : ''}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;

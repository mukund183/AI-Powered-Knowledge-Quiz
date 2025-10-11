import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPICS } from '../constants';
import { useQuiz } from '../context/QuizContext';
import { ThemeToggle } from './ThemeToggle';
import './TopicSelection.css';

const TopicSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setTopic } = useQuiz();

  const handleTopicSelect = (topicName: string) => {
    setTopic(topicName);
    navigate('/quiz-loading');
  };

  return (
    <div className="topic-selection-container">
      <ThemeToggle />
      <div className="topic-selection-content">
        <header className="topic-header">
          <h1>🧠 AI Knowledge Quiz</h1>
          <p>Choose a topic to test your knowledge</p>
        </header>

        <div className="topics-grid">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              className="topic-card"
              onClick={() => handleTopicSelect(topic.name)}
            >
              <div className="topic-icon">{topic.icon}</div>
              <h3 className="topic-name">{topic.name}</h3>
              <p className="topic-description">{topic.description}</p>
            </button>
          ))}
        </div>

        <footer className="topic-footer">
          <p>Powered by AI • 5 Questions per Quiz</p>
        </footer>
      </div>
    </div>
  );
};

export default TopicSelection;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import TopicSelection from './components/TopicSelection';
import QuizLoading from './components/QuizLoading';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <QuizProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<TopicSelection />} />
            <Route path="/quiz-loading" element={<QuizLoading />} />
            <Route path="/quiz" element={<QuizScreen />} />
            <Route path="/results" element={<ResultsScreen />} />
          </Routes>
        </div>
      </QuizProvider>
    </Router>
  );
};

export default App;

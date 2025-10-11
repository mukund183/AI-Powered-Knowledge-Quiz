import { Topic } from '../types';

export const TOPICS: Topic[] = [
  {
    id: 'wellness',
    name: 'Wellness & Health',
    description: 'Test your knowledge about health, nutrition, and wellness',
    icon: '🏥'
  },
  {
    id: 'tech',
    name: 'Tech Trends',
    description: 'Explore the latest in technology and innovation',
    icon: '💻'
  },
  {
    id: 'science',
    name: 'Science & Nature',
    description: 'Discover the wonders of science and natural world',
    icon: '🔬'
  },
  {
    id: 'history',
    name: 'History & Culture',
    description: 'Journey through historical events and cultural heritage',
    icon: '📚'
  }
];

export const QUIZ_CONFIG = {
  QUESTIONS_PER_QUIZ: 5,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
};

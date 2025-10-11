# AI-Assisted Knowledge Quiz

An interactive quiz application built with React, TypeScript, and Google's Gemini AI that demonstrates prompt engineering, state management, and seamless user experience with real-time AI integration.

---

## 1. Project Setup & Demo

### Web Setup

**Prerequisites:**
- Node.js (v16 or higher)
- No API key setup required (included in the project)

**Installation Steps:**

```bash
# Clone or navigate to the project directory
cd AI Knowledge Quiz

# Install dependencies
npm install

# Note: API key is already included in .env file for demo and easy evaluation purposes, although generally it is not a good practice to commit API keys to source control.

# Start development server
npm run dev

# Application will be available at http://localhost:5173
```

**Optional: Use Your Own API Key**

If you prefer to use your own Google Gemini API key:
1. Get a free API key at https://makersuite.google.com/app/apikey
2. Open the `.env` file in the project root
3. Replace the existing key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
4. Restart the dev server

**Production Build:**

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

**Demo:**
- Local Development: http://localhost:5173
- Note: App requires a valid Google Gemini API key to function (completely free, 60 requests/minute limit)

---

## 2. Problem Understanding

**Objective:**
Build an interactive quiz application that leverages AI to dynamically generate questions and provide an engaging, navigable user experience with personalized feedback.

**Core Requirements:**
- Topic selection interface with multiple categories
- AI-powered question generation (not predefined questions)
- Multi-question quiz with navigation capability
- Answer tracking and score calculation
- Personalized feedback based on performance

**User Flow:**
1. Select a topic from four options (Wellness, Tech Trends, Science, or History)
2. Loading screen displays while AI generates questions
3. Take a 5-question multiple-choice quiz with navigation between questions
4. Results screen shows score with AI-generated personalized feedback
5. Review mode to see correct/incorrect answers with visual indicators

**Key Assumptions Made:**
- **Fixed Quiz Length:** Each quiz contains exactly 5 questions to maintain consistent experience and manageable API usage
- **Multiple Choice Format:** All questions have 4 options (A-D) to standardize UI and scoring logic
- **Single Answer Selection:** Can select one answer per question but navigate back to change answers before finishing
- **No Backend Required:** Frontend-only implementation using React Context API for state management
- **Real-time Generation:** Questions are generated fresh for each quiz attempt, ensuring unique content
- **Free Tier API:** Google Gemini API's free tier (60 requests/minute) is sufficient for our needs
- **No Persistence:** Quiz state is not saved between sessions (future enhancement opportunity)

**Technical Decisions:**
- Chose Google Gemini 2.5 Flash for its powerful capabilities, free access, and generous rate limits
- Direct API integration without backend to keep architecture simple and deployment straightforward
- Context API over Redux for simpler state management suitable for the app's data flow complexity

---

## 3. AI Prompts & Iterations

### Question Generation Prompts

**Initial Attempt (v1):**
```
Generate 5 quiz questions about {topic} with multiple choice options.
```

**Issues Faced:**
- Inconsistent response formats (numbered lists, raw JSON, paragraphs)
- No reliable way to identify correct answers
- AI added unnecessary explanations instead of clean data
- Variable number of options per question
- Unpredictable JSON structure

**Refined Prompt (v2 - Current):**
```
Generate exactly 5 multiple choice questions about {topic}.

Return ONLY valid JSON in this exact format:
[
  {
    "id": "1",
    "question": "question text here",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0
  }
]

Requirements:
- Exactly 5 questions
- Exactly 4 options per question
- correctAnswer is an index (0-3) indicating which option is correct
- Questions should be clear, factually accurate, and moderate difficulty
- No trick questions
- Return ONLY the JSON array, no additional text
```

**Improvements Achieved:**
- 100% consistent JSON format
- Clear correct answer identification via index
- Predictable structure for easy parsing
- Moderate difficulty suitable for general knowledge
- Clean, parseable responses every time

**Key Learning:** Being explicit about JSON structure, setting hard requirements, and defining difficulty level resulted in reliable, usable outputs.

---

### Feedback Generation Prompts

**Initial Attempt (v1):**
```
Give feedback on this quiz score: {percentage}%
```

**Issues Faced:**
- Generic, impersonal feedback
- Inconsistent tone across different scores
- Variable response length (sometimes a sentence, sometimes paragraphs)
- No context about the quiz topic

**Refined Prompt (v2 - Current):**
```
Generate personalized quiz feedback for a user who scored {correctCount} out of {totalQuestions} 
on a {topic} quiz ({percentage}%).

Return ONLY valid JSON in this format:
{
  "message": "feedback text here"
}

Requirements:
- Be encouraging and positive
- Acknowledge their performance level
- For scores below 80%, provide 1-2 brief suggestions for improvement
- Keep response to 2-3 sentences maximum
- Use a friendly, conversational tone
- Do NOT include emojis
```

**Improvements Achieved:**
- Personalized feedback based on actual score and topic
- Consistent, friendly tone
- Appropriate length (2-3 sentences)
- Performance-adjusted messaging
- Reliable JSON format

**Key Learning:** Providing full context (score, topic, percentage) and defining personality requirements resulted in much more engaging, personalized feedback.

---

### Iteration Process & Lessons Learned

**What We Learned About Effective Prompt Engineering:**

1. **Be Explicit About Format:** AI won't guess the structure - specify exact JSON schema
2. **Define Data Structure Upfront:** Clear type definitions prevent parsing headaches later
3. **Set Clear Boundaries:** Specify limits (number of items, response length, format constraints)
4. **Never Trust Blindly:** Always validate AI responses and implement error handling
5. **Iterate Based on Real Results:** Rewrote prompts 5-6 times, testing edge cases each iteration
6. **Provide Context:** More context (topic, score breakdown) equals better, more relevant responses
7. **Temperature Settings:** Using temperature 0.7 balances creativity with consistency

**Debugging Strategy:**
- Logged all API requests/responses to console during development
- Implemented retry logic with exponential backoff (1s, 2s, 4s delays)
- Added JSON extraction fallback using regex when response included extra text
- Validated response structure before using in application

---



## 4. Architecture & Code Structure

### Project Structure

```
src/
├── components/          # React components for each screen
│   ├── TopicSelection   # Entry screen for topic selection
│   ├── QuizLoading      # Loading state during question generation
│   ├── QuizScreen       # Main quiz interface with navigation
│   └── ResultsScreen    # Score display and feedback
├── context/
│   └── QuizContext.tsx  # Global state management (Context API)
├── services/
│   └── aiService.ts     # Gemini API integration
├── types/
│   └── index.ts         # TypeScript interfaces
└── constants/
    └── index.ts         # Configuration (topics, API settings)
```

### Navigation & State Management

**Routes:**
- `/` - Topic Selection
- `/quiz-loading` - AI generates questions
- `/quiz` - Quiz interface
- `/results` - Results and review

**State (QuizContext):**
- Selected topic, questions, current index, user answers, results, loading/error states, review mode
- Actions: setTopic, setQuestions, answerQuestion, navigation, finishQuiz, resetQuiz
- Uses `useCallback` to prevent unnecessary re-renders
- Context API chosen for simplicity over Redux

**AI Service (aiService.ts):**
- `generateQuestions(topic)` - Calls Gemini API for quiz questions
- `generateFeedback(score, topic)` - Calls Gemini API for personalized feedback
- Retry logic with exponential backoff (1s, 2s, 4s)
- JSON validation and error handling

**Component Architecture:**
```
UI Components → QuizContext → aiService → Gemini API
```

**TypeScript Types:**
**TypeScript Types:**
```typescript
interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number  // Index 0-3
}

interface UserAnswer {
  questionId: string
  selectedOption: number
  isCorrect: boolean
}

interface QuizResult {
  topic: string
  score: number
  correctCount: number
  totalQuestions: number
  userAnswers: UserAnswer[]
  feedback?: string
}
```

---

## 5. Screenshots / Screen Recording

### 1. Topic Selection
Four topic cards with animations and hover effects

![Topic Selection](./screenshots/screen1.png)

### 2. Loading Screen
Multi-step progress indicator with skeleton loaders

![Loading Screen](./screenshots/screen2.png)

### 3. Quiz Screen
Progress bar, question counter, 4 options (A-D), navigation buttons, question indicators

![Light Mode](./screenshots/screen3.1.png)
![Dark Mode](./screenshots/screen3.2.png)

### 4. Results Screen
Animated score reveal, color-coded performance, AI feedback, answer summary

![Results Screen](./screenshots/screen4.1.png)

### 5. Review Mode
Shows correct (green) / incorrect (red) answers with visual badges

![Review Mode](./screenshots/screen4.2.png)


## 6. Known Issues / Improvements

**Limitations:**
- No state persistence (progress lost on refresh)
- Only 4 predefined topics
- No quiz history tracking
- Requires user to configure API key

**Bug Fixes Implemented:**
- Fixed multiple API calls on load using `useCallback` and `useRef`
- Updated to correct Gemini API endpoint (gemini-2.5-flash with v1beta)
- Removed mock questions to ensure only real AI content

---

## 7. Bonus Work

**Features Added:**
- Advanced animations (fadeIn effects, bounce, skeleton screens, hover transforms)
- Review mode with color-coded correct/incorrect answer highlighting
- Dark mode toggle with localStorage persistence (sun/moon icon, smooth transitions)
- Mobile-first responsive design (640px breakpoint, touch-friendly targets)
- Performance optimizations (useCallback, useRef guards, exponential backoff retry)
- Enhanced loading experience with multi-step progress indicators

**Tech Stack:** React 18 + TypeScript 5 + Vite 5 + React Router v6 + Context API + Google Gemini 2.5 Flash API

---





import {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  GenerateFeedbackRequest,
  GenerateFeedbackResponse,
  Question,
  APIError,
} from '../types';
import { QUIZ_CONFIG } from '../constants';

/**
 * AI Service for generating quiz questions and feedback using Google Gemini API
 * 
 * This service integrates with Google's Gemini API to generate dynamic quiz content.
 * Fallback to mock data is available if API fails.
 */

// Helper function for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('🔑 API Key configured:', GEMINI_API_KEY ? 'YES' : 'NO');

/**
 * Mock AI prompt for generating quiz questions
 * 
 * ACTUAL PROMPT TO USE WITH REAL AI:
 * ```
 * Generate exactly 5 multiple choice questions about ${topic}.
 * Return ONLY valid JSON in this exact format with no additional text:
 * {
 *   "questions": [
 *     {
 *       "id": "unique-id",
 *       "question": "Question text here?",
 *       "options": ["Option A", "Option B", "Option C", "Option D"],
 *       "correctAnswer": 0
 *     }
 *   ]
 * }
 * 
 * Requirements:
 * - Exactly 5 questions
 * - Each question must have exactly 4 options
 * - correctAnswer is the index (0-3) of the correct option
 * - Questions should be clear, concise, and factually accurate
 * - Difficulty should be moderate (suitable for general knowledge)
 * - Avoid ambiguous or trick questions
 * ```
 */
const generateQuestionsPrompt = (topic: string, count: number): string => {
  return `Generate exactly ${count} multiple choice questions about ${topic}.
Return ONLY valid JSON in this exact format with no additional text:
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

Requirements:
- Exactly ${count} questions
- Each question must have exactly 4 options
- correctAnswer is the index (0-3) of the correct option
- Questions should be clear, concise, and factually accurate
- Difficulty should be moderate (suitable for general knowledge)
- Avoid ambiguous or trick questions`;
};

/**
 * Mock AI prompt for generating personalized feedback
 * 
 * ACTUAL PROMPT TO USE WITH REAL AI:
 * ```
 * Generate personalized feedback for a quiz taker who scored ${correctAnswers} out of ${totalQuestions} 
 * on a ${topic} quiz (${score}%).
 * 
 * Return ONLY valid JSON in this exact format:
 * {
 *   "message": "Your personalized feedback message here"
 * }
 * 
 * Requirements:
 * - Be encouraging and positive
 * - Acknowledge their performance level
 * - Provide 1-2 specific suggestions for improvement if score < 80%
 * - Keep the message concise (2-3 sentences)
 * - Use a friendly, conversational tone
 * ```
 */
const generateFeedbackPrompt = (topic: string, score: number, correctAnswers: number, totalQuestions: number): string => {
  return `Generate personalized feedback for a quiz taker who scored ${correctAnswers} out of ${totalQuestions} 
on a ${topic} quiz (${score}%).

Return ONLY valid JSON in this exact format:
{
  "message": "Your personalized feedback message here"
}

Requirements:
- Be encouraging and positive
- Acknowledge their performance level
- Provide 1-2 specific suggestions for improvement if score < 80%
- Keep the message concise (2-3 sentences)
- Use a friendly, conversational tone`;
};

/**
 * Call Google Gemini API
 */
const callGeminiAPI = async (prompt: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  console.log('📡 Making API call to Gemini...');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Received response from Gemini API');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error);
    throw error;
  }
};

/**
 * Extract JSON from AI response (handles cases where AI adds extra text)
 */
const extractJSON = (text: string): any => {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }
  
  return JSON.parse(jsonMatch[0]);
};

/**
 * Validate question format
 */
const validateQuestion = (question: any): question is Question => {
  return (
    typeof question.id === 'string' &&
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((opt: any) => typeof opt === 'string') &&
    typeof question.correctAnswer === 'number' &&
    question.correctAnswer >= 0 &&
    question.correctAnswer <= 3
  );
};

/**
 * Generate quiz questions using AI
 * 
 * @param request - Topic and count of questions to generate
 * @returns Promise with generated questions
 * @throws APIError if generation fails after retries
 */
export const generateQuestions = async (
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> => {
  const { topic, count } = request;
  
  const prompt = generateQuestionsPrompt(topic, count);
  console.log('🤖 Generating questions with AI for topic:', topic);
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < QUIZ_CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt + 1}: Calling Gemini API...`);
      
      const aiResponse = await callGeminiAPI(prompt);
      const result = extractJSON(aiResponse);
      
      if (!result.questions || !Array.isArray(result.questions)) {
        throw new Error('Invalid response format from AI');
      }
      
      const questions = result.questions;
      
      // Validate all questions
      if (!questions.every(validateQuestion)) {
        throw new Error('Invalid question format received');
      }
      
      if (questions.length !== count) {
        console.warn(`⚠️ Expected ${count} questions but got ${questions.length}`);
      }
      
      console.log(`✅ Successfully generated ${questions.length} questions from Gemini API`);
      
      return { questions };
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < QUIZ_CONFIG.MAX_RETRIES - 1) {
        const retryDelay = QUIZ_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      }
    }
  }
  
  // All retries failed
  const apiError: APIError = {
    message: `Failed to generate questions after ${QUIZ_CONFIG.MAX_RETRIES} attempts: ${lastError?.message}`,
    code: 'GENERATION_FAILED'
  };
  throw apiError;
};

/**
 * Generate personalized feedback using AI
 * 
 * @param request - Quiz result details
 * @returns Promise with personalized feedback message
 */
export const generateFeedback = async (
  request: GenerateFeedbackRequest
): Promise<GenerateFeedbackResponse> => {
  const { topic, score, correctAnswers, totalQuestions } = request;
  
  const prompt = generateFeedbackPrompt(topic, score, correctAnswers, totalQuestions);
  console.log('🤖 Generating feedback with AI...');
  
  try {
    console.log('🔄 Calling Gemini API for feedback...');
    
    const aiResponse = await callGeminiAPI(prompt);
    const result = extractJSON(aiResponse);
    
    if (!result.message || typeof result.message !== 'string') {
      throw new Error('Invalid feedback format from AI');
    }
    
    const message = result.message;
    console.log('✅ Feedback generated from Gemini API');
    
    return { message };
    
  } catch (error) {
    console.error('❌ Failed to generate feedback:', error);
    throw error;
  }
};

/**
 * Retry utility function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = QUIZ_CONFIG.MAX_RETRIES,
  baseDelay: number = QUIZ_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, attempt);
        await delay(delayTime);
      }
    }
  }
  
  throw lastError!;
};

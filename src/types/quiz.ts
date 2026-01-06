export type QuestionType = 'multiple_choice' | 'true_false' | 'open_text'

export interface Quiz {
  id: string
  title: string
  created_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  type: QuestionType
  text: string
  options: string[] | null
  correct_answer: string
  time_limit: number
  points: number
  order: number
}

export interface GameSession {
  id: string
  quiz_id: string
  code: string
  status: 'lobby' | 'in_progress' | 'finished'
  current_question: number
  created_at: string
  quiz?: Quiz
}

export interface Player {
  id: string
  session_id: string
  nickname: string
  score: number
}

export interface Answer {
  id: string
  player_id: string
  question_id: string
  answer: string
  time_ms: number
  is_correct: boolean
  points_earned: number
}

// Realtime event payloads
export interface PlayerJoinedPayload {
  player: Player
}

export interface QuestionPayload {
  question: Omit<Question, 'correct_answer'>
  questionNumber: number
  totalQuestions: number
  startTime: number
}

export interface AnswerSubmittedPayload {
  playerId: string
  nickname: string
  questionId: string
}

export interface QuestionResultsPayload {
  correctAnswer: string
  scores: { playerId: string; nickname: string; score: number; pointsEarned: number }[]
}

export interface GameFinishedPayload {
  finalScores: { playerId: string; nickname: string; score: number; rank: number }[]
}

// Form types for creating/editing
export interface QuestionFormData {
  type: QuestionType
  text: string
  options: string[]
  correct_answer: string
  time_limit: number
  points: number
}

export interface QuizFormData {
  title: string
  questions: QuestionFormData[]
}


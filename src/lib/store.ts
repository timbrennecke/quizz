import { create } from 'zustand'
import { Player, Question, GameSession } from '@/types/quiz'

interface GameState {
  // Session info
  session: GameSession | null
  players: Player[]
  
  // Current game state
  currentQuestion: (Omit<Question, 'correct_answer'> & { correct_answer?: string }) | null
  questionNumber: number
  totalQuestions: number
  
  // Timer
  timeRemaining: number
  questionStartTime: number | null
  
  // Player-specific
  hasAnswered: boolean
  selectedAnswer: string | null
  lastPointsEarned: number
  
  // Results
  showingResults: boolean
  correctAnswer: string | null
  
  // Actions
  setSession: (session: GameSession | null) => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayerScore: (playerId: string, score: number) => void
  
  setCurrentQuestion: (question: Omit<Question, 'correct_answer'> | null, questionNumber: number, totalQuestions: number) => void
  setTimeRemaining: (time: number) => void
  setQuestionStartTime: (time: number | null) => void
  
  submitAnswer: (answer: string) => void
  setLastPointsEarned: (points: number) => void
  
  showResults: (correctAnswer: string) => void
  hideResults: () => void
  
  resetGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  session: null,
  players: [],
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  timeRemaining: 0,
  questionStartTime: null,
  hasAnswered: false,
  selectedAnswer: null,
  lastPointsEarned: 0,
  showingResults: false,
  correctAnswer: null,
  
  // Actions
  setSession: (session) => set({ session }),
  
  setPlayers: (players) => set({ players }),
  
  addPlayer: (player) => set((state) => ({
    players: [...state.players, player]
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),
  
  updatePlayerScore: (playerId, score) => set((state) => ({
    players: state.players.map(p => 
      p.id === playerId ? { ...p, score } : p
    )
  })),
  
  setCurrentQuestion: (question, questionNumber, totalQuestions) => set({
    currentQuestion: question,
    questionNumber,
    totalQuestions,
    hasAnswered: false,
    selectedAnswer: null,
    showingResults: false,
    correctAnswer: null,
  }),
  
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  setQuestionStartTime: (time) => set({ questionStartTime: time }),
  
  submitAnswer: (answer) => set({
    hasAnswered: true,
    selectedAnswer: answer,
  }),
  
  setLastPointsEarned: (points) => set({ lastPointsEarned: points }),
  
  showResults: (correctAnswer) => set({
    showingResults: true,
    correctAnswer,
  }),
  
  hideResults: () => set({
    showingResults: false,
    correctAnswer: null,
  }),
  
  resetGame: () => set({
    session: null,
    players: [],
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 0,
    timeRemaining: 0,
    questionStartTime: null,
    hasAnswered: false,
    selectedAnswer: null,
    lastPointsEarned: 0,
    showingResults: false,
    correctAnswer: null,
  }),
}))


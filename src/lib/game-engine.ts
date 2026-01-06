import { Question } from '@/types/quiz'

// Calculate points based on time remaining
export function calculatePoints(
  timeLimit: number,
  timeTaken: number,
  basePoints: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0
  
  // Time bonus: faster answers get more points
  // Minimum 50% of base points, maximum 100%
  const timeRatio = Math.max(0, (timeLimit * 1000 - timeTaken) / (timeLimit * 1000))
  const timeBonus = 0.5 + (timeRatio * 0.5)
  
  return Math.round(basePoints * timeBonus)
}

// Check if answer is correct (with fuzzy matching for open text)
export function checkAnswer(
  question: Question,
  submittedAnswer: string
): boolean {
  const correctAnswer = question.correct_answer.toLowerCase().trim()
  const submitted = submittedAnswer.toLowerCase().trim()
  
  if (question.type === 'open_text') {
    // Fuzzy matching using Levenshtein distance
    const distance = levenshteinDistance(correctAnswer, submitted)
    const maxLength = Math.max(correctAnswer.length, submitted.length)
    const similarity = 1 - distance / maxLength
    
    // Accept if 80% similar or more
    return similarity >= 0.8
  }
  
  // Exact match for multiple choice and true/false
  return correctAnswer === submitted
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

// Sort players by score for leaderboard
export function sortByScore(
  players: { nickname: string; score: number }[]
): { nickname: string; score: number; rank: number }[] {
  return players
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }))
}


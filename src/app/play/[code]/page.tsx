'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Player, Question } from '@/types/quiz'
import { createQuizChannel, QuizChannel } from '@/lib/realtime'
import JoinScreen from '@/components/JoinScreen'
import QuestionDisplay from '@/components/QuestionDisplay'
import Scoreboard from '@/components/Scoreboard'
import Timer from '@/components/Timer'

type GamePhase = 'join' | 'lobby' | 'question' | 'results' | 'finished'

export default function PlayerPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const sessionCode = code.toUpperCase()

  const [phase, setPhase] = useState<GamePhase>('join')
  const [player, setPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Omit<Question, 'correct_answer'> | null>(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const [lastPointsEarned, setLastPointsEarned] = useState(0)
  const [channel, setChannel] = useState<QuizChannel | null>(null)
  const [error, setError] = useState('')
  const [finalScores, setFinalScores] = useState<{ nickname: string; score: number; rank: number }[]>([])

  // Join the game
  const handleJoin = useCallback(async (nickname: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to join')
      }

      const playerData = await res.json()
      setPlayer(playerData)

      // Setup realtime channel
      const quizChannel = createQuizChannel(sessionCode)

      quizChannel
        .onPlayerJoined(({ player: newPlayer }) => {
          setPlayers((prev) => [...prev.filter(p => p.id !== newPlayer.id), newPlayer])
        })
        .onPlayerLeft(({ playerId }) => {
          setPlayers((prev) => prev.filter((p) => p.id !== playerId))
        })
        .onGameStarted(() => {
          setPhase('question')
        })
        .onNewQuestion(({ question, questionNumber: qNum, totalQuestions: total, startTime }) => {
          setCurrentQuestion(question)
          setQuestionNumber(qNum)
          setTotalQuestions(total)
          setQuestionStartTime(startTime)
          setSelectedAnswer(null)
          setCorrectAnswer(null)
          setPhase('question')
        })
        .onQuestionResults(({ correctAnswer: correct, scores }) => {
          setCorrectAnswer(correct)
          
          // Find this player's points
          const playerScore = scores.find(s => s.playerId === playerData.id)
          if (playerScore) {
            setLastPointsEarned(playerScore.pointsEarned)
            setPlayer(prev => prev ? { ...prev, score: playerScore.score } : null)
          }
          
          // Update all players
          setPlayers(scores.map(s => ({
            id: s.playerId,
            nickname: s.nickname,
            score: s.score,
            session_id: '',
          })))
          
          setPhase('results')
        })
        .onGameFinished(({ finalScores: scores }) => {
          setFinalScores(scores)
          setPhase('finished')
        })

      await quizChannel.subscribe()
      setChannel(quizChannel)

      // Broadcast that we joined
      await quizChannel.broadcastPlayerJoined({ player: playerData })

      setPhase('lobby')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join')
      throw err
    }
  }, [sessionCode])

  // Submit answer
  const handleAnswer = useCallback(async (answer: string) => {
    if (!player || !currentQuestion || selectedAnswer) return

    setSelectedAnswer(answer)
    const timeMs = Date.now() - questionStartTime

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          questionId: currentQuestion.id,
          answer,
          timeMs,
        }),
      })

      const data = await res.json()

      // Broadcast that we answered
      if (channel) {
        await channel.broadcastAnswerSubmitted({
          playerId: player.id,
          nickname: player.nickname,
          questionId: currentQuestion.id,
        })
      }

      if (data.isCorrect) {
        setLastPointsEarned(data.pointsEarned)
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }
  }, [player, currentQuestion, selectedAnswer, questionStartTime, sessionCode, channel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channel?.unsubscribe()
    }
  }, [channel])

  // Join screen
  if (phase === 'join') {
    return <JoinScreen sessionCode={sessionCode} onJoin={handleJoin} error={error} />
  }

  // Lobby - waiting for game to start
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md w-full animate-bounce-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-4xl mb-6">
            {player?.nickname.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome, {player?.nickname}!
          </h2>
          <p className="text-white/50 mb-6">Waiting for host to start the game...</p>
          
          <div className="flex items-center justify-center gap-2">
            <div className="spinner" />
            <span className="text-white/50">Get ready!</span>
          </div>
        </div>
      </div>
    )
  }

  // Question phase
  if (phase === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
              {player?.nickname.charAt(0).toUpperCase()}
            </div>
            <span className="text-white/70">{player?.score.toLocaleString()} pts</span>
          </div>
          <Timer
            duration={currentQuestion.time_limit}
            size="sm"
          />
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center">
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            selectedAnswer={selectedAnswer}
            onAnswer={handleAnswer}
            disabled={!!selectedAnswer}
          />
        </div>

        {/* Answered feedback */}
        {selectedAnswer && (
          <div className="text-center py-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/70">Answer submitted! Waiting for results...</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Results phase
  if (phase === 'results') {
    const isCorrect = selectedAnswer === correctAnswer

    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center">
        <div className="text-center mb-8 animate-bounce-in">
          <div className={`text-6xl mb-4 ${isCorrect ? 'animate-score-pop' : ''}`}>
            {isCorrect ? '🎉' : '😔'}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isCorrect ? 'Correct!' : 'Wrong!'}
          </h2>
          {isCorrect && lastPointsEarned > 0 && (
            <p className="text-2xl text-accent-400 font-bold animate-score-pop">
              +{lastPointsEarned} points
            </p>
          )}
          {!isCorrect && (
            <p className="text-white/50">
              Correct answer: <span className="text-green-400">{correctAnswer}</span>
            </p>
          )}
        </div>

        <div className="w-full max-w-md glass-card p-6">
          <p className="text-center text-white/50 mb-4">Your score</p>
          <p className="text-4xl font-bold text-center text-white mb-6">
            {player?.score.toLocaleString()} pts
          </p>
          <Scoreboard players={players} highlightPlayerId={player?.id} compact showTop={5} />
        </div>

        <p className="mt-6 text-white/40">Waiting for next question...</p>
      </div>
    )
  }

  // Game finished
  if (phase === 'finished') {
    const playerRank = finalScores.find(s => s.nickname === player?.nickname)?.rank || 0

    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center">
        <div className="text-center mb-8 animate-bounce-in">
          <div className="text-6xl mb-4">
            {playerRank === 1 ? '🏆' : playerRank <= 3 ? '🎉' : '👏'}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
          <p className="text-xl text-white/70">
            You finished #{playerRank} with{' '}
            <span className="text-accent-400 font-bold">{player?.score.toLocaleString()}</span> points!
          </p>
        </div>

        <div className="w-full max-w-md glass-card p-6">
          <h3 className="text-xl font-semibold text-center mb-4">Final Standings</h3>
          <div className="space-y-3">
            {finalScores.slice(0, 10).map((score, index) => (
              <div
                key={score.nickname}
                className={`
                  flex items-center gap-4 p-3 rounded-lg
                  ${score.nickname === player?.nickname ? 'bg-primary-500/30 border border-primary-500' : 'bg-white/5'}
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-xl font-bold w-8 text-center">
                  {score.rank <= 3 ? ['🥇', '🥈', '🥉'][score.rank - 1] : `#${score.rank}`}
                </span>
                <span className="flex-1 font-medium">{score.nickname}</span>
                <span className="font-bold text-accent-400">{score.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="mt-8 btn-outline"
        >
          Play Again
        </button>
      </div>
    )
  }

  return null
}


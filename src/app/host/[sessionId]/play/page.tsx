'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GameSession, Player, Question } from '@/types/quiz'
import { createQuizChannel, QuizChannel } from '@/lib/realtime'
import Scoreboard from '@/components/Scoreboard'
import Timer from '@/components/Timer'

type GamePhase = 'lobby' | 'question' | 'results' | 'finished'

export default function HostPlayPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionCode = searchParams.get('code') || ''

  const [session, setSession] = useState<GameSession | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [answeredCount, setAnsweredCount] = useState(0)
  const [channel, setChannel] = useState<QuizChannel | null>(null)
  const [loading, setLoading] = useState(true)

  const currentQuestion = questions[currentQuestionIndex]

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionCode}`)
        if (!res.ok) {
          router.push('/host')
          return
        }
        const data = await res.json()
        setSession(data)
        setPlayers(data.players || [])
        setQuestions(data.quiz?.questions || [])
      } catch (error) {
        console.error('Failed to fetch session:', error)
        router.push('/host')
      } finally {
        setLoading(false)
      }
    }

    if (sessionCode) {
      fetchSession()
    }
  }, [sessionCode, router])

  // Setup realtime channel
  useEffect(() => {
    if (!sessionCode) return

    const quizChannel = createQuizChannel(sessionCode)
    
    quizChannel
      .onPlayerJoined(({ player }) => {
        setPlayers((prev) => [...prev.filter(p => p.id !== player.id), player])
      })
      .onPlayerLeft(({ playerId }) => {
        setPlayers((prev) => prev.filter((p) => p.id !== playerId))
      })
      .onAnswerSubmitted(() => {
        setAnsweredCount((prev) => prev + 1)
      })

    quizChannel.subscribe().then(() => {
      setChannel(quizChannel)
    })

    return () => {
      quizChannel.unsubscribe()
    }
  }, [sessionCode])

  // Start the game
  const startGame = useCallback(async () => {
    if (!channel || players.length === 0) return

    await fetch(`/api/sessions/${sessionCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    })

    await channel.broadcastGameStarted()
    setPhase('question')
    setCurrentQuestionIndex(0)
    setAnsweredCount(0)

    // Send first question
    if (questions[0]) {
      const { correct_answer, ...questionWithoutAnswer } = questions[0]
      await channel.broadcastNewQuestion({
        question: questionWithoutAnswer,
        questionNumber: 1,
        totalQuestions: questions.length,
        startTime: Date.now(),
      })
    }
  }, [channel, players.length, questions, sessionCode])

  // Show results for current question
  const showResults = useCallback(async () => {
    if (!channel || !currentQuestion) return

    // Fetch updated player scores
    const res = await fetch(`/api/sessions/${sessionCode}`)
    const data = await res.json()
    setPlayers(data.players || [])

    const scores = (data.players || []).map((p: Player) => ({
      playerId: p.id,
      nickname: p.nickname,
      score: p.score,
      pointsEarned: 0, // Would need to calculate from answers
    }))

    await channel.broadcastQuestionResults({
      correctAnswer: currentQuestion.correct_answer,
      scores,
    })

    setPhase('results')
  }, [channel, currentQuestion, sessionCode])

  // Move to next question
  const nextQuestion = useCallback(async () => {
    if (!channel) return

    const nextIndex = currentQuestionIndex + 1

    if (nextIndex >= questions.length) {
      // Game finished
      const finalScores = players
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({
          playerId: p.id,
          nickname: p.nickname,
          score: p.score,
          rank: i + 1,
        }))

      await channel.broadcastGameFinished({ finalScores })
      
      await fetch(`/api/sessions/${sessionCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finished' }),
      })

      setPhase('finished')
    } else {
      // Next question
      setCurrentQuestionIndex(nextIndex)
      setAnsweredCount(0)
      setPhase('question')

      const { correct_answer, ...questionWithoutAnswer } = questions[nextIndex]
      await channel.broadcastNewQuestion({
        question: questionWithoutAnswer,
        questionNumber: nextIndex + 1,
        totalQuestions: questions.length,
        startTime: Date.now(),
      })
    }
  }, [channel, currentQuestionIndex, questions, players, sessionCode])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  // Lobby phase
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Join code display */}
          <div className="mb-8">
            <p className="text-white/50 mb-2">Join at quizmaster.app with code</p>
            <div className="flex justify-center gap-3">
              {sessionCode.split('').map((char, i) => (
                <span
                  key={i}
                  className="w-16 h-20 bg-white/10 rounded-xl flex items-center justify-center text-4xl font-mono font-bold text-accent-400"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Players list */}
          <div className="glass-card p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Players ({players.length})
            </h2>
            {players.length === 0 ? (
              <p className="text-white/50">Waiting for players to join...</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500/30 to-accent-500/30 rounded-full animate-bounce-in"
                  >
                    {player.nickname}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={players.length === 0}
            className="btn-primary text-xl px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  // Question phase
  if (phase === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with timer and progress */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-white/50">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <Timer
              duration={currentQuestion.time_limit}
              onComplete={showResults}
              size="lg"
            />
            <div className="text-white/50">
              {answeredCount} / {players.length} answered
            </div>
          </div>

          {/* Question */}
          <div className="glass-card p-8 mb-8">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              {currentQuestion.text}
            </h2>

            {/* Options preview */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl text-lg font-medium ${
                      ['bg-red-500/30', 'bg-blue-500/30', 'bg-yellow-500/30', 'bg-green-500/30'][index]
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual show results button */}
          <div className="text-center">
            <button onClick={showResults} className="btn-outline">
              End Question Early
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Results phase
  if (phase === 'results') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Results</h2>
            <p className="text-white/50">
              Correct answer: <span className="text-green-400 font-semibold">{currentQuestion?.correct_answer}</span>
            </p>
          </div>

          <div className="glass-card p-8 mb-8">
            <Scoreboard players={players} showTop={10} />
          </div>

          <div className="text-center">
            <button onClick={nextQuestion} className="btn-primary text-xl px-12 py-4">
              {currentQuestionIndex + 1 >= questions.length ? 'Show Final Results' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Finished phase
  if (phase === 'finished') {
    const winner = players.sort((a, b) => b.score - a.score)[0]

    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-bounce-in">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
            {winner && (
              <p className="text-2xl text-accent-400">
                Winner: <span className="font-bold">{winner.nickname}</span> with {winner.score.toLocaleString()} points!
              </p>
            )}
          </div>

          <div className="glass-card p-8 mb-8">
            <Scoreboard players={players} showTop={players.length} />
          </div>

          <button onClick={() => router.push('/host')} className="btn-outline">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return null
}


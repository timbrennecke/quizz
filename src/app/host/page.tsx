'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Quiz, QuizFormData } from '@/types/quiz'
import QuizEditor from '@/components/QuizEditor'

export default function HostPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [creatingSession, setCreatingSession] = useState<string | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes')
      const data = await res.json()
      setQuizzes(data)
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = async (data: QuizFormData) => {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to create quiz')

    setShowEditor(false)
    fetchQuizzes()
  }

  const handleEditQuiz = async (data: QuizFormData) => {
    if (!editingQuiz) return

    const res = await fetch(`/api/quizzes/${editingQuiz.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to update quiz')

    setEditingQuiz(null)
    fetchQuizzes()
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return

    await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' })
    fetchQuizzes()
  }

  const handleStartSession = async (quizId: string) => {
    setCreatingSession(quizId)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      })

      if (!res.ok) throw new Error('Failed to create session')

      const session = await res.json()
      router.push(`/host/${session.id}/play?code=${session.code}`)
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start game session')
    } finally {
      setCreatingSession(null)
    }
  }

  if (showEditor) {
    return (
      <QuizEditor
        onSave={handleCreateQuiz}
        onCancel={() => setShowEditor(false)}
      />
    )
  }

  if (editingQuiz) {
    return (
      <QuizEditor
        initialData={{
          title: editingQuiz.title,
          questions: editingQuiz.questions?.map((q) => ({
            type: q.type,
            text: q.text,
            options: q.options || ['', '', '', ''],
            correct_answer: q.correct_answer,
            time_limit: q.time_limit,
            points: q.points,
          })) || [],
        }}
        onSave={handleEditQuiz}
        onCancel={() => setEditingQuiz(null)}
      />
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-white/50 hover:text-white text-sm mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white">My Quizzes</h1>
          </div>
          <button onClick={() => setShowEditor(true)} className="btn-primary">
            Create New Quiz
          </button>
        </div>

        {/* Quiz list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-white mb-2">No quizzes yet</h2>
            <p className="text-white/50 mb-6">Create your first quiz to get started</p>
            <button onClick={() => setShowEditor(true)} className="btn-primary">
              Create Your First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">{quiz.title}</h3>
                  <p className="text-white/50 text-sm">
                    {quiz.questions?.length || 0} questions •{' '}
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartSession(quiz.id)}
                    disabled={creatingSession === quiz.id}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    {creatingSession === quiz.id ? (
                      <span className="flex items-center gap-2">
                        <span className="spinner w-4 h-4" />
                        Starting...
                      </span>
                    ) : (
                      '▶ Start'
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/quizzes/${quiz.id}`)
                      const fullQuiz = await res.json()
                      setEditingQuiz(fullQuiz)
                    }}
                    className="btn-outline px-4 py-2 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


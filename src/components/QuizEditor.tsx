'use client'

import { useState } from 'react'
import { QuestionFormData, QuestionType, QuizFormData } from '@/types/quiz'

interface QuizEditorProps {
  initialData?: QuizFormData
  onSave: (data: QuizFormData) => Promise<void>
  onCancel?: () => void
}

const defaultQuestion: QuestionFormData = {
  type: 'multiple_choice',
  text: '',
  options: ['', '', '', ''],
  correct_answer: '',
  time_limit: 30,
  points: 100,
}

export default function QuizEditor({ initialData, onSave, onCancel }: QuizEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [questions, setQuestions] = useState<QuestionFormData[]>(
    initialData?.questions || [{ ...defaultQuestion }]
  )
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const activeQuestion = questions[activeQuestionIndex]

  const updateQuestion = (updates: Partial<QuestionFormData>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === activeQuestionIndex ? { ...q, ...updates } : q))
    )
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...defaultQuestion }])
    setActiveQuestionIndex(questions.length)
  }

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return
    setQuestions((prev) => prev.filter((_, i) => i !== index))
    if (activeQuestionIndex >= index && activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1)
    }
  }

  const duplicateQuestion = (index: number) => {
    const questionToCopy = questions[index]
    setQuestions((prev) => [
      ...prev.slice(0, index + 1),
      { ...questionToCopy },
      ...prev.slice(index + 1),
    ])
    setActiveQuestionIndex(index + 1)
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newQuestions = [...questions]
    const draggedItem = newQuestions[draggedIndex]
    newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(index, 0, draggedItem)
    
    setQuestions(newQuestions)
    setDraggedIndex(index)
    
    if (activeQuestionIndex === draggedIndex) {
      setActiveQuestionIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = async () => {
    setError('')

    if (!title.trim()) {
      setError('Quiz title is required')
      return
    }

    const emptyQuestions = questions.filter((q) => !q.text.trim())
    if (emptyQuestions.length > 0) {
      setError('All questions must have text')
      return
    }

    const noCorrectAnswer = questions.filter((q) => !q.correct_answer)
    if (noCorrectAnswer.length > 0) {
      setError('All questions must have a correct answer')
      return
    }

    setIsSaving(true)
    try {
      await onSave({ title: title.trim(), questions })
    } catch {
      setError('Failed to save quiz')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-white/70 mb-2">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title..."
              className="input-field text-2xl font-bold"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            {onCancel && (
              <button onClick={onCancel} className="btn-outline">
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question list sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white/80">Questions</h3>
                <button
                  onClick={addQuestion}
                  className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-400 transition-colors"
                >
                  +
                </button>
              </div>

              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveQuestionIndex(index)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${index === activeQuestionIndex 
                        ? 'bg-primary-500/30 border border-primary-500' 
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'}
                      ${draggedIndex === index ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 cursor-grab">⋮⋮</span>
                      <span className="text-sm font-medium">Q{index + 1}</span>
                      <span className="text-xs text-white/50 truncate flex-1">
                        {q.text || 'Untitled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Question editor */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              {/* Question type selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Question Type
                </label>
                <div className="flex gap-2">
                  {[
                    { type: 'multiple_choice', label: 'Multiple Choice' },
                    { type: 'true_false', label: 'True/False' },
                    { type: 'open_text', label: 'Open Text' },
                  ].map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => updateQuestion({ type: type as QuestionType })}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${activeQuestion.type === type
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'}
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question text */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Question
                </label>
                <textarea
                  value={activeQuestion.text}
                  onChange={(e) => updateQuestion({ text: e.target.value })}
                  placeholder="Enter your question..."
                  className="input-field min-h-[100px] resize-none"
                  rows={3}
                />
              </div>

              {/* Answer options */}
              {activeQuestion.type === 'multiple_choice' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Answer Options (click to mark correct)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeQuestion.options.map((option, index) => (
                      <div key={index} className="relative">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...activeQuestion.options]
                            newOptions[index] = e.target.value
                            updateQuestion({ options: newOptions })
                          }}
                          placeholder={`Option ${index + 1}`}
                          className={`
                            input-field pr-12
                            ${activeQuestion.correct_answer === option && option
                              ? 'border-green-500 bg-green-500/20'
                              : ''}
                          `}
                        />
                        <button
                          onClick={() => option && updateQuestion({ correct_answer: option })}
                          className={`
                            absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg
                            flex items-center justify-center transition-colors
                            ${activeQuestion.correct_answer === option && option
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white/50 hover:bg-white/20'}
                          `}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* True/False selector */}
              {activeQuestion.type === 'true_false' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Correct Answer
                  </label>
                  <div className="flex gap-3">
                    {['true', 'false'].map((answer) => (
                      <button
                        key={answer}
                        onClick={() => updateQuestion({ correct_answer: answer })}
                        className={`
                          px-8 py-3 rounded-lg font-semibold transition-colors
                          ${activeQuestion.correct_answer === answer
                            ? 'bg-green-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'}
                        `}
                      >
                        {answer === 'true' ? 'True' : 'False'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Open text correct answer */}
              {activeQuestion.type === 'open_text' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Correct Answer (fuzzy matching will be applied)
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.correct_answer}
                    onChange={(e) => updateQuestion({ correct_answer: e.target.value })}
                    placeholder="Enter the correct answer..."
                    className="input-field"
                  />
                </div>
              )}

              {/* Time and points */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    value={activeQuestion.time_limit}
                    onChange={(e) => updateQuestion({ time_limit: parseInt(e.target.value) || 30 })}
                    min={5}
                    max={120}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={activeQuestion.points}
                    onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 100 })}
                    min={10}
                    max={1000}
                    step={10}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Question actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => duplicateQuestion(activeQuestionIndex)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => removeQuestion(activeQuestionIndex)}
                  disabled={questions.length === 1}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


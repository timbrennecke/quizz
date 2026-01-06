'use client'

import { Question } from '@/types/quiz'

interface QuestionDisplayProps {
  question: Omit<Question, 'correct_answer'> & { correct_answer?: string }
  questionNumber: number
  totalQuestions: number
  selectedAnswer?: string | null
  correctAnswer?: string | null
  showResults?: boolean
  onAnswer?: (answer: string) => void
  disabled?: boolean
}

const optionColors = [
  { bg: 'bg-red-500/20 hover:bg-red-500/40', text: 'text-red-300', selected: 'bg-red-500', icon: '▲' },
  { bg: 'bg-blue-500/20 hover:bg-blue-500/40', text: 'text-blue-300', selected: 'bg-blue-500', icon: '◆' },
  { bg: 'bg-yellow-500/20 hover:bg-yellow-500/40', text: 'text-yellow-300', selected: 'bg-yellow-500', icon: '●' },
  { bg: 'bg-green-500/20 hover:bg-green-500/40', text: 'text-green-300', selected: 'bg-green-500', icon: '■' },
]

export default function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  correctAnswer,
  showResults = false,
  onAnswer,
  disabled = false,
}: QuestionDisplayProps) {
  const handleOptionClick = (option: string) => {
    if (disabled || selectedAnswer) return
    onAnswer?.(option)
  }

  const getOptionClass = (option: string, index: number) => {
    const color = optionColors[index % optionColors.length]
    
    if (showResults) {
      if (option === correctAnswer) {
        return 'bg-green-500 text-white border-green-300 scale-105'
      }
      if (option === selectedAnswer && option !== correctAnswer) {
        return 'bg-red-500/50 text-red-200 border-red-300 opacity-60'
      }
      return 'opacity-40'
    }
    
    if (option === selectedAnswer) {
      return `${color.selected} text-white border-white scale-105`
    }
    
    return `${color.bg} ${color.text}`
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Question header */}
      <div className="text-center mb-8">
        <span className="text-white/50 text-sm font-medium">
          Question {questionNumber} of {totalQuestions}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-2 leading-tight">
          {question.text}
        </h2>
      </div>

      {/* Answer options */}
      {question.type === 'multiple_choice' && question.options && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              disabled={disabled || !!selectedAnswer}
              className={`
                w-full p-5 rounded-xl font-semibold text-lg
                transition-all duration-200 border-2 border-transparent
                flex items-center gap-4
                ${getOptionClass(option, index)}
                ${disabled || selectedAnswer ? 'cursor-default' : 'cursor-pointer active:scale-95'}
              `}
            >
              <span className="text-2xl opacity-60">
                {optionColors[index % optionColors.length].icon}
              </span>
              <span className="flex-1 text-left">{option}</span>
            </button>
          ))}
        </div>
      )}

      {/* True/False options */}
      {question.type === 'true_false' && (
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          {['True', 'False'].map((option, index) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option.toLowerCase())}
              disabled={disabled || !!selectedAnswer}
              className={`
                w-full p-6 rounded-xl font-bold text-xl
                transition-all duration-200 border-2 border-transparent
                ${getOptionClass(option.toLowerCase(), index === 0 ? 2 : 0)}
                ${disabled || selectedAnswer ? 'cursor-default' : 'cursor-pointer active:scale-95'}
              `}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Open text input */}
      {question.type === 'open_text' && (
        <div className="max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Type your answer..."
            className="input-field text-center text-xl"
            disabled={disabled || !!selectedAnswer}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleOptionClick(e.currentTarget.value.trim())
              }
            }}
          />
          {showResults && correctAnswer && (
            <p className="text-center mt-4 text-green-400">
              Correct answer: <strong>{correctAnswer}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  )
}


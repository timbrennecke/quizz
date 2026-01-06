'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  duration: number // in seconds
  onComplete?: () => void
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
}

export default function Timer({ 
  duration, 
  onComplete, 
  size = 'md',
  showNumber = true 
}: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    setTimeRemaining(duration)
    setIsRunning(true)
  }, [duration])

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) {
      if (timeRemaining <= 0 && onComplete) {
        onComplete()
      }
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, onComplete])

  const percentage = (timeRemaining / duration) * 100
  const circumference = 2 * Math.PI * 45

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-3xl',
    lg: 'text-4xl',
  }

  // Color based on time remaining
  const getColor = () => {
    if (percentage > 50) return '#22d3ee' // cyan
    if (percentage > 25) return '#fbbf24' // yellow
    return '#ef4444' // red
  }

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percentage / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      {showNumber && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className={`font-bold ${textSizes[size]} ${
              percentage <= 25 ? 'text-red-400 animate-pulse' : 'text-white'
            }`}
          >
            {timeRemaining}
          </span>
        </div>
      )}
    </div>
  )
}


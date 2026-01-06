'use client'

import { useState } from 'react'

interface JoinScreenProps {
  sessionCode: string
  onJoin: (nickname: string) => Promise<void>
  error?: string
}

export default function JoinScreen({ sessionCode, onJoin, error }: JoinScreenProps) {
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      setLocalError('Please enter a nickname')
      return
    }
    
    if (nickname.trim().length < 2) {
      setLocalError('Nickname must be at least 2 characters')
      return
    }
    
    if (nickname.trim().length > 20) {
      setLocalError('Nickname must be less than 20 characters')
      return
    }

    setLocalError('')
    setIsJoining(true)
    
    try {
      await onJoin(nickname.trim())
    } catch {
      setLocalError('Failed to join. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const displayError = error || localError

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md animate-bounce-in">
        {/* Session code display */}
        <div className="text-center mb-8">
          <p className="text-white/50 text-sm mb-2">Joining quiz</p>
          <div className="flex justify-center gap-2">
            {sessionCode.split('').map((char, i) => (
              <span
                key={i}
                className="w-10 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl font-mono font-bold text-accent-400"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Nickname form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-white/70 mb-2">
              Enter your nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your name"
              className="input-field text-center text-xl"
              maxLength={20}
              autoComplete="off"
              autoFocus
            />
          </div>

          {displayError && (
            <p className="text-red-400 text-sm text-center animate-fade-in">
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={isJoining || !nickname.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner w-5 h-5" />
                Joining...
              </span>
            ) : (
              "Let's Go!"
            )}
          </button>
        </form>

        {/* Fun avatar preview */}
        <div className="mt-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl">
            {nickname ? nickname.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      </div>
    </div>
  )
}


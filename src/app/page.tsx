'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.trim().length !== 6) return
    
    setIsJoining(true)
    router.push(`/play/${joinCode.toUpperCase()}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="font-display text-6xl md:text-7xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
            QuizMaster
          </span>
        </h1>
        <p className="text-xl text-white/60 max-w-md mx-auto">
          Create engaging live quizzes and compete with your team in real-time
        </p>
      </div>

      {/* Main Actions */}
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Join a Quiz */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-white/80">Join a Quiz</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="input-field text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={joinCode.length !== 6 || isJoining}
              className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-5 h-5" />
                  Joining...
                </span>
              ) : (
                'Join Game'
              )}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Host a Quiz */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-white/80">Host a Quiz</h2>
          <p className="text-white/50 text-sm mb-4">
            Create your own quiz and host it for your participants
          </p>
          <Link href="/host" className="btn-primary w-full block text-center">
            Create Quiz
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-white/30 text-sm">
        <p>Built with Next.js & Supabase</p>
      </footer>
    </main>
  )
}


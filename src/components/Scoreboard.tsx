'use client'

import { Player } from '@/types/quiz'
import { useEffect, useState } from 'react'

interface ScoreboardProps {
  players: Player[]
  highlightPlayerId?: string
  showTop?: number
  compact?: boolean
}

export default function Scoreboard({
  players,
  highlightPlayerId,
  showTop = 5,
  compact = false,
}: ScoreboardProps) {
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({})

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const displayPlayers = showTop ? sortedPlayers.slice(0, showTop) : sortedPlayers

  // Animate score changes
  useEffect(() => {
    const newScores: Record<string, number> = {}
    players.forEach(p => {
      newScores[p.id] = p.score
    })
    setAnimatedScores(newScores)
  }, [players])

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
      default:
        return 'bg-white/10 text-white/70'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {displayPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`
              flex items-center justify-between p-2 rounded-lg
              ${player.id === highlightPlayerId ? 'bg-primary-500/30 border border-primary-500' : 'bg-white/5'}
              transition-all duration-300
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold w-6 text-center">
                {getRankIcon(index + 1) || `#${index + 1}`}
              </span>
              <span className="font-medium truncate max-w-[100px]">
                {player.nickname}
              </span>
            </div>
            <span className="font-bold text-accent-400">
              {player.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <h3 className="text-xl font-bold text-center mb-6 text-white/80">
        Leaderboard
      </h3>
      
      {displayPlayers.map((player, index) => {
        const rank = index + 1
        const isHighlighted = player.id === highlightPlayerId
        
        return (
          <div
            key={player.id}
            className={`
              flex items-center gap-4 p-4 rounded-xl
              transition-all duration-500 ease-out
              ${isHighlighted ? 'ring-2 ring-primary-500 bg-primary-500/20' : 'bg-white/5'}
              animate-slide-up
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Rank badge */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                ${getRankStyle(rank)}
              `}
            >
              {getRankIcon(rank) || rank}
            </div>
            
            {/* Player info */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isHighlighted ? 'text-white' : 'text-white/90'}`}>
                {player.nickname}
                {isHighlighted && <span className="ml-2 text-primary-400">(You)</span>}
              </p>
            </div>
            
            {/* Score */}
            <div className="text-right">
              <span className={`
                text-xl font-bold
                ${rank === 1 ? 'text-yellow-400' : 'text-accent-400'}
              `}>
                {(animatedScores[player.id] || player.score).toLocaleString()}
              </span>
              <span className="text-white/40 text-sm ml-1">pts</span>
            </div>
          </div>
        )
      })}
      
      {sortedPlayers.length > showTop && (
        <p className="text-center text-white/40 text-sm mt-4">
          +{sortedPlayers.length - showTop} more players
        </p>
      )}
    </div>
  )
}


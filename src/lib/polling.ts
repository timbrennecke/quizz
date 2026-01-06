import { supabase } from './supabase'
import { Player, GameSession } from '@/types/quiz'

type Callback<T> = (data: T) => void

export class SessionPoller {
  private sessionCode: string
  private intervalId: NodeJS.Timeout | null = null
  private lastPlayerCount = 0
  private lastStatus = ''
  private lastQuestionIndex = -1
  
  private onPlayersChange?: Callback<Player[]>
  private onStatusChange?: Callback<GameSession>
  private onQuestionChange?: Callback<number>

  constructor(sessionCode: string) {
    this.sessionCode = sessionCode
  }

  setOnPlayersChange(callback: Callback<Player[]>): this {
    this.onPlayersChange = callback
    return this
  }

  setOnStatusChange(callback: Callback<GameSession>): this {
    this.onStatusChange = callback
    return this
  }

  setOnQuestionChange(callback: Callback<number>): this {
    this.onQuestionChange = callback
    return this
  }

  start(intervalMs = 2000): void {
    if (this.intervalId) return
    
    // Initial fetch
    this.poll()
    
    // Start polling
    this.intervalId = setInterval(() => this.poll(), intervalMs)
    console.log('Polling started for session:', this.sessionCode)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Polling stopped')
    }
  }

  private async poll(): Promise<void> {
    try {
      const { data: session, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          players (*)
        `)
        .eq('code', this.sessionCode)
        .order('score', { referencedTable: 'players', ascending: false })
        .single()

      if (error || !session) return

      // Check for player changes
      const players = session.players || []
      if (players.length !== this.lastPlayerCount) {
        this.lastPlayerCount = players.length
        this.onPlayersChange?.(players)
      }

      // Check for status changes
      if (session.status !== this.lastStatus) {
        this.lastStatus = session.status
        this.onStatusChange?.(session)
      }

      // Check for question changes (only when game is in progress)
      if (session.status === 'in_progress' && session.current_question !== this.lastQuestionIndex) {
        this.lastQuestionIndex = session.current_question
        this.onQuestionChange?.(session.current_question)
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }
}

export function createSessionPoller(sessionCode: string): SessionPoller {
  return new SessionPoller(sessionCode)
}


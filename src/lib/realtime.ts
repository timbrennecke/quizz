import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  PlayerJoinedPayload,
  QuestionPayload,
  AnswerSubmittedPayload,
  QuestionResultsPayload,
  GameFinishedPayload,
} from '@/types/quiz'

type EventCallback<T> = (payload: T) => void

export class QuizChannel {
  private channel: RealtimeChannel
  private sessionCode: string

  constructor(sessionCode: string) {
    this.sessionCode = sessionCode
    this.channel = supabase.channel(`quiz:${sessionCode}`, {
      config: {
        broadcast: { self: true },
      },
    })
  }

  // Subscribe to the channel
  async subscribe(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel.subscribe((status, err) => {
        console.log('Realtime channel status:', status, err)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to channel:', this.sessionCode)
          resolve()
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error:', err)
          reject(new Error(`Failed to subscribe to channel: ${err?.message || 'Unknown error'}`))
        } else if (status === 'TIMED_OUT') {
          reject(new Error('Channel subscription timed out'))
        } else if (status === 'CLOSED') {
          console.log('Channel closed')
        }
      })
    })
  }

  // Unsubscribe from the channel
  async unsubscribe(): Promise<void> {
    await supabase.removeChannel(this.channel)
  }

  // Event listeners
  onPlayerJoined(callback: EventCallback<PlayerJoinedPayload>): this {
    this.channel.on('broadcast', { event: 'player_joined' }, ({ payload }) => {
      callback(payload as PlayerJoinedPayload)
    })
    return this
  }

  onPlayerLeft(callback: EventCallback<{ playerId: string }>): this {
    this.channel.on('broadcast', { event: 'player_left' }, ({ payload }) => {
      callback(payload as { playerId: string })
    })
    return this
  }

  onGameStarted(callback: EventCallback<void>): this {
    this.channel.on('broadcast', { event: 'game_started' }, () => {
      callback()
    })
    return this
  }

  onNewQuestion(callback: EventCallback<QuestionPayload>): this {
    this.channel.on('broadcast', { event: 'new_question' }, ({ payload }) => {
      callback(payload as QuestionPayload)
    })
    return this
  }

  onAnswerSubmitted(callback: EventCallback<AnswerSubmittedPayload>): this {
    this.channel.on('broadcast', { event: 'answer_submitted' }, ({ payload }) => {
      callback(payload as AnswerSubmittedPayload)
    })
    return this
  }

  onQuestionResults(callback: EventCallback<QuestionResultsPayload>): this {
    this.channel.on('broadcast', { event: 'question_results' }, ({ payload }) => {
      callback(payload as QuestionResultsPayload)
    })
    return this
  }

  onGameFinished(callback: EventCallback<GameFinishedPayload>): this {
    this.channel.on('broadcast', { event: 'game_finished' }, ({ payload }) => {
      callback(payload as GameFinishedPayload)
    })
    return this
  }

  // Broadcast events
  async broadcastPlayerJoined(payload: PlayerJoinedPayload): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'player_joined',
      payload,
    })
  }

  async broadcastPlayerLeft(playerId: string): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'player_left',
      payload: { playerId },
    })
  }

  async broadcastGameStarted(): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'game_started',
      payload: {},
    })
  }

  async broadcastNewQuestion(payload: QuestionPayload): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'new_question',
      payload,
    })
  }

  async broadcastAnswerSubmitted(payload: AnswerSubmittedPayload): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'answer_submitted',
      payload,
    })
  }

  async broadcastQuestionResults(payload: QuestionResultsPayload): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'question_results',
      payload,
    })
  }

  async broadcastGameFinished(payload: GameFinishedPayload): Promise<void> {
    await this.channel.send({
      type: 'broadcast',
      event: 'game_finished',
      payload,
    })
  }
}

// Hook for using the quiz channel
export function createQuizChannel(sessionCode: string): QuizChannel {
  return new QuizChannel(sessionCode)
}


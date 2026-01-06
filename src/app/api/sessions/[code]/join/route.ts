import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/sessions/[code]/join - Join a session as a player
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const { nickname } = body

    if (!nickname?.trim()) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      )
    }

    // Find the session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('id, status')
      .eq('code', code.toUpperCase())
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.status !== 'lobby') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    // Check if nickname is already taken in this session
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('session_id', session.id)
      .eq('nickname', nickname.trim())
      .single()

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Nickname is already taken' },
        { status: 400 }
      )
    }

    // Create the player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        session_id: session.id,
        nickname: nickname.trim(),
        score: 0,
      })
      .select()
      .single()

    if (playerError) throw playerError

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Error joining session:', error)
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    )
  }
}


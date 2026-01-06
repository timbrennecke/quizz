import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/sessions/[code] - Get session by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const { data: session, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        quiz:quizzes (
          id,
          title,
          questions (*)
        ),
        players (*)
      `)
      .eq('code', code.toUpperCase())
      .order('order', { referencedTable: 'quiz.questions' })
      .order('score', { referencedTable: 'players', ascending: false })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

// PATCH /api/sessions/[code] - Update session status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()

    const updates: Record<string, unknown> = {}
    
    if (body.status) {
      updates.status = body.status
    }
    if (typeof body.current_question === 'number') {
      updates.current_question = body.current_question
    }

    const { data: session, error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('code', code.toUpperCase())
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}


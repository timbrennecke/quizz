import { NextRequest, NextResponse } from 'next/server'
import { supabase, generateSessionCode } from '@/lib/supabase'

// POST /api/sessions - Create a new game session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizId } = body

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    // Verify quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Generate unique session code
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = generateSessionCode()
      const { data: existing } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique session code' },
        { status: 500 }
      )
    }

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        quiz_id: quizId,
        code,
        status: 'lobby',
        current_question: 0,
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    return NextResponse.json({ ...session, quiz }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}


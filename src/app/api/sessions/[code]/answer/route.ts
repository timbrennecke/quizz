import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkAnswer, calculatePoints } from '@/lib/game-engine'

// POST /api/sessions/[code]/answer - Submit an answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const { playerId, questionId, answer, timeMs } = body

    if (!playerId || !questionId || answer === undefined || timeMs === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the question details
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Check if player already answered this question
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('player_id', playerId)
      .eq('question_id', questionId)
      .single()

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'Already answered this question' },
        { status: 400 }
      )
    }

    // Check the answer
    const isCorrect = checkAnswer(question, answer)
    const pointsEarned = calculatePoints(
      question.time_limit,
      timeMs,
      question.points,
      isCorrect
    )

    // Save the answer
    const { data: savedAnswer, error: answerError } = await supabase
      .from('answers')
      .insert({
        player_id: playerId,
        question_id: questionId,
        answer,
        time_ms: timeMs,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      })
      .select()
      .single()

    if (answerError) throw answerError

    // Update player's score
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('score')
      .eq('id', playerId)
      .single()

    if (!playerError && player) {
      await supabase
        .from('players')
        .update({ score: player.score + pointsEarned })
        .eq('id', playerId)
    }

    return NextResponse.json({
      ...savedAnswer,
      isCorrect,
      pointsEarned,
    })
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}


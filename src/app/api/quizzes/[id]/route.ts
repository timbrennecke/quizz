import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { QuizFormData } from '@/types/quiz'

// GET /api/quizzes/[id] - Get a single quiz with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (*)
      `)
      .eq('id', id)
      .order('order', { referencedTable: 'questions' })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

// PUT /api/quizzes/[id] - Update a quiz and its questions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: QuizFormData = await request.json()

    // Validate input
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Quiz title is required' },
        { status: 400 }
      )
    }

    // Update the quiz title
    const { error: quizError } = await supabase
      .from('quizzes')
      .update({ title: body.title.trim() })
      .eq('id', id)

    if (quizError) throw quizError

    // Delete existing questions
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', id)

    // Insert new questions
    if (body.questions?.length) {
      const questionsToInsert = body.questions.map((q, index) => ({
        quiz_id: id,
        type: q.type,
        text: q.text.trim(),
        options: q.type === 'multiple_choice' ? q.options : null,
        correct_answer: q.correct_answer,
        time_limit: q.time_limit || 30,
        points: q.points || 100,
        order: index,
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError
    }

    // Fetch the updated quiz
    const { data: updatedQuiz, error: fetchError } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (*)
      `)
      .eq('id', id)
      .order('order', { referencedTable: 'questions' })
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

// DELETE /api/quizzes/[id] - Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}


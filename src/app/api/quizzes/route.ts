import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { QuizFormData } from '@/types/quiz'

// GET /api/quizzes - List all quizzes
export async function GET() {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}

// POST /api/quizzes - Create a new quiz with questions
export async function POST(request: NextRequest) {
  try {
    const body: QuizFormData = await request.json()

    // Validate input
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Quiz title is required' },
        { status: 400 }
      )
    }

    if (!body.questions?.length) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Create the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({ title: body.title.trim() })
      .select()
      .single()

    if (quizError) throw quizError

    // Create the questions
    const questionsToInsert = body.questions.map((q, index) => ({
      quiz_id: quiz.id,
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

    if (questionsError) {
      // Rollback: delete the quiz if questions failed
      await supabase.from('quizzes').delete().eq('id', quiz.id)
      throw questionsError
    }

    // Fetch the complete quiz with questions
    const { data: completeQuiz, error: fetchError } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (*)
      `)
      .eq('id', quiz.id)
      .order('order', { referencedTable: 'questions' })
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json(completeQuiz, { status: 201 })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}


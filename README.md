# QuizMaster - Live Quiz Platform

A real-time quiz application similar to Kahoot, built with Next.js and Supabase.

## Features

- **Create Quizzes**: Build quizzes with multiple choice, true/false, and open text questions
- **Live Sessions**: Host real-time quiz sessions with unique join codes
- **Real-time Sync**: All participants see questions and results simultaneously
- **Scoring System**: Points based on correctness and response speed
- **Live Leaderboard**: See rankings update after each question

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Supabase Realtime (Broadcast Channels)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account (free tier works fine)

### 1. Clone and Install

```bash
cd quiz-app
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration script from `supabase/migrations/001_initial_schema.sql`
4. Copy your project URL and anon key from Settings > API

### 3. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables in the Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

Add these in the Vercel dashboard under Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Project Structure

```
quiz-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── host/
│   │   │   ├── page.tsx          # Quiz management
│   │   │   └── [sessionId]/
│   │   │       └── play/page.tsx # Host game control
│   │   ├── play/
│   │   │   └── [code]/page.tsx   # Player game view
│   │   └── api/                  # API routes
│   ├── components/               # React components
│   ├── lib/                      # Utilities & Supabase client
│   └── types/                    # TypeScript types
├── supabase/
│   └── migrations/               # Database schema
└── package.json
```

## How to Use

### As a Host

1. Go to the homepage and click "Create Quiz"
2. Build your quiz with questions
3. Save and click "Start" to create a session
4. Share the 6-digit code with participants
5. Wait for players to join, then start the game
6. Control the pace of the quiz

### As a Player

1. Go to the homepage
2. Enter the 6-digit session code
3. Choose a nickname
4. Wait for the host to start
5. Answer questions as fast as possible!
6. See your ranking after each question

## License

MIT


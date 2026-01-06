import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuizMaster - Live Quiz Platform',
  description: 'Create and host interactive live quizzes for your team or classroom',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-animated min-h-screen">
        {children}
      </body>
    </html>
  )
}


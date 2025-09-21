"use client"

import { Navigation } from "@/components/navigation"
import { EnhancedTeacherDashboard } from "@/components/enhanced-teacher-dashboard"

export default function TeacherPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <EnhancedTeacherDashboard />
      </main>
    </div>
  )
}

import { CurriculumManagement } from "@/components/curriculum-management"
import { Navigation } from "@/components/navigation"

export default function CurriculumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">AI-Powered Curriculum Management</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Intelligent scheduling, subject tracking, and performance analytics for educational programs
          </p>
        </div>
        <CurriculumManagement />
      </main>
    </div>
  )
}

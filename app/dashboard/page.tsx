import { SystemDashboard } from "@/components/system-dashboard"
import { Navigation } from "@/components/navigation"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">System Dashboard</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Comprehensive overview of your AI-powered educational management system
          </p>
        </div>
        <SystemDashboard />
      </main>
    </div>
  )
}

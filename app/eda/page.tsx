"use client"

import { Navigation } from "@/components/navigation"
import { EDADashboard } from "@/components/eda-dashboard"

export default function EDAPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Exploratory Data Analysis</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Advanced statistical analysis, data profiling, and feature engineering tools
          </p>
        </div>
        <EDADashboard />
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, TrendingUp, Users, Brain, Target, Zap } from "lucide-react"
import { CurriculumScheduler } from "@/components/curriculum-scheduler"
import { SubjectTracker } from "@/components/subject-tracker"
import { PerformanceInsights } from "@/components/performance-insights"
import { AIRecommendations } from "@/components/ai-recommendations"

interface CurriculumStats {
  totalSubjects: number
  activeClasses: number
  completionRate: number
  averagePerformance: number
  upcomingDeadlines: number
  aiRecommendations: number
}

export function CurriculumManagement() {
  const [stats] = useState<CurriculumStats>({
    totalSubjects: 12,
    activeClasses: 8,
    completionRate: 87,
    averagePerformance: 82,
    upcomingDeadlines: 5,
    aiRecommendations: 3,
  })

  const [selectedSemester, setSelectedSemester] = useState("Fall 2024")

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Total Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalSubjects}</div>
            <p className="text-sm text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.activeClasses}</div>
            <p className="text-sm text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completionRate}%</div>
            <p className="text-sm text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.averagePerformance}%</div>
            <p className="text-sm text-muted-foreground">Class average</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI-Powered Insights Available</h3>
                <p className="text-muted-foreground">
                  {stats.aiRecommendations} new recommendations for curriculum optimization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Zap className="w-3 h-3" />
                {stats.upcomingDeadlines} Deadlines
              </Badge>
              <Button className="gap-2">
                <Brain className="w-4 h-4" />
                View AI Insights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semester Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Curriculum Overview - {selectedSemester}
          </CardTitle>
          <CardDescription>Manage subjects, schedules, and track performance across your curriculum</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={selectedSemester === "Fall 2024" ? "default" : "outline"}
              onClick={() => setSelectedSemester("Fall 2024")}
              className="bg-transparent"
            >
              Fall 2024
            </Button>
            <Button
              variant={selectedSemester === "Spring 2025" ? "default" : "outline"}
              onClick={() => setSelectedSemester("Spring 2025")}
              className="bg-transparent"
            >
              Spring 2025
            </Button>
            <Button
              variant={selectedSemester === "Summer 2025" ? "default" : "outline"}
              onClick={() => setSelectedSemester("Summer 2025")}
              className="bg-transparent"
            >
              Summer 2025
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <Tabs defaultValue="scheduler" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduler">AI Scheduler</TabsTrigger>
          <TabsTrigger value="subjects">Subject Tracker</TabsTrigger>
          <TabsTrigger value="insights">Performance Insights</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduler">
          <CurriculumScheduler semester={selectedSemester} />
        </TabsContent>

        <TabsContent value="subjects">
          <SubjectTracker semester={selectedSemester} />
        </TabsContent>

        <TabsContent value="insights">
          <PerformanceInsights semester={selectedSemester} />
        </TabsContent>

        <TabsContent value="recommendations">
          <AIRecommendations semester={selectedSemester} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

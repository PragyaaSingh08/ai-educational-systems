"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Lightbulb, TrendingUp, Users, Clock, Target, CheckCircle, AlertTriangle, Zap } from "lucide-react"

interface Recommendation {
  id: string
  type: "scheduling" | "performance" | "resource" | "curriculum"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  impact: string
  confidence: number
  estimatedTime: string
  status: "new" | "in-progress" | "completed" | "dismissed"
  aiReasoning: string
}

interface AIRecommendationsProps {
  semester: string
}

export function AIRecommendations({ semester }: AIRecommendationsProps) {
  const recommendations: Recommendation[] = [
    {
      id: "1",
      type: "scheduling",
      priority: "high",
      title: "Optimize Database Systems Lab Schedule",
      description: "Move Database Systems lab from 2:00 PM to 10:00 AM to reduce room conflicts and improve attendance",
      impact: "Reduce scheduling conflicts by 60% and improve attendance by 12%",
      confidence: 94,
      estimatedTime: "2 hours",
      status: "new",
      aiReasoning:
        "Analysis shows 85% of students have better attendance rates in morning sessions. Current time slot conflicts with 3 other popular courses.",
    },
    {
      id: "2",
      type: "performance",
      priority: "high",
      title: "Additional Support for Database Systems",
      description: "Implement weekly tutoring sessions for Database Systems due to declining performance trends",
      impact: "Potentially improve average grade by 8-12%",
      confidence: 87,
      estimatedTime: "1 week setup",
      status: "new",
      aiReasoning:
        "Performance data shows 23% decline in Database Systems over 6 weeks. Students with similar patterns improved 11% with additional support.",
    },
    {
      id: "3",
      type: "curriculum",
      priority: "medium",
      title: "Introduce ML Ethics Earlier",
      description: "Move AI Ethics course from final semester to after ML Fundamentals completion",
      impact: "Better ethical foundation and 15% improvement in capstone projects",
      confidence: 78,
      estimatedTime: "Next semester",
      status: "in-progress",
      aiReasoning:
        "Students who take ethics courses earlier show better decision-making in advanced projects. Current placement is too late in curriculum.",
    },
    {
      id: "4",
      type: "resource",
      priority: "medium",
      title: "Increase Lab Capacity",
      description: "Add additional lab session for Machine Learning Fundamentals due to high demand",
      impact: "Accommodate 15 more students and reduce waitlist",
      confidence: 91,
      estimatedTime: "3 days",
      status: "new",
      aiReasoning:
        "Current lab is at 90% capacity with 15 students on waitlist. Historical data shows high correlation between lab access and course completion.",
    },
    {
      id: "5",
      type: "performance",
      priority: "low",
      title: "Gamify Assignment Submissions",
      description: "Implement point-based system for early assignment submissions to improve completion rates",
      impact: "Increase on-time submissions by 20-25%",
      confidence: 72,
      estimatedTime: "2 weeks",
      status: "completed",
      aiReasoning:
        "Similar gamification strategies in other institutions showed 22% improvement in submission rates and 18% improvement in quality.",
    },
  ]

  const newRecommendations = recommendations.filter((r) => r.status === "new")
  const inProgressRecommendations = recommendations.filter((r) => r.status === "in-progress")
  const completedRecommendations = recommendations.filter((r) => r.status === "completed")

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "scheduling":
        return Clock
      case "performance":
        return TrendingUp
      case "resource":
        return Users
      case "curriculum":
        return Target
      default:
        return Lightbulb
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "scheduling":
        return "text-blue-500"
      case "performance":
        return "text-green-500"
      case "resource":
        return "text-yellow-500"
      case "curriculum":
        return "text-purple-500"
      default:
        return "text-gray-500"
    }
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">AI-Powered Curriculum Optimization</h3>
              <p className="text-muted-foreground">
                Advanced machine learning analysis of your curriculum data to provide actionable insights
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{newRecommendations.length}</div>
              <p className="text-sm text-muted-foreground">New recommendations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{newRecommendations.length}</div>
            <p className="text-sm text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{inProgressRecommendations.length}</div>
            <p className="text-sm text-muted-foreground">Being implemented</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedRecommendations.length}</div>
            <p className="text-sm text-muted-foreground">Successfully implemented</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-500" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
            </div>
            <p className="text-sm text-muted-foreground">AI confidence level</p>
          </CardContent>
        </Card>
      </div>

      {/* New Recommendations */}
      {newRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              New Recommendations
            </CardTitle>
            <CardDescription>AI-generated suggestions requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newRecommendations.map((rec) => {
                const TypeIcon = getTypeIcon(rec.type)
                return (
                  <Card key={rec.id} className="relative">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <TypeIcon className={`w-5 h-5 ${getTypeColor(rec.type)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge variant={getPriorityVariant(rec.priority)}>{rec.priority} priority</Badge>
                            <Badge variant="outline">{rec.type}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{rec.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium text-green-600">Expected Impact:</span>
                              <p className="text-muted-foreground">{rec.impact}</p>
                            </div>
                            <div>
                              <span className="font-medium">AI Confidence:</span>
                              <p className="text-muted-foreground">{rec.confidence}%</p>
                            </div>
                            <div>
                              <span className="font-medium">Implementation Time:</span>
                              <p className="text-muted-foreground">{rec.estimatedTime}</p>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg mb-4">
                            <p className="text-sm">
                              <span className="font-medium">AI Reasoning:</span> {rec.aiReasoning}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Implement
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                              <Clock className="w-3 h-3" />
                              Schedule Later
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress */}
      {inProgressRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              In Progress
            </CardTitle>
            <CardDescription>Recommendations currently being implemented</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressRecommendations.map((rec) => {
                const TypeIcon = getTypeIcon(rec.type)
                return (
                  <div key={rec.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <TypeIcon className={`w-5 h-5 ${getTypeColor(rec.type)}`} />
                    <div className="flex-1">
                      <h3 className="font-medium">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completedRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Recently Completed
            </CardTitle>
            <CardDescription>Successfully implemented recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedRecommendations.map((rec) => {
                const TypeIcon = getTypeIcon(rec.type)
                return (
                  <div key={rec.id} className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <TypeIcon className={`w-5 h-5 ${getTypeColor(rec.type)}`} />
                    <div className="flex-1">
                      <h3 className="font-medium">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground">{rec.impact}</p>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

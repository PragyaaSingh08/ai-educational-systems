import { type NextRequest, NextResponse } from "next/server"

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

// Mock recommendations database
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
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const priority = searchParams.get("priority")

    let filteredRecommendations = [...recommendations]

    if (status && status !== "all") {
      filteredRecommendations = filteredRecommendations.filter((rec) => rec.status === status)
    }

    if (type && type !== "all") {
      filteredRecommendations = filteredRecommendations.filter((rec) => rec.type === type)
    }

    if (priority && priority !== "all") {
      filteredRecommendations = filteredRecommendations.filter((rec) => rec.priority === priority)
    }

    return NextResponse.json({
      success: true,
      recommendations: filteredRecommendations,
      total: filteredRecommendations.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch recommendations" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID and status are required" }, { status: 400 })
    }

    const recommendationIndex = recommendations.findIndex((rec) => rec.id === id)
    if (recommendationIndex === -1) {
      return NextResponse.json({ success: false, error: "Recommendation not found" }, { status: 404 })
    }

    recommendations[recommendationIndex].status = status

    return NextResponse.json({
      success: true,
      recommendation: recommendations[recommendationIndex],
      message: "Recommendation status updated successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update recommendation" }, { status: 500 })
  }
}

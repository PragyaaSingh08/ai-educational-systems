import { type NextRequest, NextResponse } from "next/server"

interface ModelTrainingRequest {
  models: string[]
  dataset: string
  parameters?: Record<string, any>
}

interface ModelStatus {
  name: string
  type: "classical" | "deep"
  accuracy: number
  status: "training" | "completed" | "idle"
  progress: number
}

// Mock training data storage
const trainingData: Record<string, ModelStatus[]> = {}

export async function POST(request: NextRequest) {
  try {
    const body: ModelTrainingRequest = await request.json()
    const { models, dataset, parameters } = body

    // Generate session ID
    const sessionId = `session_${Date.now()}`

    // Initialize model statuses
    const modelStatuses: ModelStatus[] = models.map((model) => ({
      name: model,
      type: model.includes("CNN") || model.includes("LSTM") || model.includes("GRU") ? "deep" : "classical",
      accuracy: 0,
      status: "training" as const,
      progress: 0,
    }))

    trainingData[sessionId] = modelStatuses

    // Simulate training process
    setTimeout(() => {
      if (trainingData[sessionId]) {
        trainingData[sessionId] = trainingData[sessionId].map((model) => ({
          ...model,
          accuracy: 0.75 + Math.random() * 0.2,
          status: "completed" as const,
          progress: 100,
        }))
      }
    }, 8000)

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Training started successfully",
      models: modelStatuses,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to start training" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    const models = trainingData[sessionId]
    if (!models) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      sessionId,
      models,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to get training status" }, { status: 500 })
  }
}

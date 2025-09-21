"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, Play, Pause, RotateCcw, CheckCircle, AlertCircle, Activity } from "lucide-react"
import { ModelComparisonChart } from "@/components/model-comparison-chart"
import { RealTimeMetrics } from "@/components/real-time-metrics"
import { EnsembleEngine } from "@/components/ensemble-engine"
import { DatasetUpload } from "@/components/dataset-upload"
import { DataVisualization } from "@/components/data-visualization"
import { HybridMLEngine } from "@/components/hybrid-ml-engine"
import { AdvancedMLDashboard } from "@/components/advanced-ml-dashboard"

interface ModelStatus {
  name: string
  type: "classical" | "deep"
  accuracy: number
  status: "training" | "completed" | "idle"
  progress: number
}

export function MLFrameworkDashboard() {
  const [isTraining, setIsTraining] = useState(false)
  const [models, setModels] = useState<ModelStatus[]>([
    { name: "Random Forest", type: "classical", accuracy: 0, status: "idle", progress: 0 },
    { name: "SVM", type: "classical", accuracy: 0, status: "idle", progress: 0 },
    { name: "Gradient Boosting", type: "classical", accuracy: 0, status: "idle", progress: 0 },
    { name: "KNN", type: "classical", accuracy: 0, status: "idle", progress: 0 },
    { name: "CNN", type: "deep", accuracy: 0, status: "idle", progress: 0 },
    { name: "LSTM", type: "deep", accuracy: 0, status: "idle", progress: 0 },
    { name: "GRU", type: "deep", accuracy: 0, status: "idle", progress: 0 },
    { name: "FaceNet CNN", type: "deep", accuracy: 0, status: "idle", progress: 0 },
  ])
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const [datasetInfo, setDatasetInfo] = useState<any>(null)
  const [hasDataset, setHasDataset] = useState(false)

  const startTraining = () => {
    if (uploadedData.length === 0) {
      alert("Please upload a dataset first before starting training.")
      return
    }

    setIsTraining(true)
    setModels((prev) => prev.map((model) => ({ ...model, status: "training", progress: 0 })))
    console.log("[v0] Starting advanced ML model training...")

    // Simulate training progress
    const interval = setInterval(() => {
      setModels((prev) =>
        prev.map((model) => {
          if (model.progress < 100) {
            const newProgress = Math.min(model.progress + Math.random() * 15, 100)
            let baseAccuracy = 0.75
            if (model.name === "Gradient Boosting" || model.name === "FaceNet CNN") {
              baseAccuracy = 0.85 // Higher base accuracy for advanced models
            }
            const newAccuracy = (newProgress / 100) * (baseAccuracy + Math.random() * 0.15)
            return {
              ...model,
              progress: newProgress,
              accuracy: newAccuracy,
              status: newProgress >= 100 ? "completed" : "training",
            }
          }
          return model
        }),
      )
    }, 500)

    setTimeout(() => {
      clearInterval(interval)
      setIsTraining(false)
      console.log("[v0] Advanced ML model training completed")
    }, 8000)
  }

  const resetModels = () => {
    if (confirm("Are you sure you want to reset all model progress? This action cannot be undone.")) {
      setModels((prev) =>
        prev.map((model) => ({
          ...model,
          accuracy: 0,
          status: "idle",
          progress: 0,
        })),
      )
      console.log("[v0] All models reset to initial state")
    }
  }

  const bestModel = models.reduce((best, current) => (current.accuracy > best.accuracy ? current : best))

  const handleDatasetUploaded = (data: any[], info: any) => {
    setUploadedData(data)
    setDatasetInfo(info)
    setHasDataset(true)
  }

  return (
    <div className="space-y-6">
      {/* Dataset Upload */}
      <DatasetUpload onDatasetUploaded={handleDatasetUploaded} />

      {/* Show data visualization and ML engine only after dataset upload */}
      {uploadedData.length > 0 && datasetInfo && (
        <>
          <DataVisualization data={uploadedData} columns={datasetInfo.columns} />
          <HybridMLEngine data={uploadedData} columns={datasetInfo.columns} />
        </>
      )}

      {/* Show placeholder when no data is uploaded */}
      {uploadedData.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Brain className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Ready for Your Dataset</h3>
                <p className="text-muted-foreground">
                  Upload your dataset above to start hybrid machine learning analysis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Hybrid ML/DL Framework Control
          </CardTitle>
          <CardDescription>Real-time training and evaluation of classical ML and deep learning models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={startTraining} disabled={isTraining} className="gap-2">
              {isTraining ? (
                <>
                  <Pause className="w-4 h-4" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Training
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetModels} className="gap-2 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            {bestModel.accuracy > 0 && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                Best: {bestModel.name} ({(bestModel.accuracy * 100).toFixed(1)}%)
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Model Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((model) => (
          <Card key={model.name} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{model.name}</CardTitle>
                <Badge variant={model.type === "classical" ? "default" : "secondary"} className="text-xs">
                  {model.type === "classical" ? "Classical" : "Deep"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-mono font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                </div>
                <Progress value={model.accuracy * 100} className="h-2" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <div className="flex items-center gap-2">
                    {model.status === "training" && <Activity className="w-3 h-3 text-primary animate-pulse" />}
                    {model.status === "completed" && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {model.status === "idle" && <AlertCircle className="w-3 h-3 text-muted-foreground" />}
                    <span className="font-mono text-xs">{model.progress.toFixed(0)}%</span>
                  </div>
                </div>
                <Progress value={model.progress} className="h-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
          <TabsTrigger value="metrics">Real-time Metrics</TabsTrigger>
          <TabsTrigger value="ensemble">Ensemble Engine</TabsTrigger>
          <TabsTrigger value="advanced">Advanced ML</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <ModelComparisonChart models={models} hasDataset={hasDataset} />
        </TabsContent>

        <TabsContent value="metrics">
          <RealTimeMetrics models={models} hasDataset={hasDataset} />
        </TabsContent>

        <TabsContent value="ensemble">
          <EnsembleEngine models={models} />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedMLDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

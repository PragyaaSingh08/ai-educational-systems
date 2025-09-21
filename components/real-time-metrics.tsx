"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Clock, Cpu, HardDrive, Zap, Target, TrendingUp, AlertTriangle } from "lucide-react"

interface ModelStatus {
  name: string
  type: "classical" | "deep"
  accuracy: number
  status: "training" | "completed" | "idle"
  progress: number
}

interface RealTimeMetricsProps {
  models: ModelStatus[]
  hasDataset?: boolean
}

export function RealTimeMetrics({ models, hasDataset = false }: RealTimeMetricsProps) {
  const activeModels = models.filter((m) => m.status === "training").length
  const completedModels = models.filter((m) => m.status === "completed").length
  const avgAccuracy = hasDataset ? models.reduce((sum, m) => sum + m.accuracy, 0) / models.length : 0

  const systemMetrics = [
    { label: "CPU Usage", value: hasDataset ? 45 + Math.random() * 20 : 0, icon: Cpu, color: "text-blue-500" },
    { label: "Memory", value: hasDataset ? 62 + Math.random() * 15 : 0, icon: HardDrive, color: "text-green-500" },
    { label: "GPU Utilization", value: hasDataset ? 78 + Math.random() * 10 : 0, icon: Zap, color: "text-yellow-500" },
  ]

  const performanceMetrics = [
    {
      label: "Average Accuracy",
      value: hasDataset ? (avgAccuracy * 100).toFixed(1) + "%" : "0.0%",
      icon: Target,
      trend: hasDataset ? "+2.3%" : "0%",
      trendUp: hasDataset,
    },
    {
      label: "Training Speed",
      value: hasDataset ? "1.2k samples/sec" : "0 samples/sec",
      icon: Activity,
      trend: hasDataset ? "+15%" : "0%",
      trendUp: hasDataset,
    },
    {
      label: "Model Convergence",
      value: completedModels + "/" + models.length,
      icon: TrendingUp,
      trend: completedModels === models.length ? "Complete" : "In Progress",
      trendUp: completedModels === models.length,
    },
  ]

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Models</span>
                <Badge variant={activeModels > 0 ? "default" : "secondary"}>{activeModels}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge variant="outline">{completedModels}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queue</span>
                <Badge variant="secondary">{models.length - activeModels - completedModels}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Training Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-mono font-bold">
                {hasDataset && activeModels > 0 ? "00:05:23" : "00:00:00"}
              </div>
              <div className="text-sm text-muted-foreground">
                Estimated remaining: {hasDataset && activeModels > 0 ? "00:02:37" : "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-green-600 dark:text-green-400">✓ All models healthy</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">ℹ GPU acceleration active</div>
              <div className="text-sm text-muted-foreground">No warnings</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Real-time training and system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performanceMetrics.map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <Badge variant={metric.trendUp ? "default" : "secondary"} className="text-xs">
                    {metric.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
          <CardDescription>Real-time hardware utilization monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {systemMetrics.map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <span className="text-sm font-mono">{metric.value.toFixed(1)}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

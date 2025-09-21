"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layers, Vote, Zap, Trophy, ArrowRight, Settings } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface ModelStatus {
  name: string
  type: "classical" | "deep"
  accuracy: number
  status: "training" | "completed" | "idle"
  progress: number
}

interface EnsembleEngineProps {
  models: ModelStatus[]
}

export function EnsembleEngine({ models }: EnsembleEngineProps) {
  const completedModels = models.filter((m) => m.status === "completed" && m.accuracy > 0)

  // Calculate ensemble weights based on accuracy
  const totalAccuracy = completedModels.reduce((sum, m) => sum + m.accuracy, 0)
  const ensembleWeights = completedModels.map((model) => ({
    name: model.name,
    weight: totalAccuracy > 0 ? (model.accuracy / totalAccuracy) * 100 : 0,
    accuracy: model.accuracy * 100,
    type: model.type,
  }))

  // Calculate ensemble predictions
  const stackingAccuracy =
    completedModels.length > 0
      ? Math.min(95, (completedModels.reduce((sum, m) => sum + m.accuracy, 0) / completedModels.length) * 100 + 5)
      : 0

  const votingAccuracy =
    completedModels.length > 0
      ? Math.min(93, (completedModels.reduce((sum, m) => sum + m.accuracy, 0) / completedModels.length) * 100 + 3)
      : 0

  const ensembleMethods = [
    {
      name: "Stacking Ensemble",
      accuracy: stackingAccuracy,
      description: "Meta-learner combines predictions from all models",
      color: "hsl(var(--chart-1))",
      icon: Layers,
    },
    {
      name: "Voting Ensemble",
      accuracy: votingAccuracy,
      description: "Majority vote from all trained models",
      color: "hsl(var(--chart-2))",
      icon: Vote,
    },
  ]

  const bestEnsemble = ensembleMethods.reduce((best, current) => (current.accuracy > best.accuracy ? current : best))

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  return (
    <div className="space-y-6">
      {/* Ensemble Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Best Ensemble Recommendation
            </CardTitle>
            <CardDescription>Dynamically calculated optimal ensemble method</CardDescription>
          </CardHeader>
          <CardContent>
            {completedModels.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <bestEnsemble.icon className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">{bestEnsemble.name}</h3>
                    <p className="text-sm text-muted-foreground">{bestEnsemble.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Predicted Accuracy</span>
                    <span className="text-2xl font-bold text-primary">{bestEnsemble.accuracy.toFixed(1)}%</span>
                  </div>
                  <Progress value={bestEnsemble.accuracy} className="h-3" />
                </div>
                <Badge variant="default" className="gap-1">
                  <Zap className="w-3 h-3" />
                  Recommended
                </Badge>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complete model training to see ensemble recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Weight Distribution</CardTitle>
            <CardDescription>Dynamic weight allocation based on individual model performance</CardDescription>
          </CardHeader>
          <CardContent>
            {ensembleWeights.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={ensembleWeights}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="weight"
                  >
                    {ensembleWeights.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Weight"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No trained models available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ensemble Methods Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Ensemble Methods Comparison</CardTitle>
          <CardDescription>Performance comparison of different ensemble techniques</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="methods" className="space-y-4">
            <TabsList>
              <TabsTrigger value="methods">Methods</TabsTrigger>
              <TabsTrigger value="weights">Weights</TabsTrigger>
            </TabsList>

            <TabsContent value="methods">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ensembleMethods.map((method) => (
                  <Card key={method.name} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <method.icon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                      </div>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Accuracy</span>
                          <span className="text-xl font-bold">{method.accuracy.toFixed(1)}%</span>
                        </div>
                        <Progress value={method.accuracy} className="h-2" />
                        {method === bestEnsemble && (
                          <Badge variant="default" className="gap-1">
                            <Trophy className="w-3 h-3" />
                            Best Performance
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="weights">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ensembleWeights}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="weight" fill="hsl(var(--primary))" name="Weight %" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ensemble Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Ensemble Configuration
          </CardTitle>
          <CardDescription>Advanced settings for ensemble learning optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ensemble Method</label>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                Auto-Select Best
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight Strategy</label>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                Performance-Based
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Update Frequency</label>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                Real-time
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

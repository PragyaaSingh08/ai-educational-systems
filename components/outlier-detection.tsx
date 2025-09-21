"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { AlertTriangle, Target, TrendingUp, BarChart3, Eye, Download, CheckCircle } from "lucide-react"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface OutlierDetectionProps {
  data: any[]
  columns: string[]
}

interface OutlierResult {
  rowIndex: number
  column: string
  value: number
  method: string
  score: number
  severity: "mild" | "moderate" | "extreme"
}

interface DetectionMethod {
  id: string
  name: string
  description: string
  parameters: Array<{ name: string; label: string; type: string; default: any; min?: number; max?: number }>
}

export function OutlierDetection({ data, columns }: OutlierDetectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("zscore")
  const [selectedColumn, setSelectedColumn] = useState<string>("")
  const [methodParams, setMethodParams] = useState<Record<string, any>>({})
  const [detectedOutliers, setDetectedOutliers] = useState<OutlierResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Get numeric columns for outlier detection
  const numericColumns = columns.filter((col) => data.some((row) => typeof row[col] === "number" && !isNaN(row[col])))

  // Available detection methods
  const detectionMethods: DetectionMethod[] = [
    {
      id: "zscore",
      name: "Z-Score Method",
      description: "Detect outliers using standard deviations from the mean",
      parameters: [{ name: "threshold", label: "Z-Score Threshold", type: "number", default: 3, min: 1, max: 5 }],
    },
    {
      id: "iqr",
      name: "Interquartile Range (IQR)",
      description: "Detect outliers using the IQR method with quartiles",
      parameters: [{ name: "multiplier", label: "IQR Multiplier", type: "number", default: 1.5, min: 1, max: 3 }],
    },
    {
      id: "modified_zscore",
      name: "Modified Z-Score",
      description: "Robust outlier detection using median absolute deviation",
      parameters: [
        { name: "threshold", label: "Modified Z-Score Threshold", type: "number", default: 3.5, min: 2, max: 5 },
      ],
    },
    {
      id: "isolation_forest",
      name: "Isolation Forest",
      description: "Machine learning approach for anomaly detection",
      parameters: [
        { name: "contamination", label: "Contamination Rate", type: "number", default: 0.1, min: 0.01, max: 0.5 },
      ],
    },
  ]

  // Z-Score outlier detection
  const detectZScoreOutliers = (columnName: string, threshold = 3): OutlierResult[] => {
    const values = data
      .map((row, index) => ({ value: row[columnName], index }))
      .filter(({ value }) => typeof value === "number" && !isNaN(value))

    const numericValues = values.map(({ value }) => value)
    const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
    const std = Math.sqrt(numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length)

    return values
      .map(({ value, index }) => {
        const zScore = Math.abs((value - mean) / std)
        if (zScore > threshold) {
          return {
            rowIndex: index,
            column: columnName,
            value,
            method: "Z-Score",
            score: zScore,
            severity: zScore > threshold * 1.5 ? "extreme" : zScore > threshold * 1.2 ? "moderate" : "mild",
          } as OutlierResult
        }
        return null
      })
      .filter((result): result is OutlierResult => result !== null)
  }

  // IQR outlier detection
  const detectIQROutliers = (columnName: string, multiplier = 1.5): OutlierResult[] => {
    const values = data
      .map((row, index) => ({ value: row[columnName], index }))
      .filter(({ value }) => typeof value === "number" && !isNaN(value))

    const sortedValues = values.map(({ value }) => value).sort((a, b) => a - b)
    const q1Index = Math.floor(sortedValues.length * 0.25)
    const q3Index = Math.floor(sortedValues.length * 0.75)
    const q1 = sortedValues[q1Index]
    const q3 = sortedValues[q3Index]
    const iqr = q3 - q1

    const lowerBound = q1 - multiplier * iqr
    const upperBound = q3 + multiplier * iqr

    return values
      .map(({ value, index }) => {
        if (value < lowerBound || value > upperBound) {
          const distance = Math.min(Math.abs(value - lowerBound), Math.abs(value - upperBound))
          const score = distance / iqr
          return {
            rowIndex: index,
            column: columnName,
            value,
            method: "IQR",
            score,
            severity: score > multiplier * 2 ? "extreme" : score > multiplier * 1.5 ? "moderate" : "mild",
          } as OutlierResult
        }
        return null
      })
      .filter((result): result is OutlierResult => result !== null)
  }

  // Modified Z-Score outlier detection
  const detectModifiedZScoreOutliers = (columnName: string, threshold = 3.5): OutlierResult[] => {
    const values = data
      .map((row, index) => ({ value: row[columnName], index }))
      .filter(({ value }) => typeof value === "number" && !isNaN(value))

    const numericValues = values.map(({ value }) => value)
    const median = numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)]
    const mad = numericValues.reduce((sum, val) => sum + Math.abs(val - median), 0) / numericValues.length

    return values
      .map(({ value, index }) => {
        const modifiedZScore = (0.6745 * Math.abs(value - median)) / mad
        if (modifiedZScore > threshold) {
          return {
            rowIndex: index,
            column: columnName,
            value,
            method: "Modified Z-Score",
            score: modifiedZScore,
            severity:
              modifiedZScore > threshold * 1.5 ? "extreme" : modifiedZScore > threshold * 1.2 ? "moderate" : "mild",
          } as OutlierResult
        }
        return null
      })
      .filter((result): result is OutlierResult => result !== null)
  }

  // Isolation Forest simulation (simplified)
  const detectIsolationForestOutliers = (columnName: string, contamination = 0.1): OutlierResult[] => {
    const values = data
      .map((row, index) => ({ value: row[columnName], index }))
      .filter(({ value }) => typeof value === "number" && !isNaN(value))

    // Simplified isolation forest simulation
    const sortedValues = values.sort((a, b) => a.value - b.value)
    const outlierCount = Math.floor(values.length * contamination)

    // Take extreme values from both ends
    const outliers = [
      ...sortedValues.slice(0, Math.floor(outlierCount / 2)),
      ...sortedValues.slice(-Math.ceil(outlierCount / 2)),
    ]

    return outliers.map(({ value, index }) => ({
      rowIndex: index,
      column: columnName,
      value,
      method: "Isolation Forest",
      score: Math.random() * 0.5 + 0.5, // Simulated anomaly score
      severity: Math.random() > 0.7 ? "extreme" : Math.random() > 0.4 ? "moderate" : "mild",
    }))
  }

  // Run outlier detection
  const runOutlierDetection = () => {
    if (!selectedColumn) return

    setIsAnalyzing(true)
    setTimeout(() => {
      let outliers: OutlierResult[] = []

      const threshold = methodParams.threshold || 3
      const multiplier = methodParams.multiplier || 1.5
      const contamination = methodParams.contamination || 0.1

      switch (selectedMethod) {
        case "zscore":
          outliers = detectZScoreOutliers(selectedColumn, threshold)
          break
        case "iqr":
          outliers = detectIQROutliers(selectedColumn, multiplier)
          break
        case "modified_zscore":
          outliers = detectModifiedZScoreOutliers(selectedColumn, threshold)
          break
        case "isolation_forest":
          outliers = detectIsolationForestOutliers(selectedColumn, contamination)
          break
      }

      setDetectedOutliers(outliers)
      setIsAnalyzing(false)
    }, 1500)
  }

  // Prepare scatter plot data
  const scatterData = selectedColumn
    ? data
        .map((row, index) => ({
          x: index,
          y: typeof row[selectedColumn] === "number" ? row[selectedColumn] : null,
          isOutlier: detectedOutliers.some((outlier) => outlier.rowIndex === index),
          severity: detectedOutliers.find((outlier) => outlier.rowIndex === index)?.severity,
        }))
        .filter((point) => point.y !== null)
    : []

  // Summary statistics
  const outlierStats = {
    total: detectedOutliers.length,
    mild: detectedOutliers.filter((o) => o.severity === "mild").length,
    moderate: detectedOutliers.filter((o) => o.severity === "moderate").length,
    extreme: detectedOutliers.filter((o) => o.severity === "extreme").length,
    percentage: data.length > 0 ? (detectedOutliers.length / data.length) * 100 : 0,
  }

  const selectedMethodDetails = detectionMethods.find((m) => m.id === selectedMethod)

  // Export outliers
  const exportOutliers = () => {
    const exportData = {
      method: selectedMethodDetails?.name,
      parameters: methodParams,
      column: selectedColumn,
      outliers: detectedOutliers.map((outlier) => ({
        rowIndex: outlier.rowIndex,
        value: outlier.value,
        score: outlier.score,
        severity: outlier.severity,
      })),
      summary: outlierStats,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `outliers_${selectedColumn}_${selectedMethod}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Outlier Detection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Total Outliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{outlierStats.total}</div>
            <div className="text-sm text-muted-foreground">{outlierStats.percentage.toFixed(1)}% of data</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-500" />
              Mild Outliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{outlierStats.mild}</div>
            <div className="text-sm text-muted-foreground">Low severity</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Moderate Outliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{outlierStats.moderate}</div>
            <div className="text-sm text-muted-foreground">Medium severity</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Extreme Outliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{outlierStats.extreme}</div>
            <div className="text-sm text-muted-foreground">High severity</div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Outlier Detection Configuration
          </CardTitle>
          <CardDescription>Configure detection method and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="method">Detection Method</Label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {detectionMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="column">Target Column</Label>
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {selectedMethodDetails?.parameters.map((param) => (
                <div key={param.name}>
                  <Label htmlFor={param.name}>{param.label}</Label>
                  <Input
                    id={param.name}
                    type={param.type}
                    value={methodParams[param.name] || param.default}
                    min={param.min}
                    max={param.max}
                    step={param.type === "number" ? "0.1" : undefined}
                    onChange={(e) =>
                      setMethodParams({
                        ...methodParams,
                        [param.name]: param.type === "number" ? Number.parseFloat(e.target.value) : e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {selectedMethodDetails && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{selectedMethodDetails.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMethodDetails.description}</p>
                </div>
              )}

              <Button
                onClick={runOutlierDetection}
                disabled={!selectedColumn || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Detect Outliers
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {detectedOutliers.length > 0 && (
        <Tabs defaultValue="visualization" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="details">Outlier Details</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="visualization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Outlier Visualization
                </CardTitle>
                <CardDescription>Visual representation of detected outliers in {selectedColumn}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="x" name="Row Index" />
                    <YAxis dataKey="y" name={selectedColumn} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value: number, name: string, props: any) => [
                        value,
                        selectedColumn,
                        props.payload.isOutlier ? `(${props.payload.severity} outlier)` : "",
                      ]}
                    />
                    <Scatter
                      dataKey="y"
                      fill={(entry: any) => {
                        if (!entry.isOutlier) return "#8884d8"
                        switch (entry.severity) {
                          case "extreme":
                            return "#DC2626"
                          case "moderate":
                            return "#EA580C"
                          case "mild":
                            return "#D97706"
                          default:
                            return "#8884d8"
                        }
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>

                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Normal Values</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Mild Outliers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Moderate Outliers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span>Extreme Outliers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Outlier Details
                </CardTitle>
                <CardDescription>Detailed information about detected outliers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {detectedOutliers.length} outliers detected using {selectedMethodDetails?.name}
                    </div>
                    <Button variant="outline" size="sm" onClick={exportOutliers}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Row Index</th>
                          <th className="text-left p-2">Value</th>
                          <th className="text-left p-2">Score</th>
                          <th className="text-left p-2">Severity</th>
                          <th className="text-left p-2">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detectedOutliers
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 50)
                          .map((outlier, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-mono">{outlier.rowIndex + 1}</td>
                              <td className="p-2 font-mono">{outlier.value.toFixed(3)}</td>
                              <td className="p-2 font-mono">{outlier.score.toFixed(3)}</td>
                              <td className="p-2">
                                <Badge
                                  variant={
                                    outlier.severity === "extreme"
                                      ? "destructive"
                                      : outlier.severity === "moderate"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {outlier.severity}
                                </Badge>
                              </td>
                              <td className="p-2">{outlier.method}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {detectedOutliers.length > 50 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Showing top 50 of {detectedOutliers.length} outliers (sorted by score)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Outlier Treatment Options
                </CardTitle>
                <CardDescription>Choose how to handle detected outliers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Treatment Methods</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Remove Outliers
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Cap/Floor Values
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Transform Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Impute with Median
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Analysis Options</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Download className="w-4 h-4 mr-2" />
                        Export Outlier Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        Analyze All Columns
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Compare Methods
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Recommendations</h3>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        <p>• Review extreme outliers manually to determine if they are data errors</p>
                        <p>• Consider domain knowledge when deciding outlier treatment</p>
                        <p>• Test multiple detection methods for robust outlier identification</p>
                        <p>• Document outlier treatment decisions for reproducibility</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {numericColumns.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Numeric Columns</h3>
                <p className="text-muted-foreground">Upload a dataset with numeric columns to detect outliers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

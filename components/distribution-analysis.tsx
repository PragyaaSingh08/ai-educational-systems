"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { BarChart3, TrendingUp, Target, Activity, Eye, Download } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"

interface DistributionAnalysisProps {
  data: any[]
  columns: string[]
}

interface DistributionStats {
  column: string
  type: "numeric" | "categorical"
  distribution: "normal" | "skewed" | "uniform" | "bimodal" | "unknown"
  skewness: number
  kurtosis: number
  normality: number // 0-1 score
  bins: Array<{ range: string; count: number; percentage: number }>
  categories?: Array<{ value: string; count: number; percentage: number }>
}

export function DistributionAnalysis({ data, columns }: DistributionAnalysisProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>(columns[0] || "")
  const [binCount, setBinCount] = useState<number>(20)
  const [analysisType, setAnalysisType] = useState<"histogram" | "density" | "qq" | "box">("histogram")

  // Get numeric and categorical columns
  const numericColumns = columns.filter((col) => data.some((row) => typeof row[col] === "number" && !isNaN(row[col])))
  const categoricalColumns = columns.filter((col) => !numericColumns.includes(col))

  // Calculate distribution statistics
  const calculateDistributionStats = (columnName: string): DistributionStats => {
    const values = data.map((row) => row[columnName]).filter((val) => val !== null && val !== undefined && val !== "")
    const isNumeric = numericColumns.includes(columnName)

    if (isNumeric) {
      const numericValues = values.filter((val) => typeof val === "number" && !isNaN(val))
      if (numericValues.length === 0) {
        return {
          column: columnName,
          type: "numeric",
          distribution: "unknown",
          skewness: 0,
          kurtosis: 0,
          normality: 0,
          bins: [],
        }
      }

      // Calculate basic statistics
      const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
      const std = Math.sqrt(variance)

      // Calculate skewness
      const skewness =
        numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / numericValues.length

      // Calculate kurtosis
      const kurtosis =
        numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / numericValues.length - 3

      // Determine distribution type
      let distribution: DistributionStats["distribution"] = "unknown"
      if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 0.5) {
        distribution = "normal"
      } else if (Math.abs(skewness) > 1) {
        distribution = "skewed"
      } else if (Math.abs(kurtosis) > 2) {
        distribution = "bimodal"
      } else {
        distribution = "uniform"
      }

      // Calculate normality score (simplified)
      const normalityScore = Math.max(0, 1 - (Math.abs(skewness) + Math.abs(kurtosis)) / 4)

      // Create histogram bins
      const min = Math.min(...numericValues)
      const max = Math.max(...numericValues)
      const binSize = (max - min) / binCount
      const bins = Array.from({ length: binCount }, (_, i) => {
        const binStart = min + i * binSize
        const binEnd = min + (i + 1) * binSize
        const binValues = numericValues.filter(
          (val) => val >= binStart && (i === binCount - 1 ? val <= binEnd : val < binEnd),
        )

        return {
          range: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
          count: binValues.length,
          percentage: (binValues.length / numericValues.length) * 100,
        }
      })

      return {
        column: columnName,
        type: "numeric",
        distribution,
        skewness,
        kurtosis,
        normality: normalityScore,
        bins,
      }
    } else {
      // Categorical distribution
      const valueCounts = values.reduce(
        (acc, val) => {
          const key = String(val)
          acc[key] = (acc[key] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const categories = Object.entries(valueCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([value, count]) => ({
          value,
          count,
          percentage: (count / values.length) * 100,
        }))

      // Determine distribution type for categorical
      const uniqueCount = categories.length
      const totalCount = values.length
      let distribution: DistributionStats["distribution"] = "unknown"

      if (uniqueCount === totalCount) {
        distribution = "uniform"
      } else if (categories[0].percentage > 50) {
        distribution = "skewed"
      } else {
        distribution = "uniform"
      }

      return {
        column: columnName,
        type: "categorical",
        distribution,
        skewness: 0,
        kurtosis: 0,
        normality: 0,
        bins: [],
        categories,
      }
    }
  }

  const selectedColumnStats = selectedColumn ? calculateDistributionStats(selectedColumn) : null
  const allColumnStats = columns.map(calculateDistributionStats)

  // Prepare chart data based on analysis type
  const getChartData = () => {
    if (!selectedColumnStats) return []

    if (selectedColumnStats.type === "numeric") {
      switch (analysisType) {
        case "histogram":
          return selectedColumnStats.bins.map((bin, index) => ({
            name: bin.range,
            value: bin.count,
            percentage: bin.percentage,
            index,
          }))
        case "density":
          // Simplified density curve
          return selectedColumnStats.bins.map((bin, index) => ({
            name: index,
            value: bin.percentage,
            density: bin.percentage / 100,
          }))
        default:
          return selectedColumnStats.bins.map((bin, index) => ({
            name: bin.range,
            value: bin.count,
            index,
          }))
      }
    } else {
      return (
        selectedColumnStats.categories?.slice(0, 20).map((cat) => ({
          name: cat.value.length > 15 ? cat.value.substring(0, 15) + "..." : cat.value,
          value: cat.count,
          percentage: cat.percentage,
        })) || []
      )
    }
  }

  const chartData = getChartData()

  // Distribution summary for all columns
  const distributionSummary = {
    normal: allColumnStats.filter((s) => s.distribution === "normal").length,
    skewed: allColumnStats.filter((s) => s.distribution === "skewed").length,
    uniform: allColumnStats.filter((s) => s.distribution === "uniform").length,
    bimodal: allColumnStats.filter((s) => s.distribution === "bimodal").length,
    unknown: allColumnStats.filter((s) => s.distribution === "unknown").length,
  }

  const distributionSummaryData = Object.entries(distributionSummary).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    percentage: (count / allColumnStats.length) * 100,
  }))

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  // Export distribution analysis
  const exportAnalysis = () => {
    const exportData = {
      selectedColumn,
      statistics: selectedColumnStats,
      allColumns: allColumnStats,
      summary: distributionSummary,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `distribution_analysis_${selectedColumn}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Distribution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Normal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{distributionSummary.normal}</div>
            <div className="text-sm text-muted-foreground">columns</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Skewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{distributionSummary.skewed}</div>
            <div className="text-sm text-muted-foreground">columns</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-500" />
              Uniform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{distributionSummary.uniform}</div>
            <div className="text-sm text-muted-foreground">columns</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Bimodal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{distributionSummary.bimodal}</div>
            <div className="text-sm text-muted-foreground">columns</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-500" />
              Unknown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{distributionSummary.unknown}</div>
            <div className="text-sm text-muted-foreground">columns</div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribution Analysis Configuration
          </CardTitle>
          <CardDescription>Configure analysis parameters and visualization options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Column</label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {numericColumns.includes(selectedColumn) && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Analysis Type</label>
                  <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="histogram">Histogram</SelectItem>
                      <SelectItem value="density">Density Plot</SelectItem>
                      <SelectItem value="qq">Q-Q Plot</SelectItem>
                      <SelectItem value="box">Box Plot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bins</label>
                  <Select value={binCount.toString()} onValueChange={(value) => setBinCount(Number.parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={exportAnalysis} variant="outline" className="bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Analysis */}
      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          {selectedColumnStats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Visualization */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      {selectedColumn} Distribution
                    </CardTitle>
                    <CardDescription>
                      {selectedColumnStats.type === "numeric" ? analysisType : "Frequency"} visualization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      {selectedColumnStats.type === "numeric" ? (
                        analysisType === "density" ? (
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="density" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          </AreaChart>
                        ) : (
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                          </BarChart>
                        )
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Statistics */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Statistics
                    </CardTitle>
                    <CardDescription>Distribution characteristics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Distribution Type</div>
                        <Badge
                          variant={
                            selectedColumnStats.distribution === "normal"
                              ? "default"
                              : selectedColumnStats.distribution === "skewed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {selectedColumnStats.distribution}
                        </Badge>
                      </div>

                      {selectedColumnStats.type === "numeric" && (
                        <>
                          <div>
                            <div className="text-sm text-muted-foreground">Skewness</div>
                            <div className="font-mono text-lg">
                              {selectedColumnStats.skewness.toFixed(3)}
                              <Badge
                                variant={
                                  Math.abs(selectedColumnStats.skewness) < 0.5
                                    ? "default"
                                    : Math.abs(selectedColumnStats.skewness) < 1
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="ml-2"
                              >
                                {Math.abs(selectedColumnStats.skewness) < 0.5
                                  ? "Symmetric"
                                  : Math.abs(selectedColumnStats.skewness) < 1
                                    ? "Moderate"
                                    : "High"}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-muted-foreground">Kurtosis</div>
                            <div className="font-mono text-lg">
                              {selectedColumnStats.kurtosis.toFixed(3)}
                              <Badge
                                variant={
                                  Math.abs(selectedColumnStats.kurtosis) < 0.5
                                    ? "default"
                                    : Math.abs(selectedColumnStats.kurtosis) < 2
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="ml-2"
                              >
                                {selectedColumnStats.kurtosis > 0 ? "Heavy-tailed" : "Light-tailed"}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-muted-foreground">Normality Score</div>
                            <div className="font-mono text-lg">
                              {selectedColumnStats.normality.toFixed(3)}
                              <Badge
                                variant={
                                  selectedColumnStats.normality > 0.8
                                    ? "default"
                                    : selectedColumnStats.normality > 0.5
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="ml-2"
                              >
                                {selectedColumnStats.normality > 0.8
                                  ? "High"
                                  : selectedColumnStats.normality > 0.5
                                    ? "Moderate"
                                    : "Low"}
                              </Badge>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedColumnStats.type === "categorical" && selectedColumnStats.categories && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Top Categories</div>
                          <div className="space-y-2">
                            {selectedColumnStats.categories.slice(0, 5).map((cat, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="truncate max-w-24">{cat.value}</span>
                                <Badge variant="outline">{cat.percentage.toFixed(1)}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Distribution Types Overview
                </CardTitle>
                <CardDescription>Distribution of distribution types across all columns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionSummaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {distributionSummaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value} columns (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  {distributionSummaryData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Column Distribution Summary
                </CardTitle>
                <CardDescription>Quick overview of all column distributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {allColumnStats.map((stats, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm truncate max-w-32">{stats.column}</span>
                        <Badge variant="outline" className="text-xs">
                          {stats.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            stats.distribution === "normal"
                              ? "default"
                              : stats.distribution === "skewed"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {stats.distribution}
                        </Badge>
                        {stats.type === "numeric" && (
                          <span className="text-xs text-muted-foreground font-mono">{stats.normality.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Normality Comparison
              </CardTitle>
              <CardDescription>Normality scores across numeric columns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={allColumnStats
                    .filter((s) => s.type === "numeric")
                    .map((s) => ({
                      name: s.column.length > 15 ? s.column.substring(0, 15) + "..." : s.column,
                      normality: s.normality,
                      skewness: Math.abs(s.skewness),
                      kurtosis: Math.abs(s.kurtosis),
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="normality" fill="hsl(var(--chart-1))" name="Normality Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

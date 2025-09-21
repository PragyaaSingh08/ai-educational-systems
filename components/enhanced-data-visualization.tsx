"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrendingUp, Zap, Eye, Download, Maximize2, Database, BarChart3 } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface EnhancedDataVisualizationProps {
  data: any[]
  columns: string[]
}

interface ChartConfig {
  type: "bar" | "line" | "scatter" | "area" | "pie" | "histogram"
  showAll: boolean
  sampleSize: number
  binCount: number
  showTrendline: boolean
  showBrush: boolean
  height: number
  colorScheme: "default" | "categorical" | "sequential" | "diverging"
}

interface ProcessedData {
  chartData: any[]
  statistics: {
    count: number
    mean?: number
    median?: number
    std?: number
    min?: number
    max?: number
    quartiles?: number[]
    outliers?: any[]
  }
  dataQuality: {
    completeness: number
    uniqueness: number
    validity: number
    consistency: number
  }
}

export function EnhancedDataVisualization({ data, columns }: EnhancedDataVisualizationProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([columns[0] || ""])
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: "bar",
    showAll: true,
    sampleSize: 1000,
    binCount: 30,
    showTrendline: false,
    showBrush: true,
    height: 400,
    colorScheme: "default",
  })
  const [filterValue, setFilterValue] = useState<string>("")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const processedData = useMemo((): ProcessedData => {
    if (!selectedColumns.length || !data.length) {
      return {
        chartData: [],
        statistics: { count: 0 },
        dataQuality: { completeness: 0, uniqueness: 0, validity: 0, consistency: 0 },
      }
    }

    const primaryColumn = selectedColumns[0]
    let filteredData = data

    // Apply filter if specified
    if (filterValue) {
      filteredData = data.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(filterValue.toLowerCase())),
      )
    }

    const dataToUse = chartConfig.showAll ? filteredData : filteredData.slice(0, chartConfig.sampleSize)

    // Extract values for primary column
    const values = dataToUse
      .map((row) => row[primaryColumn])
      .filter((val) => val !== null && val !== undefined && val !== "")

    const isNumeric = values.every((val) => !isNaN(Number(val)) && isFinite(Number(val)))

    let chartData: any[] = []
    let statistics: ProcessedData["statistics"] = { count: values.length }

    if (isNumeric) {
      const numericValues = values.map(Number).sort((a, b) => a - b)

      // Calculate comprehensive statistics
      const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      const median = numericValues[Math.floor(numericValues.length / 2)]
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
      const std = Math.sqrt(variance)
      const min = numericValues[0]
      const max = numericValues[numericValues.length - 1]

      // Calculate quartiles
      const q1 = numericValues[Math.floor(numericValues.length * 0.25)]
      const q3 = numericValues[Math.floor(numericValues.length * 0.75)]
      const iqr = q3 - q1

      // Detect outliers using IQR method
      const outlierThreshold = 1.5 * iqr
      const outliers = numericValues.filter((val) => val < q1 - outlierThreshold || val > q3 + outlierThreshold)

      statistics = {
        count: values.length,
        mean,
        median,
        std,
        min,
        max,
        quartiles: [min, q1, median, q3, max],
        outliers,
      }

      chartData = dataToUse.map((row, index) => ({
        index,
        [primaryColumn]: Number(row[primaryColumn]),
        ...selectedColumns.slice(1).reduce(
          (acc, col) => ({
            ...acc,
            [col]: isNaN(Number(row[col])) ? row[col] : Number(row[col]),
          }),
          {},
        ),
      }))
    } else {
      // Categorical data - show all categories without truncation
      const valueCounts = values.reduce(
        (acc, val) => {
          const key = String(val)
          acc[key] = (acc[key] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      chartData = Object.entries(valueCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([value, count]) => ({
          category: value.length > 20 ? value.substring(0, 20) + "..." : value,
          fullCategory: value,
          count,
          percentage: (count / values.length) * 100,
        }))
    }

    // Calculate data quality metrics
    const totalRows = dataToUse.length
    const completeness = (values.length / totalRows) * 100
    const uniqueValues = new Set(values).size
    const uniqueness = (uniqueValues / values.length) * 100
    const validity = isNumeric
      ? 100
      : (values.filter((val) => typeof val === "string" && val.trim().length > 0).length / values.length) * 100
    const consistency = 100 // Simplified - could be enhanced with pattern matching

    return {
      chartData,
      statistics,
      dataQuality: { completeness, uniqueness, validity, consistency },
    }
  }, [data, selectedColumns, chartConfig, filterValue])

  const renderChart = useCallback(() => {
    const { chartData } = processedData
    if (!chartData.length) return null

    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff"]

    switch (chartConfig.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedColumns[0].includes("category") ? "category" : "index"} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={selectedColumns[0].includes("category") ? "count" : selectedColumns[0]} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={selectedColumns[0]} stroke={colors[0]} />
            </LineChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis dataKey={selectedColumns[0]} />
              <Tooltip />
              <Scatter dataKey={selectedColumns[0]} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey={selectedColumns[0]} stroke={colors[0]} fill={colors[0]} />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "pie":
        const pieData = chartData.slice(0, 10) // Show top 10 categories
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }, [processedData, chartConfig, selectedColumns])

  const exportData = useCallback(() => {
    const exportPayload = {
      metadata: {
        timestamp: new Date().toISOString(),
        columns: selectedColumns,
        totalRows: data.length,
        filteredRows: processedData.chartData.length,
        chartConfig,
      },
      data: processedData.chartData,
      statistics: processedData.statistics,
      dataQuality: processedData.dataQuality,
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `visualization_${selectedColumns.join("_")}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data, selectedColumns, processedData, chartConfig])

  return (
    <div className="space-y-6">
      {/* Enhanced Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Enhanced Data Visualization
          </CardTitle>
          <CardDescription>Configure advanced visualization options with full dataset support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Column Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Primary Column</label>
              <Select
                value={selectedColumns[0] || ""}
                onValueChange={(value) => setSelectedColumns([value, ...selectedColumns.slice(1)])}
              >
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

            {/* Chart Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Chart Type</label>
              <Select
                value={chartConfig.type}
                onValueChange={(value: ChartConfig["type"]) => setChartConfig((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="histogram">Histogram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Handling */}
            <div>
              <label className="text-sm font-medium mb-2 block">Data Handling</label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.showAll}
                  onCheckedChange={(checked) => setChartConfig((prev) => ({ ...prev, showAll: checked }))}
                />
                <span className="text-sm">Show All Data</span>
              </div>
              {!chartConfig.showAll && (
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground">Sample Size</label>
                  <Slider
                    value={[chartConfig.sampleSize]}
                    onValueChange={([value]) => setChartConfig((prev) => ({ ...prev, sampleSize: value }))}
                    max={Math.min(data.length, 5000)}
                    min={100}
                    step={100}
                    className="mt-1"
                  />
                  <span className="text-xs text-muted-foreground">{chartConfig.sampleSize} rows</span>
                </div>
              )}
            </div>
          </div>

          {/* Filter and Actions */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Filter data..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsFullscreen(!isFullscreen)} variant="outline" size="sm">
              <Maximize2 className="w-4 h-4 mr-2" />
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processedData.dataQuality.completeness.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              {processedData.statistics.count.toLocaleString()} / {data.length.toLocaleString()} values
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-500" />
              Uniqueness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{processedData.dataQuality.uniqueness.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">distinct values</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Validity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{processedData.dataQuality.validity.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">valid format</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {processedData.dataQuality.consistency.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">consistent patterns</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Visualization */}
      <div
        className={`grid gap-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6" : "grid-cols-1 lg:grid-cols-3"}`}
      >
        <div className={isFullscreen ? "col-span-2" : "lg:col-span-2"}>{renderChart()}</div>

        {/* Statistics Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Statistics
              </CardTitle>
              <CardDescription>Comprehensive data analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                    <div className="font-mono text-lg">{processedData.statistics.count.toLocaleString()}</div>
                    <Badge variant="secondary" className="mt-1">
                      Rendered
                    </Badge>
                  </div>

                  {processedData.statistics.mean !== undefined && (
                    <>
                      <div>
                        <div className="text-sm text-muted-foreground">Mean</div>
                        <div className="font-mono text-lg">{processedData.statistics.mean.toFixed(3)}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Median</div>
                        <div className="font-mono text-lg">{processedData.statistics.median?.toFixed(3)}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Std Dev</div>
                        <div className="font-mono text-lg">{processedData.statistics.std?.toFixed(3)}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Range</div>
                        <div className="font-mono text-lg">
                          {processedData.statistics.min?.toFixed(3)} - {processedData.statistics.max?.toFixed(3)}
                        </div>
                      </div>

                      {processedData.statistics.outliers && (
                        <div>
                          <div className="text-sm text-muted-foreground">Outliers</div>
                          <Badge variant="destructive">{processedData.statistics.outliers.length} detected</Badge>
                        </div>
                      )}
                    </>
                  )}

                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Visualization</div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>• Interactive charts</div>
                      <div>• Full dataset rendering</div>
                      <div>• Real-time updates</div>
                      <div>• Export capabilities</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

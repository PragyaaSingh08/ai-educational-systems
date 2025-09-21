"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calculator, TrendingUp, BarChart3, Target, Zap, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

interface StatisticalAnalysisEngineProps {
  data: any[]
  columns: string[]
}

interface ColumnStatistics {
  name: string
  type: "numeric" | "categorical"
  count: number
  missing: number
  unique: number
  mean?: number
  median?: number
  mode?: string | number
  std?: number
  min?: number
  max?: number
  q1?: number
  q3?: number
  skewness?: number
  kurtosis?: number
  nullPercentage: number
}

export function StatisticalAnalysisEngine({ data, columns }: StatisticalAnalysisEngineProps) {
  // Calculate comprehensive statistics for each column
  const calculateColumnStatistics = (columnName: string): ColumnStatistics => {
    const values = data.map((row) => row[columnName])
    const nonNullValues = values.filter((val) => val !== null && val !== undefined && val !== "")
    const missing = values.length - nonNullValues.length
    const unique = new Set(nonNullValues).size
    const nullPercentage = (missing / values.length) * 100

    // Check if column is numeric
    const numericValues = nonNullValues.filter((val) => typeof val === "number" && !isNaN(val))
    const isNumeric = numericValues.length > nonNullValues.length * 0.8 // 80% threshold

    if (isNumeric && numericValues.length > 0) {
      const sorted = numericValues.sort((a, b) => a - b)
      const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      const median = sorted[Math.floor(sorted.length / 2)]
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]

      // Calculate standard deviation
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
      const std = Math.sqrt(variance)

      // Calculate skewness (measure of asymmetry)
      const skewness =
        numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / numericValues.length

      // Calculate kurtosis (measure of tail heaviness)
      const kurtosis =
        numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / numericValues.length - 3

      return {
        name: columnName,
        type: "numeric",
        count: nonNullValues.length,
        missing,
        unique,
        mean,
        median,
        std,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        q1,
        q3,
        skewness,
        kurtosis,
        nullPercentage,
      }
    } else {
      // Categorical column
      const frequencies = nonNullValues.reduce(
        (acc, val) => {
          acc[val] = (acc[val] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const mode = Object.entries(frequencies).reduce((a, b) => (frequencies[a[0]] > frequencies[b[0]] ? a : b))[0]

      return {
        name: columnName,
        type: "categorical",
        count: nonNullValues.length,
        missing,
        unique,
        mode,
        nullPercentage,
      }
    }
  }

  const columnStats = columns.map(calculateColumnStatistics)
  const numericStats = columnStats.filter((stat) => stat.type === "numeric")
  const categoricalStats = columnStats.filter((stat) => stat.type === "categorical")

  // Overall dataset statistics
  const overallStats = {
    totalRows: data.length,
    totalColumns: columns.length,
    numericColumns: numericStats.length,
    categoricalColumns: categoricalStats.length,
    completeness:
      ((data.length * columns.length - columnStats.reduce((sum, stat) => sum + stat.missing, 0)) /
        (data.length * columns.length)) *
      100,
    duplicateRows: data.length - new Set(data.map((row) => JSON.stringify(row))).size,
  }

  // Prepare data for visualization
  const completenessData = columnStats.map((stat) => ({
    name: stat.name.length > 15 ? stat.name.substring(0, 15) + "..." : stat.name,
    completeness: 100 - stat.nullPercentage,
    missing: stat.nullPercentage,
  }))

  const distributionData = numericStats.slice(0, 6).map((stat) => ({
    name: stat.name.length > 10 ? stat.name.substring(0, 10) + "..." : stat.name,
    mean: stat.mean?.toFixed(2),
    median: stat.median?.toFixed(2),
    std: stat.std?.toFixed(2),
  }))

  return (
    <div className="space-y-6">
      {/* Overall Dataset Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Dataset Overview
          </CardTitle>
          <CardDescription>Comprehensive statistical summary of your dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Rows</div>
              <div className="text-2xl font-bold">{overallStats.totalRows.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Columns</div>
              <div className="text-2xl font-bold">{overallStats.totalColumns}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Numeric Features</div>
              <div className="text-2xl font-bold text-blue-600">{overallStats.numericColumns}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Categorical Features</div>
              <div className="text-2xl font-bold text-green-600">{overallStats.categoricalColumns}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Data Completeness</div>
              <div className="text-2xl font-bold text-purple-600">{overallStats.completeness.toFixed(1)}%</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Duplicate Rows</div>
              <div className="text-2xl font-bold text-red-600">{overallStats.duplicateRows}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Completeness Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Data Completeness by Column
          </CardTitle>
          <CardDescription>Percentage of non-missing values for each column</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completenessData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="completeness" fill="hsl(var(--chart-1))" name="Completeness %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Numeric Column Statistics */}
      {numericStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Numeric Column Statistics
            </CardTitle>
            <CardDescription>Detailed statistical measures for numeric features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Statistics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Column</th>
                      <th className="text-right p-2">Count</th>
                      <th className="text-right p-2">Mean</th>
                      <th className="text-right p-2">Median</th>
                      <th className="text-right p-2">Std Dev</th>
                      <th className="text-right p-2">Min</th>
                      <th className="text-right p-2">Max</th>
                      <th className="text-right p-2">Skewness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {numericStats.map((stat) => (
                      <tr key={stat.name} className="border-b">
                        <td className="p-2 font-medium">{stat.name}</td>
                        <td className="p-2 text-right font-mono">{stat.count}</td>
                        <td className="p-2 text-right font-mono">{stat.mean?.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{stat.median?.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{stat.std?.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{stat.min?.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{stat.max?.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <Badge
                            variant={
                              Math.abs(stat.skewness || 0) > 1
                                ? "destructive"
                                : Math.abs(stat.skewness || 0) > 0.5
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {stat.skewness?.toFixed(2)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Distribution Comparison Chart */}
              {distributionData.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Central Tendency Comparison</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={distributionData}>
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
                      <Line type="monotone" dataKey="mean" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Mean" />
                      <Line
                        type="monotone"
                        dataKey="median"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        name="Median"
                      />
                      <Line type="monotone" dataKey="std" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Std Dev" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categorical Column Statistics */}
      {categoricalStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Categorical Column Statistics
            </CardTitle>
            <CardDescription>Summary statistics for categorical features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoricalStats.map((stat) => (
                <div key={stat.name} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{stat.name}</h3>
                    <Badge variant="outline">{stat.type}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Values:</span>
                      <span className="font-mono">{stat.count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unique Values:</span>
                      <span className="font-mono">{stat.unique}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Most Frequent:</span>
                      <span className="font-mono text-right max-w-[100px] truncate">{stat.mode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Missing:</span>
                      <span className="font-mono">
                        {stat.missing} ({stat.nullPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Completeness</span>
                      <span>{(100 - stat.nullPercentage).toFixed(1)}%</span>
                    </div>
                    <Progress value={100 - stat.nullPercentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Data Quality Insights
          </CardTitle>
          <CardDescription>Automated insights about your dataset quality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overallStats.completeness < 90 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Data Completeness Warning</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Dataset completeness is {overallStats.completeness.toFixed(1)}%. Consider handling missing values
                    before analysis.
                  </p>
                </div>
              </div>
            )}

            {overallStats.duplicateRows > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100">Duplicate Rows Detected</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Found {overallStats.duplicateRows} duplicate rows. Consider removing duplicates for cleaner
                    analysis.
                  </p>
                </div>
              </div>
            )}

            {numericStats.some((stat) => Math.abs(stat.skewness || 0) > 2) && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Highly Skewed Data</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Some numeric columns show high skewness. Consider data transformation for better model performance.
                  </p>
                </div>
              </div>
            )}

            {overallStats.completeness >= 95 && overallStats.duplicateRows === 0 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Target className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">High Quality Dataset</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your dataset shows excellent quality with high completeness and no duplicates. Ready for analysis!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

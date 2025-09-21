"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Network, TrendingUp, AlertTriangle, Target, Zap } from "lucide-react"

interface CorrelationMatrixProps {
  data: any[]
  columns: string[]
}

interface CorrelationData {
  variable1: string
  variable2: string
  correlation: number
  strength: "weak" | "moderate" | "strong"
  direction: "positive" | "negative"
}

export function CorrelationMatrix({ data, columns }: CorrelationMatrixProps) {
  const [selectedMethod, setSelectedMethod] = useState<"pearson" | "spearman">("pearson")
  const [minCorrelation, setMinCorrelation] = useState<number>(0.3)

  // Get numeric columns for correlation analysis
  const numericColumns = columns.filter((col) => data.some((row) => typeof row[col] === "number" && !isNaN(row[col])))

  // Calculate correlation coefficient between two variables
  const calculateCorrelation = (col1: string, col2: string): number => {
    const pairs = data
      .map((row) => [row[col1], row[col2]])
      .filter(([x, y]) => typeof x === "number" && typeof y === "number" && !isNaN(x) && !isNaN(y))

    if (pairs.length < 2) return 0

    const n = pairs.length
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0)
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0)
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0)
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0)
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  // Calculate Spearman rank correlation
  const calculateSpearmanCorrelation = (col1: string, col2: string): number => {
    const pairs = data
      .map((row) => [row[col1], row[col2]])
      .filter(([x, y]) => typeof x === "number" && typeof y === "number" && !isNaN(x) && !isNaN(y))

    if (pairs.length < 2) return 0

    // Rank the values
    const rankX = pairs.map(([x]) => x).sort((a, b) => a - b)
    const rankY = pairs.map(([, y]) => y).sort((a, b) => a - b)

    const rankedPairs = pairs.map(([x, y]) => [rankX.indexOf(x) + 1, rankY.indexOf(y) + 1])

    // Calculate Pearson correlation on ranks
    const n = rankedPairs.length
    const sumX = rankedPairs.reduce((sum, [x]) => sum + x, 0)
    const sumY = rankedPairs.reduce((sum, [, y]) => sum + y, 0)
    const sumXY = rankedPairs.reduce((sum, [x, y]) => sum + x * y, 0)
    const sumX2 = rankedPairs.reduce((sum, [x]) => sum + x * x, 0)
    const sumY2 = rankedPairs.reduce((sum, [, y]) => sum + y * y, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  // Generate correlation matrix
  const correlationMatrix: number[][] = []
  const correlationPairs: CorrelationData[] = []

  for (let i = 0; i < numericColumns.length; i++) {
    correlationMatrix[i] = []
    for (let j = 0; j < numericColumns.length; j++) {
      const correlation =
        selectedMethod === "pearson"
          ? calculateCorrelation(numericColumns[i], numericColumns[j])
          : calculateSpearmanCorrelation(numericColumns[i], numericColumns[j])

      correlationMatrix[i][j] = correlation

      // Add to pairs list (avoid duplicates and self-correlation)
      if (i < j && Math.abs(correlation) >= minCorrelation) {
        const absCorr = Math.abs(correlation)
        correlationPairs.push({
          variable1: numericColumns[i],
          variable2: numericColumns[j],
          correlation,
          strength: absCorr >= 0.7 ? "strong" : absCorr >= 0.4 ? "moderate" : "weak",
          direction: correlation >= 0 ? "positive" : "negative",
        })
      }
    }
  }

  // Sort pairs by absolute correlation value
  correlationPairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

  // Get correlation color based on value
  const getCorrelationColor = (correlation: number): string => {
    const abs = Math.abs(correlation)
    if (abs >= 0.7) return correlation > 0 ? "bg-green-500" : "bg-red-500"
    if (abs >= 0.4) return correlation > 0 ? "bg-green-300" : "bg-red-300"
    if (abs >= 0.2) return correlation > 0 ? "bg-green-100" : "bg-red-100"
    return "bg-gray-100"
  }

  const getCorrelationTextColor = (correlation: number): string => {
    const abs = Math.abs(correlation)
    return abs >= 0.4 ? "text-white" : "text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Correlation Analysis Settings
          </CardTitle>
          <CardDescription>Configure correlation analysis parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correlation Method</label>
              <Select
                value={selectedMethod}
                onValueChange={(value: "pearson" | "spearman") => setSelectedMethod(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pearson">Pearson</SelectItem>
                  <SelectItem value="spearman">Spearman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Correlation</label>
              <Select
                value={minCorrelation.toString()}
                onValueChange={(value) => setMinCorrelation(Number.parseFloat(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1</SelectItem>
                  <SelectItem value="0.2">0.2</SelectItem>
                  <SelectItem value="0.3">0.3</SelectItem>
                  <SelectItem value="0.5">0.5</SelectItem>
                  <SelectItem value="0.7">0.7</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Dataset Info</div>
              <div className="text-sm text-muted-foreground">
                {numericColumns.length} numeric columns, {data.length} rows
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {numericColumns.length < 2 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Insufficient Numeric Data</h3>
                <p className="text-muted-foreground">Need at least 2 numeric columns for correlation analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Correlation Matrix Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Correlation Matrix ({selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)})
              </CardTitle>
              <CardDescription>Visual representation of correlations between numeric variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="w-32"></th>
                        {numericColumns.map((col) => (
                          <th key={col} className="w-24 p-1 text-xs font-medium text-center">
                            <div className="transform -rotate-45 origin-bottom-left whitespace-nowrap">
                              {col.length > 10 ? col.substring(0, 10) + "..." : col}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {numericColumns.map((row, i) => (
                        <tr key={row}>
                          <td className="p-1 text-xs font-medium text-right pr-2 max-w-32 truncate">{row}</td>
                          {numericColumns.map((col, j) => {
                            const correlation = correlationMatrix[i][j]
                            return (
                              <td key={col} className="w-24 h-12 p-0">
                                <div
                                  className={`w-full h-full flex items-center justify-center text-xs font-mono ${getCorrelationColor(correlation)} ${getCorrelationTextColor(correlation)}`}
                                  title={`${row} vs ${col}: ${correlation.toFixed(3)}`}
                                >
                                  {correlation.toFixed(2)}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500"></div>
                  <span>Strong Negative</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-300"></div>
                  <span>Moderate Negative</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-100 border"></div>
                  <span>Weak</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-300"></div>
                  <span>Moderate Positive</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500"></div>
                  <span>Strong Positive</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Correlations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Significant Correlations
              </CardTitle>
              <CardDescription>Variable pairs with correlation ≥ {minCorrelation} (sorted by strength)</CardDescription>
            </CardHeader>
            <CardContent>
              {correlationPairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No correlations found above the minimum threshold of {minCorrelation}
                </div>
              ) : (
                <div className="space-y-3">
                  {correlationPairs.slice(0, 20).map((pair, index) => (
                    <div
                      key={`${pair.variable1}-${pair.variable2}`}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-mono bg-background px-2 py-1 rounded">#{index + 1}</div>
                        <div>
                          <div className="font-medium text-sm">
                            {pair.variable1} ↔ {pair.variable2}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pair.strength} {pair.direction} correlation
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            pair.strength === "strong"
                              ? "default"
                              : pair.strength === "moderate"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {pair.correlation.toFixed(3)}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getCorrelationColor(pair.correlation)}`}></div>
                      </div>
                    </div>
                  ))}

                  {correlationPairs.length > 20 && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      Showing top 20 of {correlationPairs.length} significant correlations
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Correlation Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Correlation Insights
              </CardTitle>
              <CardDescription>Automated insights about variable relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationPairs.filter((p) => p.strength === "strong").length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-green-100">Strong Correlations Found</h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Found {correlationPairs.filter((p) => p.strength === "strong").length} strong correlations.
                        These variables may be redundant or have causal relationships.
                      </p>
                    </div>
                  </div>
                )}

                {correlationPairs.filter((p) => Math.abs(p.correlation) > 0.9).length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Multicollinearity Warning</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Very high correlations &gt;0.9 detected. Consider removing redundant features for machine
                        learning models.
                      </p>
                    </div>
                  </div>
                )}

                {correlationPairs.length === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Low Correlation Dataset</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Variables show low correlation with each other. This suggests good feature independence for
                        modeling.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {correlationPairs.filter((p) => p.direction === "positive").length}
                    </div>
                    <div className="text-sm text-muted-foreground">Positive Correlations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {correlationPairs.filter((p) => p.direction === "negative").length}
                    </div>
                    <div className="text-sm text-muted-foreground">Negative Correlations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {correlationPairs.filter((p) => p.strength === "strong").length}
                    </div>
                    <div className="text-sm text-muted-foreground">Strong Correlations</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

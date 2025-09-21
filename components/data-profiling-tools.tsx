"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { Search, Database, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Target, Zap } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface DataProfilingToolsProps {
  data: any[]
  columns: string[]
}

interface ColumnProfile {
  name: string
  type: "numeric" | "categorical" | "datetime" | "boolean" | "mixed"
  totalCount: number
  nullCount: number
  uniqueCount: number
  duplicateCount: number
  completeness: number
  cardinality: number
  dataQualityScore: number
  topValues: Array<{ value: any; count: number; percentage: number }>
  issues: string[]
  recommendations: string[]
}

export function DataProfilingTools({ data, columns }: DataProfilingToolsProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>(columns[0] || "")
  const [showOnlyIssues, setShowOnlyIssues] = useState(false)

  // Detect column data type
  const detectDataType = (columnName: string): ColumnProfile["type"] => {
    const values = data.map((row) => row[columnName]).filter((val) => val !== null && val !== undefined && val !== "")

    if (values.length === 0) return "mixed"

    const numericCount = values.filter((val) => typeof val === "number" && !isNaN(val)).length
    const booleanCount = values.filter((val) => typeof val === "boolean").length
    const dateCount = values.filter((val) => {
      if (typeof val === "string") {
        const date = new Date(val)
        return !isNaN(date.getTime()) && val.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/)
      }
      return false
    }).length

    const total = values.length

    if (numericCount / total > 0.8) return "numeric"
    if (booleanCount / total > 0.8) return "boolean"
    if (dateCount / total > 0.8) return "datetime"
    if (numericCount / total < 0.2 && dateCount / total < 0.2) return "categorical"

    return "mixed"
  }

  // Profile a single column
  const profileColumn = (columnName: string): ColumnProfile => {
    const allValues = data.map((row) => row[columnName])
    const nonNullValues = allValues.filter((val) => val !== null && val !== undefined && val !== "")
    const nullCount = allValues.length - nonNullValues.length
    const uniqueValues = new Set(nonNullValues)
    const uniqueCount = uniqueValues.size
    const duplicateCount = nonNullValues.length - uniqueCount
    const completeness = (nonNullValues.length / allValues.length) * 100
    const cardinality = (uniqueCount / nonNullValues.length) * 100

    // Get top values
    const valueCounts = nonNullValues.reduce(
      (acc, val) => {
        const key = String(val)
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topValues = Object.entries(valueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([value, count]) => ({
        value: value,
        count,
        percentage: (count / nonNullValues.length) * 100,
      }))

    const dataType = detectDataType(columnName)

    // Identify issues and recommendations
    const issues: string[] = []
    const recommendations: string[] = []

    if (completeness < 90) {
      issues.push(`High missing data: ${(100 - completeness).toFixed(1)}%`)
      recommendations.push("Consider imputation or removal of missing values")
    }

    if (dataType === "categorical" && uniqueCount > nonNullValues.length * 0.9) {
      issues.push("High cardinality categorical variable")
      recommendations.push("Consider grouping rare categories or using encoding techniques")
    }

    if (dataType === "numeric") {
      const numericValues = nonNullValues.filter((val) => typeof val === "number" && !isNaN(val))
      if (numericValues.length > 0) {
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        const std = Math.sqrt(
          numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length,
        )
        const outliers = numericValues.filter((val) => Math.abs(val - mean) > 3 * std)

        if (outliers.length > numericValues.length * 0.05) {
          issues.push(`Potential outliers detected: ${outliers.length}`)
          recommendations.push("Review outliers for data quality issues")
        }
      }
    }

    if (dataType === "mixed") {
      issues.push("Mixed data types detected")
      recommendations.push("Clean and standardize data types")
    }

    // Calculate data quality score
    let qualityScore = 100
    qualityScore -= (100 - completeness) * 0.5 // Missing data penalty
    qualityScore -= issues.length * 10 // Issue penalty
    if (dataType === "mixed") qualityScore -= 20 // Mixed type penalty
    qualityScore = Math.max(0, Math.min(100, qualityScore))

    return {
      name: columnName,
      type: dataType,
      totalCount: allValues.length,
      nullCount,
      uniqueCount,
      duplicateCount,
      completeness,
      cardinality,
      dataQualityScore: qualityScore,
      topValues,
      issues,
      recommendations,
    }
  }

  // Profile all columns
  const columnProfiles = columns.map(profileColumn)
  const filteredProfiles = showOnlyIssues
    ? columnProfiles.filter((profile) => profile.issues.length > 0)
    : columnProfiles

  // Overall dataset quality metrics
  const overallQuality = {
    averageCompleteness: columnProfiles.reduce((sum, profile) => sum + profile.completeness, 0) / columnProfiles.length,
    averageQualityScore:
      columnProfiles.reduce((sum, profile) => sum + profile.dataQualityScore, 0) / columnProfiles.length,
    totalIssues: columnProfiles.reduce((sum, profile) => sum + profile.issues.length, 0),
    columnsWithIssues: columnProfiles.filter((profile) => profile.issues.length > 0).length,
  }

  // Data type distribution
  const typeDistribution = columnProfiles.reduce(
    (acc, profile) => {
      acc[profile.type] = (acc[profile.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const typeDistributionData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    percentage: (count / columnProfiles.length) * 100,
  }))

  // Quality score distribution
  const qualityDistributionData = [
    {
      name: "Excellent (90-100)",
      count: columnProfiles.filter((p) => p.dataQualityScore >= 90).length,
      color: "#10B981",
    },
    {
      name: "Good (70-89)",
      count: columnProfiles.filter((p) => p.dataQualityScore >= 70 && p.dataQualityScore < 90).length,
      color: "#F59E0B",
    },
    {
      name: "Fair (50-69)",
      count: columnProfiles.filter((p) => p.dataQualityScore >= 50 && p.dataQualityScore < 70).length,
      color: "#EF4444",
    },
    { name: "Poor (<50)", count: columnProfiles.filter((p) => p.dataQualityScore < 50).length, color: "#DC2626" },
  ]

  const selectedProfile = columnProfiles.find((profile) => profile.name === selectedColumn)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      {/* Overall Quality Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{overallQuality.averageCompleteness.toFixed(1)}%</div>
            <Progress value={overallQuality.averageCompleteness} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{overallQuality.averageQualityScore.toFixed(0)}</div>
            <Progress value={overallQuality.averageQualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Total Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{overallQuality.totalIssues}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {overallQuality.columnsWithIssues} columns affected
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Clean Columns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {columnProfiles.length - overallQuality.columnsWithIssues}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {(((columnProfiles.length - overallQuality.columnsWithIssues) / columnProfiles.length) * 100).toFixed(0)}%
              of columns
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Type and Quality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Data Type Distribution
            </CardTitle>
            <CardDescription>Distribution of column data types in your dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {typeDistributionData.map((entry, index) => (
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
              {typeDistributionData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
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
              Quality Score Distribution
            </CardTitle>
            <CardDescription>Distribution of data quality scores across columns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={qualityDistributionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Column Profiling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Column Profiling
          </CardTitle>
          <CardDescription>Detailed analysis of individual columns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button variant={showOnlyIssues ? "outline" : "default"} onClick={() => setShowOnlyIssues(false)} size="sm">
              All Columns ({columnProfiles.length})
            </Button>
            <Button variant={showOnlyIssues ? "default" : "outline"} onClick={() => setShowOnlyIssues(true)} size="sm">
              Issues Only ({overallQuality.columnsWithIssues})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedColumn === profile.name ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedColumn(profile.name)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium truncate">{profile.name}</h3>
                  <Badge
                    variant={
                      profile.type === "numeric" ? "default" : profile.type === "categorical" ? "secondary" : "outline"
                    }
                  >
                    {profile.type}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quality Score:</span>
                    <span
                      className={`font-mono ${
                        profile.dataQualityScore >= 90
                          ? "text-green-600"
                          : profile.dataQualityScore >= 70
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {profile.dataQualityScore.toFixed(0)}
                    </span>
                  </div>
                  <Progress value={profile.dataQualityScore} className="h-2" />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completeness:</span>
                    <span className="font-mono">{profile.completeness.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unique Values:</span>
                    <span className="font-mono">{profile.uniqueCount.toLocaleString()}</span>
                  </div>

                  {profile.issues.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>
                        {profile.issues.length} issue{profile.issues.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Column Details */}
      {selectedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Column Details: {selectedProfile.name}
            </CardTitle>
            <CardDescription>Comprehensive analysis of the selected column</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="values">Top Values</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Data Type:</span>
                        <div className="font-medium">{selectedProfile.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Count:</span>
                        <div className="font-mono">{selectedProfile.totalCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unique Values:</span>
                        <div className="font-mono">{selectedProfile.uniqueCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Missing Values:</span>
                        <div className="font-mono">{selectedProfile.nullCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completeness:</span>
                        <div className="font-mono">{selectedProfile.completeness.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cardinality:</span>
                        <div className="font-mono">{selectedProfile.cardinality.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Data Quality Score</div>
                      <div className="flex items-center gap-3">
                        <Progress value={selectedProfile.dataQualityScore} className="flex-1" />
                        <span className="text-2xl font-bold">{selectedProfile.dataQualityScore.toFixed(0)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Completeness</div>
                      <div className="flex items-center gap-3">
                        <Progress value={selectedProfile.completeness} className="flex-1" />
                        <span className="text-lg font-mono">{selectedProfile.completeness.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="values">
                <div className="space-y-4">
                  <h4 className="font-medium">Most Frequent Values</h4>
                  <div className="space-y-2">
                    {selectedProfile.topValues.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono bg-background px-2 py-1 rounded">#{index + 1}</span>
                          <span className="font-medium max-w-48 truncate">{String(item.value)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{item.count} occurrences</span>
                          <Badge variant="outline">{item.percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="issues">
                <div className="space-y-4">
                  {selectedProfile.issues.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                      <h3 className="font-medium text-green-900 dark:text-green-100">No Issues Found</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        This column appears to have good data quality.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProfile.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-red-900 dark:text-red-100">Issue #{index + 1}</h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{issue}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recommendations">
                <div className="space-y-4">
                  {selectedProfile.recommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                      <h3 className="font-medium text-green-900 dark:text-green-100">No Recommendations</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        This column is in good shape and doesn't require immediate attention.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProfile.recommendations.map((recommendation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                        >
                          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-blue-900 dark:text-blue-100">
                              Recommendation #{index + 1}
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

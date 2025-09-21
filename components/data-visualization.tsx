"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from "recharts"
import { BarChart3 } from "lucide-react"

interface DataVisualizationProps {
  data: any[]
  columns: string[]
}

export function DataVisualization({ data, columns }: DataVisualizationProps) {
  // Get numeric columns for visualization
  const numericColumns = columns.filter((col) => data.some((row) => typeof row[col] === "number" && !isNaN(row[col])))

  // Get categorical columns
  const categoricalColumns = columns.filter((col) => !numericColumns.includes(col))

  // Prepare data for different chart types
  const prepareBarChartData = () => {
    if (numericColumns.length < 2) return []

    return data.slice(0, 50).map((row, index) => {
      const result: any = { name: `Row ${index + 1}` }
      numericColumns.slice(0, 3).forEach((col) => {
        result[col] = typeof row[col] === "number" && !isNaN(row[col]) ? row[col] : 0
      })
      return result
    })
  }

  const prepareScatterData = () => {
    if (numericColumns.length < 2) return []

    const xCol = numericColumns[0]
    const yCol = numericColumns[1]

    return data.slice(0, 100).map((row, index) => ({
      x: typeof row[xCol] === "number" && !isNaN(row[xCol]) ? row[xCol] : 0,
      y: typeof row[yCol] === "number" && !isNaN(row[yCol]) ? row[yCol] : 0,
      name: `Row ${index + 1}`,
    }))
  }

  const barChartData = prepareBarChartData()
  const scatterData = prepareScatterData()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"]

  // Calculate basic statistics
  const getColumnStats = (columnName: string) => {
    const values = data.map((row) => row[columnName]).filter((val) => typeof val === "number" && !isNaN(val))
    if (values.length === 0) return null

    const sorted = values.sort((a, b) => a - b)
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      count: values.length,
    }
  }

  return (
    <div className="space-y-6">
      {/* Dataset Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Dataset Overview
          </CardTitle>
          <CardDescription>Statistical summary and column analysis of your uploaded dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Rows</div>
              <div className="text-2xl font-bold">{data.length.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Columns</div>
              <div className="text-2xl font-bold">{columns.length}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Numeric Columns</div>
              <div className="text-2xl font-bold text-blue-600">{numericColumns.length}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Categorical Columns</div>
              <div className="text-2xl font-bold text-green-600">{categoricalColumns.length}</div>
            </div>
          </div>

          {/* Column Statistics */}
          {numericColumns.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Numeric Column Statistics</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {numericColumns.slice(0, 4).map((col) => {
                  const stats = getColumnStats(col)
                  if (!stats) return null

                  return (
                    <div key={col} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-2">{col}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          Min: <span className="font-mono">{stats.min.toFixed(2)}</span>
                        </div>
                        <div>
                          Max: <span className="font-mono">{stats.max.toFixed(2)}</span>
                        </div>
                        <div>
                          Mean: <span className="font-mono">{stats.mean.toFixed(2)}</span>
                        </div>
                        <div>
                          Median: <span className="font-mono">{stats.median.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Visualizations */}
      <Tabs defaultValue="bar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
        </TabsList>

        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Data Values Comparison</CardTitle>
              <CardDescription>Individual data values from the first 50 rows of your dataset</CardDescription>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    {numericColumns.slice(0, 3).map((col, index) => (
                      <Bar key={col} dataKey={col} fill={COLORS[index]} name={col} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No numeric data available for bar chart
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Data Trend Analysis</CardTitle>
              <CardDescription>Line chart showing data trends across the first 50 rows</CardDescription>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    {numericColumns.slice(0, 3).map((col, index) => (
                      <Line key={col} type="monotone" dataKey={col} stroke={COLORS[index]} strokeWidth={2} name={col} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No numeric data available for line chart
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scatter">
          <Card>
            <CardHeader>
              <CardTitle>Data Correlation Analysis</CardTitle>
              <CardDescription>
                Scatter plot showing relationship between {numericColumns[0]} and {numericColumns[1]} (first 100 rows)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="x" name={numericColumns[0]} />
                    <YAxis dataKey="y" name={numericColumns[1]} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter dataKey="y" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  Need at least 2 numeric columns for scatter plot
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

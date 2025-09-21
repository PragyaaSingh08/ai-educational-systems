"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { Wrench, Plus, Trash2, Download, TrendingUp, BarChart3, Target, CheckCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface FeatureEngineeringProps {
  data: any[]
  columns: string[]
}

interface FeatureTransformation {
  id: string
  name: string
  type: "scaling" | "encoding" | "binning" | "polynomial" | "interaction" | "aggregation" | "datetime"
  sourceColumns: string[]
  parameters: Record<string, any>
  preview: any[]
  applied: boolean
}

interface EngineeringStep {
  id: string
  transformation: FeatureTransformation
  order: number
}

export function FeatureEngineering({ data, columns }: FeatureEngineeringProps) {
  const [engineeringSteps, setEngineeringSteps] = useState<EngineeringStep[]>([])
  const [selectedTransformation, setSelectedTransformation] = useState<string>("")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [transformationParams, setTransformationParams] = useState<Record<string, any>>({})
  const [previewData, setPreviewData] = useState<any[]>([])

  // Get numeric and categorical columns
  const numericColumns = columns.filter((col) => data.some((row) => typeof row[col] === "number" && !isNaN(row[col])))
  const categoricalColumns = columns.filter((col) => !numericColumns.includes(col))

  // Available transformations
  const transformations = [
    {
      id: "standardization",
      name: "Standardization (Z-score)",
      type: "scaling",
      description: "Scale features to have mean=0 and std=1",
      applicableColumns: numericColumns,
      parameters: [],
    },
    {
      id: "normalization",
      name: "Min-Max Normalization",
      type: "scaling",
      description: "Scale features to range [0,1]",
      applicableColumns: numericColumns,
      parameters: [],
    },
    {
      id: "log_transform",
      name: "Log Transformation",
      type: "scaling",
      description: "Apply natural logarithm to reduce skewness",
      applicableColumns: numericColumns,
      parameters: [],
    },
    {
      id: "one_hot",
      name: "One-Hot Encoding",
      type: "encoding",
      description: "Convert categorical variables to binary columns",
      applicableColumns: categoricalColumns,
      parameters: [],
    },
    {
      id: "label_encoding",
      name: "Label Encoding",
      type: "encoding",
      description: "Convert categorical variables to numeric labels",
      applicableColumns: categoricalColumns,
      parameters: [],
    },
    {
      id: "binning",
      name: "Binning/Discretization",
      type: "binning",
      description: "Convert continuous variables to categorical bins",
      applicableColumns: numericColumns,
      parameters: [{ name: "bins", type: "number", default: 5, label: "Number of bins" }],
    },
    {
      id: "polynomial",
      name: "Polynomial Features",
      type: "polynomial",
      description: "Create polynomial and interaction features",
      applicableColumns: numericColumns,
      parameters: [{ name: "degree", type: "number", default: 2, label: "Polynomial degree" }],
    },
    {
      id: "interaction",
      name: "Feature Interaction",
      type: "interaction",
      description: "Create interaction terms between features",
      applicableColumns: numericColumns,
      parameters: [],
    },
  ]

  // Apply transformation preview
  const generatePreview = (transformationType: string, columns: string[], params: Record<string, any>) => {
    const sampleData = data.slice(0, 10) // Preview with first 10 rows
    let preview: any[] = []

    switch (transformationType) {
      case "standardization":
        preview = columns.map((col) => {
          const values = data.map((row) => row[col]).filter((val) => typeof val === "number" && !isNaN(val))
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length
          const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)

          return {
            column: `${col}_standardized`,
            original: sampleData.map((row) => row[col]),
            transformed: sampleData.map((row) =>
              typeof row[col] === "number" ? ((row[col] - mean) / std).toFixed(3) : null,
            ),
          }
        })
        break

      case "normalization":
        preview = columns.map((col) => {
          const values = data.map((row) => row[col]).filter((val) => typeof val === "number" && !isNaN(val))
          const min = Math.min(...values)
          const max = Math.max(...values)

          return {
            column: `${col}_normalized`,
            original: sampleData.map((row) => row[col]),
            transformed: sampleData.map((row) =>
              typeof row[col] === "number" ? ((row[col] - min) / (max - min)).toFixed(3) : null,
            ),
          }
        })
        break

      case "log_transform":
        preview = columns.map((col) => ({
          column: `${col}_log`,
          original: sampleData.map((row) => row[col]),
          transformed: sampleData.map((row) =>
            typeof row[col] === "number" && row[col] > 0 ? Math.log(row[col]).toFixed(3) : null,
          ),
        }))
        break

      case "binning":
        const bins = params.bins || 5
        preview = columns.map((col) => {
          const values = data.map((row) => row[col]).filter((val) => typeof val === "number" && !isNaN(val))
          const min = Math.min(...values)
          const max = Math.max(...values)
          const binSize = (max - min) / bins

          return {
            column: `${col}_binned`,
            original: sampleData.map((row) => row[col]),
            transformed: sampleData.map((row) => {
              if (typeof row[col] === "number") {
                const binIndex = Math.min(Math.floor((row[col] - min) / binSize), bins - 1)
                return `Bin_${binIndex + 1}`
              }
              return null
            }),
          }
        })
        break

      case "one_hot":
        preview = columns.map((col) => {
          const uniqueValues = [
            ...new Set(data.map((row) => row[col]).filter((val) => val !== null && val !== undefined)),
          ]
          const encodedColumns = uniqueValues.slice(0, 5).map((val) => `${col}_${val}`) // Show first 5 categories

          return {
            column: encodedColumns.join(", ") + (uniqueValues.length > 5 ? "..." : ""),
            original: sampleData.map((row) => row[col]),
            transformed: sampleData.map((row) => {
              const encoded = uniqueValues.slice(0, 5).map((val) => (row[col] === val ? 1 : 0))
              return encoded.join(", ") + (uniqueValues.length > 5 ? "..." : "")
            }),
          }
        })
        break

      case "polynomial":
        const degree = params.degree || 2
        if (columns.length >= 2) {
          const col1 = columns[0]
          const col2 = columns[1]
          preview = [
            {
              column: `${col1}_${col2}_poly${degree}`,
              original: sampleData.map((row) => `${row[col1]}, ${row[col2]}`),
              transformed: sampleData.map((row) => {
                if (typeof row[col1] === "number" && typeof row[col2] === "number") {
                  return Math.pow(row[col1] * row[col2], degree).toFixed(3)
                }
                return null
              }),
            },
          ]
        }
        break

      default:
        preview = []
    }

    return preview
  }

  // Add transformation step
  const addTransformationStep = () => {
    if (!selectedTransformation || selectedColumns.length === 0) return

    const transformation = transformations.find((t) => t.id === selectedTransformation)
    if (!transformation) return

    const preview = generatePreview(selectedTransformation, selectedColumns, transformationParams)

    const newStep: EngineeringStep = {
      id: Date.now().toString(),
      transformation: {
        id: selectedTransformation,
        name: transformation.name,
        type: transformation.type as any,
        sourceColumns: [...selectedColumns],
        parameters: { ...transformationParams },
        preview,
        applied: false,
      },
      order: engineeringSteps.length,
    }

    setEngineeringSteps([...engineeringSteps, newStep])

    // Reset form
    setSelectedTransformation("")
    setSelectedColumns([])
    setTransformationParams({})
  }

  // Remove transformation step
  const removeStep = (stepId: string) => {
    setEngineeringSteps(engineeringSteps.filter((step) => step.id !== stepId))
  }

  // Apply all transformations (simulation)
  const applyAllTransformations = () => {
    setEngineeringSteps((steps) =>
      steps.map((step) => ({ ...step, transformation: { ...step.transformation, applied: true } })),
    )
  }

  // Export feature engineering pipeline
  const exportPipeline = () => {
    const pipeline = {
      steps: engineeringSteps.map((step) => ({
        name: step.transformation.name,
        type: step.transformation.type,
        columns: step.transformation.sourceColumns,
        parameters: step.transformation.parameters,
      })),
      created: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(pipeline, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "feature_engineering_pipeline.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Feature importance simulation
  const featureImportance = numericColumns
    .slice(0, 8)
    .map((col, index) => ({
      name: col.length > 15 ? col.substring(0, 15) + "..." : col,
      importance: Math.random() * 100,
      rank: index + 1,
    }))
    .sort((a, b) => b.importance - a.importance)

  const selectedTransformationDetails = transformations.find((t) => t.id === selectedTransformation)

  return (
    <div className="space-y-6">
      {/* Feature Engineering Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Pipeline Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{engineeringSteps.length}</div>
            <div className="text-sm text-muted-foreground">
              {engineeringSteps.filter((s) => s.transformation.applied).length} applied
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Original Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{columns.length}</div>
            <div className="text-sm text-muted-foreground">
              {numericColumns.length} numeric, {categoricalColumns.length} categorical
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              New Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {engineeringSteps.reduce((sum, step) => sum + step.transformation.preview.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Generated features</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Total Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {columns.length + engineeringSteps.reduce((sum, step) => sum + step.transformation.preview.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">After engineering</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Engineering Interface */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Features</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="importance">Importance</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Create New Features
              </CardTitle>
              <CardDescription>Select transformation type and configure parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Transformation Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="transformation">Transformation Type</Label>
                      <Select value={selectedTransformation} onValueChange={setSelectedTransformation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transformation" />
                        </SelectTrigger>
                        <SelectContent>
                          {transformations.map((transform) => (
                            <SelectItem key={transform.id} value={transform.id}>
                              {transform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTransformationDetails && (
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1">{selectedTransformationDetails.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedTransformationDetails.description}</p>
                        <Badge variant="outline" className="mt-2">
                          {selectedTransformationDetails.type}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Select Columns</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                        {(selectedTransformationDetails?.applicableColumns || []).map((col) => (
                          <div key={col} className="flex items-center space-x-2">
                            <Checkbox
                              id={col}
                              checked={selectedColumns.includes(col)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedColumns([...selectedColumns, col])
                                } else {
                                  setSelectedColumns(selectedColumns.filter((c) => c !== col))
                                }
                              }}
                            />
                            <Label htmlFor={col} className="text-sm">
                              {col}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Parameters */}
                    {selectedTransformationDetails?.parameters.map((param) => (
                      <div key={param.name}>
                        <Label htmlFor={param.name}>{param.label}</Label>
                        <Input
                          id={param.name}
                          type={param.type}
                          value={transformationParams[param.name] || param.default}
                          onChange={(e) =>
                            setTransformationParams({
                              ...transformationParams,
                              [param.name]:
                                param.type === "number" ? Number.parseFloat(e.target.value) : e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {selectedTransformation && selectedColumns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Preview</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-3">New Column</th>
                              <th className="text-left p-3">Original Values</th>
                              <th className="text-left p-3">Transformed Values</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatePreview(selectedTransformation, selectedColumns, transformationParams).map(
                              (preview, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-3 font-medium">{preview.column}</td>
                                  <td className="p-3 font-mono text-xs">
                                    {preview.original
                                      .slice(0, 3)
                                      .map((val) => String(val))
                                      .join(", ")}
                                    ...
                                  </td>
                                  <td className="p-3 font-mono text-xs">
                                    {preview.transformed
                                      .slice(0, 3)
                                      .map((val) => String(val))
                                      .join(", ")}
                                    ...
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={addTransformationStep}
                  disabled={!selectedTransformation || selectedColumns.length === 0}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Feature Engineering Pipeline
              </CardTitle>
              <CardDescription>Review and manage your feature engineering steps</CardDescription>
            </CardHeader>
            <CardContent>
              {engineeringSteps.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pipeline Steps</h3>
                  <p className="text-muted-foreground">Add feature transformations to build your pipeline</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{engineeringSteps.length} steps in pipeline</div>
                    <Button onClick={applyAllTransformations} size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply All
                    </Button>
                  </div>

                  {engineeringSteps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{step.transformation.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {step.transformation.sourceColumns.join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {step.transformation.applied ? (
                            <Badge variant="default">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="font-medium mb-1">Generated Features:</div>
                        <div className="flex flex-wrap gap-1">
                          {step.transformation.preview.map((preview, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {preview.column}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="importance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Feature Importance Analysis
              </CardTitle>
              <CardDescription>Estimated feature importance for model performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureImportance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="importance" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featureImportance.slice(0, 6).map((feature, index) => (
                    <div key={feature.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      <Badge variant="outline">{feature.importance.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Export Pipeline
              </CardTitle>
              <CardDescription>Export your feature engineering pipeline for reuse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Pipeline Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Steps:</span>
                        <span>{engineeringSteps.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Applied Steps:</span>
                        <span>{engineeringSteps.filter((s) => s.transformation.applied).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">New Features:</span>
                        <span>
                          {engineeringSteps.reduce((sum, step) => sum + step.transformation.preview.length, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Original Features:</span>
                        <span>{columns.length}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Export Options</h4>
                    <div className="space-y-3">
                      <Button onClick={exportPipeline} className="w-full" disabled={engineeringSteps.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export as JSON
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled={engineeringSteps.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export as Python Code
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled={engineeringSteps.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Transformed Dataset
                      </Button>
                    </div>
                  </div>
                </div>

                {engineeringSteps.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-green-900 dark:text-green-100">Pipeline Ready</h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Your feature engineering pipeline is ready for export and can be applied to new datasets.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

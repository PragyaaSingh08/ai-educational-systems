"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Database, Target, Zap, AlertTriangle, CheckCircle, Upload } from "lucide-react"
import { DatasetUpload } from "@/components/dataset-upload"
import { EnhancedDataVisualization } from "@/components/enhanced-data-visualization"
import { StatisticalAnalysisEngine } from "@/components/statistical-analysis-engine"
import { CorrelationMatrix } from "@/components/correlation-matrix"
import { DataProfilingTools } from "@/components/data-profiling-tools"
import { FeatureEngineering } from "@/components/feature-engineering"
import { OutlierDetection } from "@/components/outlier-detection"
import { DistributionAnalysis } from "@/components/distribution-analysis"

export function EDADashboard() {
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const [datasetInfo, setDatasetInfo] = useState<any>(null)
  const [hasDataset, setHasDataset] = useState(false)

  const handleDatasetUploaded = (data: any[], info: any) => {
    setUploadedData(data)
    setDatasetInfo(info)
    setHasDataset(true)
  }

  const edaMetrics = [
    {
      label: "Dataset Size",
      value: hasDataset ? `${uploadedData.length.toLocaleString()} rows` : "No data",
      icon: Database,
      color: "text-blue-500",
    },
    {
      label: "Features",
      value: hasDataset ? `${datasetInfo?.columns?.length || 0} columns` : "0",
      icon: Target,
      color: "text-green-500",
    },
    {
      label: "Numeric Features",
      value: hasDataset ? `${datasetInfo?.numericColumns?.length || 0}` : "0",
      icon: BarChart3,
      color: "text-purple-500",
    },
    {
      label: "Analysis Status",
      value: hasDataset ? "Ready" : "Waiting",
      icon: hasDataset ? CheckCircle : AlertTriangle,
      color: hasDataset ? "text-green-500" : "text-yellow-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Dataset Upload */}
      <DatasetUpload onDatasetUploaded={handleDatasetUploaded} />

      {/* EDA Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {edaMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show EDA tools only after dataset upload */}
      {hasDataset && uploadedData.length > 0 && datasetInfo ? (
        <Tabs defaultValue="visualization" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="visualization">Enhanced Viz</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
            <TabsTrigger value="profiling">Profiling</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="outliers">Outliers</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="visualization">
            <EnhancedDataVisualization data={uploadedData} columns={datasetInfo.columns} />
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticalAnalysisEngine data={uploadedData} columns={datasetInfo.columns} />
          </TabsContent>

          <TabsContent value="correlation">
            <CorrelationMatrix data={uploadedData} columns={datasetInfo.columns} />
          </TabsContent>

          <TabsContent value="profiling">
            <DataProfilingTools data={uploadedData} columns={datasetInfo.columns} />
          </TabsContent>

          <TabsContent value="distribution">
            <DistributionAnalysis data={uploadedData} columns={datasetInfo.columns} />
          </TabsContent>

          <TabsContent value="outliers">
            <OutlierDetection data={uploadedData} columns={datasetInfo.columns} />
          </TabsContent>

          <TabsContent value="features">
            <FeatureEngineering data={uploadedData} columns={datasetInfo.columns} />
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Automated analysis and recommendations based on your dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">Enhanced Data Analysis</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Your dataset contains {uploadedData.length.toLocaleString()} rows with{" "}
                          {datasetInfo.columns.length} features. The enhanced visualization system now supports full
                          dataset rendering without truncation, providing complete insights into your data patterns.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-green-900 dark:text-green-100">Performance Optimizations</h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Advanced data processing with intelligent sampling, full dataset support, and interactive
                          features like brushing and zooming ensure optimal performance even with large datasets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-purple-900 dark:text-purple-100">Advanced Features</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          Comprehensive data quality metrics, statistical analysis, outlier detection, and export
                          capabilities provide professional-grade exploratory data analysis tools for educational and
                          research purposes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Ready for Enhanced Exploratory Data Analysis</h3>
                <p className="text-muted-foreground">
                  Upload your dataset above to start comprehensive data exploration with full dataset visualization
                  support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

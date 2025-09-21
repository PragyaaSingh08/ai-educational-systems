"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface DatasetInfo {
  name: string
  rows: number
  columns: string[]
  size: string
  type: string
}

interface DatasetUploadProps {
  onDatasetUploaded: (data: any[], info: DatasetInfo) => void
}

export function DatasetUpload({ onDatasetUploaded }: DatasetUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dataset, setDataset] = useState<DatasetInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        // Try to parse as number, otherwise keep as string
        row[header] = isNaN(Number(value)) ? value : Number(value)
      })
      return row
    })
  }

  const processFile = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const text = await file.text()
      const data = parseCSV(text)

      clearInterval(progressInterval)
      setUploadProgress(100)

      const info: DatasetInfo = {
        name: file.name,
        rows: data.length,
        columns: Object.keys(data[0] || {}),
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type || "text/csv",
      }

      setDataset(info)
      onDatasetUploaded(data, info)

      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (err) {
      setError("Failed to parse dataset. Please ensure it's a valid CSV file.")
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Dataset Upload
        </CardTitle>
        <CardDescription>Upload your own dataset (CSV, XLS, XLSX) for hybrid machine learning analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!dataset && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop your dataset here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drop your dataset here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing dataset...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {dataset && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">Dataset uploaded successfully!</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dataset Info</Label>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-mono">{dataset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rows:</span>
                    <span className="font-mono">{dataset.rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-mono">{dataset.size}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Columns ({dataset.columns.length})</Label>
                <div className="flex flex-wrap gap-1">
                  {dataset.columns.slice(0, 6).map((col, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                  {dataset.columns.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{dataset.columns.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDataset(null)
                setError(null)
              }}
              className="w-full"
            >
              Upload Different Dataset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FolderOpen, Users, CheckCircle, AlertTriangle, FileText, ImageIcon } from "lucide-react"
import { advancedFaceRecognition } from "@/lib/advanced-face-recognition"
import { studentDB } from "@/lib/student-database"

interface DatasetFile {
  name: string
  rollNumber: string
  images: File[]
  status: "pending" | "processing" | "success" | "error"
  message?: string
}

export function BulkDatasetUploader() {
  const [datasets, setDatasets] = useState<DatasetFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    total: number
    success: number
    failed: number
    details: string[]
  } | null>(null)

  const folderInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Handle folder upload with student images
  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Group files by student folder/name
    const studentGroups = new Map<string, File[]>()

    files.forEach((file) => {
      // Extract student info from file path
      const pathParts = file.webkitRelativePath.split("/")
      if (pathParts.length >= 2) {
        const studentFolder = pathParts[pathParts.length - 2] // Parent folder name
        const fileName = pathParts[pathParts.length - 1]

        // Only process image files
        if (file.type.startsWith("image/")) {
          if (!studentGroups.has(studentFolder)) {
            studentGroups.set(studentFolder, [])
          }
          studentGroups.get(studentFolder)!.push(file)
        }
      }
    })

    // Convert to dataset format
    const newDatasets: DatasetFile[] = Array.from(studentGroups.entries()).map(([folderName, images]) => {
      // Try to extract roll number from folder name (e.g., "John_Doe_CS001" or "CS001_John_Doe")
      const rollNumberMatch = folderName.match(/([A-Z]{2,}\d{3,}|\d{3,}[A-Z]{2,})/i)
      const rollNumber = rollNumberMatch ? rollNumberMatch[0] : folderName

      // Extract name (remove roll number from folder name)
      const name = folderName.replace(rollNumber, "").replace(/[_-]/g, " ").trim() || folderName

      return {
        name,
        rollNumber,
        images,
        status: "pending",
      }
    })

    setDatasets(newDatasets)
    setResults(null)
  }

  // Handle CSV metadata upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      const lines = csv.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

      // Update existing datasets with CSV metadata
      const updatedDatasets = datasets.map((dataset) => {
        const csvRow = lines.find((line) => {
          const values = line.split(",")
          const rollIndex = headers.indexOf("rollnumber") || headers.indexOf("roll_number") || headers.indexOf("id")
          return rollIndex >= 0 && values[rollIndex]?.trim() === dataset.rollNumber
        })

        if (csvRow) {
          const values = csvRow.split(",")
          const nameIndex = headers.indexOf("name") || headers.indexOf("student_name")
          const classIndex = headers.indexOf("class") || headers.indexOf("grade")
          const sectionIndex = headers.indexOf("section") || headers.indexOf("department")

          return {
            ...dataset,
            name: nameIndex >= 0 ? values[nameIndex]?.trim() || dataset.name : dataset.name,
            class: classIndex >= 0 ? values[classIndex]?.trim() : undefined,
            section: sectionIndex >= 0 ? values[sectionIndex]?.trim() : undefined,
          }
        }
        return dataset
      })

      setDatasets(updatedDatasets)
    }
    reader.readAsText(file)
  }

  // Process all datasets
  const processDatasets = async () => {
    if (datasets.length === 0) return

    setIsProcessing(true)
    setProgress(0)

    const results = {
      total: datasets.length,
      success: 0,
      failed: 0,
      details: [] as string[],
    }

    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i]

      // Update status to processing
      setDatasets((prev) => prev.map((d, idx) => (idx === i ? { ...d, status: "processing" } : d)))

      try {
        // Add student to database first
        const student = studentDB.addStudent({
          name: dataset.name,
          rollNumber: dataset.rollNumber,
          class: (dataset as any).class || "Unknown",
          section: (dataset as any).section || "Unknown",
        })

        // Train face recognition with images
        const trainingResult = await advancedFaceRecognition.trainStudent({
          studentId: student.id,
          name: dataset.name,
          rollNumber: dataset.rollNumber,
          images: dataset.images,
        })

        if (trainingResult.success) {
          results.success++
          results.details.push(`✅ ${dataset.name} (${dataset.rollNumber}): ${trainingResult.message}`)

          setDatasets((prev) =>
            prev.map((d, idx) => (idx === i ? { ...d, status: "success", message: trainingResult.message } : d)),
          )
        } else {
          results.failed++
          results.details.push(`❌ ${dataset.name} (${dataset.rollNumber}): ${trainingResult.message}`)

          setDatasets((prev) =>
            prev.map((d, idx) => (idx === i ? { ...d, status: "error", message: trainingResult.message } : d)),
          )
        }
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.details.push(`❌ ${dataset.name} (${dataset.rollNumber}): ${errorMessage}`)

        setDatasets((prev) => prev.map((d, idx) => (idx === i ? { ...d, status: "error", message: errorMessage } : d)))
      }

      // Update progress
      setProgress(((i + 1) / datasets.length) * 100)
    }

    setResults(results)
    setIsProcessing(false)
  }

  const clearDatasets = () => {
    setDatasets([])
    setResults(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Bulk Dataset Upload
          </CardTitle>
          <CardDescription>Upload face recognition datasets for multiple students at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Upload Student Folders</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a folder containing subfolders for each student with their face images
                </p>
                <Button onClick={() => folderInputRef.current?.click()} variant="outline" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Select Folder
                </Button>
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory=""
                  multiple
                  accept="image/*"
                  onChange={handleFolderUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Upload Student Metadata</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  CSV file with student details (name, roll_number, class, section)
                </p>
                <Button
                  onClick={() => csvInputRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                  disabled={datasets.length === 0}
                >
                  <FileText className="w-4 h-4" />
                  Upload CSV
                </Button>
                <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </CardContent>
            </Card>
          </div>

          {/* Dataset Preview */}
          {datasets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Detected Students ({datasets.length})
                </h3>
                <div className="flex gap-2">
                  <Button onClick={processDatasets} disabled={isProcessing} className="gap-2">
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Process All
                      </>
                    )}
                  </Button>
                  <Button onClick={clearDatasets} variant="outline">
                    Clear
                  </Button>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing datasets...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {datasets.map((dataset, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{dataset.name}</h4>
                          <p className="text-xs text-muted-foreground">{dataset.rollNumber}</p>
                        </div>
                        <Badge
                          variant={
                            dataset.status === "success"
                              ? "default"
                              : dataset.status === "error"
                                ? "destructive"
                                : dataset.status === "processing"
                                  ? "secondary"
                                  : "outline"
                          }
                          className="text-xs"
                        >
                          {dataset.status === "processing" && (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                          )}
                          {dataset.status === "success" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {dataset.status === "error" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {dataset.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <ImageIcon className="w-3 h-3" />
                        {dataset.images.length} images
                      </div>

                      {dataset.message && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{dataset.message}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {results && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    Processing Complete: {results.success} successful, {results.failed} failed out of {results.total}{" "}
                    total
                  </p>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {results.details.map((detail, index) => (
                      <p key={index}>{detail}</p>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Dataset Structure Guidelines:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Organize images in folders named: "StudentName_RollNumber" (e.g., "John_Doe_CS001")</li>
              <li>• Include 2-5 high-quality face images per student for best accuracy</li>
              <li>• Supported formats: JPG, PNG, WebP</li>
              <li>• CSV should have columns: name, roll_number, class, section</li>
              <li>• Images will be automatically quality-assessed during processing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

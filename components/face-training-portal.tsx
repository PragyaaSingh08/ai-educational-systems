"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, User, CheckCircle, AlertTriangle, Trash2, Download, Settings, Brain } from "lucide-react"
import { advancedFaceRecognition } from "@/lib/advanced-face-recognition"

interface CapturedImage {
  id: string
  url: string
  quality: number
  timestamp: Date
}

export function FaceTrainingPortal() {
  const [studentName, setStudentName] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [trainingResult, setTrainingResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsCapturing(true)
      }
    } catch (error) {
      console.error("Failed to start camera:", error)
    }
  }

  const stopCapture = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")!

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageUrl = canvas.toDataURL("image/jpeg", 0.8)
    const quality = 0.7 + Math.random() * 0.3 // Simulate quality assessment

    const newImage: CapturedImage = {
      id: `img_${Date.now()}`,
      url: imageUrl,
      quality,
      timestamp: new Date(),
    }

    setCapturedImages((prev) => [...prev, newImage])
  }

  const removeImage = (id: string) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const quality = 0.6 + Math.random() * 0.4 // Simulate quality assessment

        const newImage: CapturedImage = {
          id: `upload_${Date.now()}_${Math.random()}`,
          url: imageUrl,
          quality,
          timestamp: new Date(),
        }

        setCapturedImages((prev) => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
  }

  const trainStudent = async () => {
    if (!studentName || !rollNumber || capturedImages.length < 2) {
      setTrainingResult({
        success: false,
        message: "Please provide student name, roll number, and at least 2 face images",
      })
      return
    }

    setIsTraining(true)
    setTrainingResult(null)

    try {
      // Convert base64 images to File objects for training
      const imageFiles = await Promise.all(
        capturedImages.map(async (img, index) => {
          const response = await fetch(img.url)
          const blob = await response.blob()
          return new File([blob], `face_${index}.jpg`, { type: "image/jpeg" })
        }),
      )

      const result = await advancedFaceRecognition.trainStudent({
        studentId: `STU_${rollNumber}`,
        name: studentName,
        rollNumber,
        images: imageFiles,
      })

      setTrainingResult(result)

      if (result.success) {
        // Clear form after successful training
        setTimeout(() => {
          setStudentName("")
          setRollNumber("")
          setCapturedImages([])
          setTrainingResult(null)
        }, 3000)
      }
    } catch (error) {
      setTrainingResult({
        success: false,
        message: `Training failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsTraining(false)
    }
  }

  const exportTrainingData = () => {
    const data = advancedFaceRecognition.exportTrainingData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `face-training-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = advancedFaceRecognition.getTrainingStats()
  const highQualityImages = capturedImages.filter((img) => img.quality > 0.7)

  return (
    <div className="space-y-6">
      {/* Training Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-muted-foreground">Trained Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalDescriptors}</p>
                <p className="text-sm text-muted-foreground">Face Models</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.averageDescriptorsPerStudent.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Models/Student</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-orange-500" />
              <div>
                <Button onClick={exportTrainingData} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Student Information
          </CardTitle>
          <CardDescription>Enter student details for face recognition training</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter roll number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Face Image Capture
          </CardTitle>
          <CardDescription>
            Capture multiple face images from different angles for better recognition accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            {!isCapturing ? (
              <Button onClick={startCapture} className="gap-2">
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button onClick={captureImage} className="gap-2">
                  <Camera className="w-4 h-4" />
                  Capture Image
                </Button>
                <Button onClick={stopCapture} variant="destructive" className="gap-2">
                  Stop Camera
                </Button>
              </>
            )}

            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2 bg-transparent">
              <Upload className="w-4 h-4" />
              Upload Images
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <Badge variant="outline" className="gap-1">
              {capturedImages.length} images captured
            </Badge>
            <Badge variant="outline" className="gap-1">
              {highQualityImages.length} high quality
            </Badge>
          </div>

          {/* Camera Feed */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-auto max-h-96 object-cover"
              style={{ display: isCapturing ? "block" : "none" }}
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isCapturing && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center space-y-2">
                  <Camera className="w-12 h-12 mx-auto" />
                  <p>Click "Start Camera" to begin capturing face images</p>
                </div>
              </div>
            )}
          </div>

          {/* Captured Images Grid */}
          {capturedImages.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Captured Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {capturedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt="Captured face"
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button onClick={() => removeImage(image.id)} size="sm" variant="destructive" className="gap-1">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1">
                      <Progress value={image.quality * 100} className="h-1" />
                      <Badge variant={image.quality > 0.7 ? "default" : "secondary"} className="text-xs mt-1">
                        {(image.quality * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Face Recognition Training</CardTitle>
          <CardDescription>Train the AI model with the captured face images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trainingResult && (
            <Alert variant={trainingResult.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {trainingResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <AlertDescription>{trainingResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <Button
              onClick={trainStudent}
              disabled={isTraining || !studentName || !rollNumber || capturedImages.length < 2}
              className="gap-2"
            >
              {isTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Train Face Recognition
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              {capturedImages.length < 2 && "Need at least 2 images to start training"}
              {capturedImages.length >= 2 && !studentName && "Enter student name to continue"}
              {capturedImages.length >= 2 && studentName && !rollNumber && "Enter roll number to continue"}
              {capturedImages.length >= 2 && studentName && rollNumber && "Ready to train!"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, CameraOff, User, Users, AlertTriangle, CheckCircle, RefreshCw, Download } from "lucide-react"
import { studentDB, type Student } from "@/lib/student-database"
import { faceRecognitionService } from "@/lib/face-recognition-utils"

interface DetectedFace {
  id: string
  confidence: number
  name?: string
  student?: Student
  x: number
  y: number
  width: number
  height: number
}

interface RecognitionStats {
  totalFaces: number
  recognizedFaces: number
  unknownFaces: number
  averageConfidence: number
}

export function FacialRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([])
  const [stats, setStats] = useState<RecognitionStats>({
    totalFaces: 0,
    recognizedFaces: 0,
    unknownFaces: 0,
    averageConfidence: 0,
  })
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceMarked, setAttendanceMarked] = useState<Set<string>>(new Set())

  const detectFaces = async (imageData: ImageData): Promise<DetectedFace[]> => {
    if (!videoRef.current) return []

    try {
      const faceDetections = await faceRecognitionService.detectFaces(videoRef.current)

      const faces: DetectedFace[] = []

      for (const detection of faceDetections) {
        let matchedStudent: Student | null = null
        let studentName: string | undefined = undefined

        if (detection.descriptor) {
          matchedStudent = studentDB.findStudentByFaceDescriptor(detection.descriptor, 0.6)
          if (matchedStudent) {
            studentName = matchedStudent.name

            if (!attendanceMarked.has(matchedStudent.id)) {
              studentDB.markAttendance(matchedStudent.id, "face", detection.confidence)
              setAttendanceMarked((prev) => new Set(prev).add(matchedStudent.id))
              console.log(`[v0] Auto-marked attendance for ${matchedStudent.name}`)
            }
          }
        }

        faces.push({
          id: `face_${Date.now()}_${faces.length}`,
          confidence: detection.confidence,
          name: studentName,
          student: matchedStudent || undefined,
          x: detection.box.x,
          y: detection.box.y,
          width: detection.box.width,
          height: detection.box.height,
        })
      }

      return faces
    } catch (error) {
      console.error("[v0] Face detection error:", error)
      return []
    }
  }

  const clearDetectedFaces = () => {
    setDetectedFaces([])
    setAttendanceMarked(new Set())
    setStats({
      totalFaces: 0,
      recognizedFaces: 0,
      unknownFaces: 0,
      averageConfidence: 0,
    })
    console.log("[v0] Cleared all detected faces and attendance tracking")
  }

  const exportAttendanceData = () => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("Export functionality not available in server environment")
      return
    }

    try {
      const attendanceData = detectedFaces
        .filter((face) => face.student)
        .map((face) => ({
          studentId: face.student!.id,
          name: face.student!.name,
          rollNumber: face.student!.rollNumber,
          class: face.student!.class,
          section: face.student!.section,
          confidence: face.confidence,
          timestamp: new Date().toISOString(),
          position: { x: face.x, y: face.y },
        }))

      const dataStr = JSON.stringify(attendanceData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `facial-attendance-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      console.log("[v0] Exported enhanced attendance data with student details")
    } catch (error) {
      console.error("Failed to export attendance data:", error)
    }
  }

  const startCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Camera not available in this environment")
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      const constraints = {
        video: {
          width: { ideal: 640, min: 320, max: 1280 },
          height: { ideal: 480, min: 240, max: 720 },
          facingMode: "user",
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      }

      console.log("[v0] Requesting camera access with enhanced constraints...")
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Camera access granted successfully")

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          console.log("[v0] Video metadata loaded, starting playback")
          videoRef.current
            ?.play()
            .then(() => {
              console.log("[v0] Video playback started")
              setIsLoading(false)
            })
            .catch((playError) => {
              console.error("[v0] Video play error:", playError)
              setError("Failed to start video playback")
              setIsLoading(false)
            })
        }
        videoRef.current.onerror = (e) => {
          console.error("[v0] Video error:", e)
          setError("Failed to load video stream")
          setIsLoading(false)
        }
      }

      setStream(mediaStream)
      setIsActive(true)
    } catch (err: any) {
      console.error("[v0] Camera access error:", err)
      setIsLoading(false)

      if (err.name === "NotAllowedError") {
        setError(
          "Camera access denied. Please click the camera icon in your browser's address bar and allow camera access, then try again.",
        )
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera device and refresh the page.")
      } else if (err.name === "NotReadableError") {
        setError("Camera is already in use by another application. Please close other camera apps and try again.")
      } else if (err.name === "OverconstrainedError") {
        setError("Camera doesn't support the required settings. Trying with basic settings...")
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream
            videoRef.current.play()
          }
          setStream(basicStream)
          setIsActive(true)
          setError(null)
        } catch (basicErr) {
          setError("Failed to access camera with any settings.")
        }
      } else {
        setError(`Camera error: ${err.message || "Unknown error occurred"}`)
      }
    }
  }

  const stopCamera = () => {
    console.log("[v0] Stopping camera...")
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("[v0] Stopped track:", track.kind)
      })
      setStream(null)
    }
    setIsActive(false)
    setDetectedFaces([])
    setIsLoading(false)
  }

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== 4) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const faces = await detectFaces(imageData)
    setDetectedFaces(faces)

    const recognized = faces.filter((f) => f.student).length
    const unknown = faces.length - recognized
    const avgConfidence = faces.length > 0 ? faces.reduce((sum, f) => sum + f.confidence, 0) / faces.length : 0

    setStats({
      totalFaces: faces.length,
      recognizedFaces: recognized,
      unknownFaces: unknown,
      averageConfidence: avgConfidence,
    })

    faces.forEach((face) => {
      const isRecognized = !!face.student

      ctx.strokeStyle = isRecognized ? "#10b981" : "#ef4444"
      ctx.lineWidth = 2
      ctx.strokeRect(face.x, face.y, face.width, face.height)

      const label = face.student
        ? `${face.student.name} (${face.student.rollNumber})`
        : `Unknown (${(face.confidence * 100).toFixed(0)}%)`

      ctx.font = "14px sans-serif"
      const textMetrics = ctx.measureText(label)
      const labelWidth = textMetrics.width + 10
      const labelHeight = 20

      ctx.fillStyle = isRecognized ? "#10b981" : "#ef4444"
      ctx.fillRect(face.x, face.y - labelHeight, labelWidth, labelHeight)

      ctx.fillStyle = "white"
      ctx.fillText(label, face.x + 5, face.y - 5)
    })
  }

  useEffect(() => {
    let animationFrame: number

    if (isActive && videoRef.current?.readyState === 4) {
      const animate = () => {
        processFrame()
        animationFrame = requestAnimationFrame(animate)
      }
      animate()
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isActive])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Smart Facial Recognition
          </CardTitle>
          <CardDescription>AI-powered student recognition with automatic attendance marking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={isActive ? stopCamera : startCamera}
                variant={isActive ? "destructive" : "default"}
                className="gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : isActive ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </>
                )}
              </Button>

              {isActive && (
                <>
                  <Button onClick={clearDetectedFaces} variant="outline" className="gap-2 bg-transparent">
                    <RefreshCw className="w-4 h-4" />
                    Clear Results
                  </Button>

                  <Button
                    onClick={exportAttendanceData}
                    variant="outline"
                    className="gap-2 bg-transparent"
                    disabled={detectedFaces.filter((f) => f.student).length === 0}
                  >
                    <Download className="w-4 h-4" />
                    Export Attendance
                  </Button>
                </>
              )}

              {isActive && (
                <Badge variant="secondary" className="gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Recognition
                </Badge>
              )}
            </div>

            {error && (
              <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="relative bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-auto max-h-96 object-cover"
                style={{ display: isActive ? "block" : "none" }}
                muted
                playsInline
                autoPlay
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ display: isActive ? "block" : "none" }}
              />

              {!isActive && !isLoading && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Camera className="w-12 h-12 mx-auto" />
                    <p>Click "Start Camera" to begin student recognition</p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalFaces}</p>
                  <p className="text-sm text-muted-foreground">Total Faces</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.recognizedFaces}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.unknownFaces}</p>
                  <p className="text-sm text-muted-foreground">Unknown</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">%</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{(stats.averageConfidence * 100).toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isActive && detectedFaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recognition Results</CardTitle>
            <CardDescription>Real-time student recognition and attendance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detectedFaces.map((face) => (
                <div key={face.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        face.student ? "bg-green-100" : "bg-orange-100"
                      }`}
                    >
                      <User className={`w-5 h-5 ${face.student ? "text-green-600" : "text-orange-600"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{face.student ? face.student.name : "Unknown Person"}</p>
                      <p className="text-sm text-muted-foreground">
                        {face.student
                          ? `${face.student.rollNumber} • ${face.student.class}-${face.student.section}`
                          : `Position: (${Math.round(face.x)}, ${Math.round(face.y)})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={face.confidence > 0.8 ? "default" : "secondary"}>
                      {(face.confidence * 100).toFixed(0)}%
                    </Badge>
                    <Progress value={face.confidence * 100} className="w-20 h-2 mt-1" />
                    {face.student && attendanceMarked.has(face.student.id) && (
                      <Badge variant="outline" className="text-xs mt-1 bg-green-50 text-green-700">
                        Attendance Marked
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

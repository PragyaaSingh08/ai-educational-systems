"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, CameraOff, UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react"
import { studentDB } from "@/lib/student-database"

interface ScannedSession {
  sessionId: string
  classId: string
  sessionName: string
  timestamp: string
  expiresAt: string
}

export function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [scannedSession, setScannedSession] = useState<ScannedSession | null>(null)
  const [studentId, setStudentId] = useState("")
  const [attendanceMarked, setAttendanceMarked] = useState(false)

  const detectQRCode = (imageData: ImageData): string | null => {
    try {
      // Check for high contrast patterns that indicate QR code
      const hasQRPattern = checkForQRPattern(imageData)

      if (hasQRPattern) {
        // In a real implementation, this would use a QR code library
        // For demo purposes, we'll simulate successful detection
        const savedSession = localStorage.getItem("currentQRSession")
        if (savedSession) {
          const session = JSON.parse(savedSession)
          return session.qrData
        }
      }

      return null
    } catch (error) {
      console.error("[v0] QR detection error:", error)
      return null
    }
  }

  const checkForQRPattern = (imageData: ImageData): boolean => {
    const data = imageData.data
    let contrastCount = 0
    let blackPixels = 0
    let whitePixels = 0
    const sampleSize = Math.min(5000, data.length / 4)

    for (let i = 0; i < sampleSize * 4; i += 16) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3

      if (brightness < 80) {
        blackPixels++
      } else if (brightness > 180) {
        whitePixels++
      }

      if (brightness < 50 || brightness > 200) {
        contrastCount++
      }
    }

    // QR codes have high contrast and balanced black/white distribution
    const hasHighContrast = contrastCount > sampleSize * 0.4
    const hasBalancedDistribution = Math.abs(blackPixels - whitePixels) < sampleSize * 0.3

    return hasHighContrast && hasBalancedDistribution
  }

  const startScanning = async () => {
    try {
      setError(null)
      setIsLoading(true)

      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: { ideal: "environment" },
          focusMode: { ideal: "continuous" },
        },
        audio: false,
      }

      console.log("[v0] Starting QR scanner...")
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Camera access granted")

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              setIsLoading(false)
              console.log("[v0] Video playback started")
            })
            .catch((error) => {
              console.error("[v0] Play error:", error)
              setError("Failed to start video playback")
              setIsLoading(false)
            })
        }
      }

      setStream(mediaStream)
      setIsScanning(true)
    } catch (err: any) {
      console.error("[v0] Camera error:", err)
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
          setIsScanning(true)
          setError(null)
          setIsLoading(false)
        } catch (basicErr) {
          setError("Failed to access camera with any settings.")
        }
      } else {
        setError(`Camera error: ${err.message || "Unknown error occurred"}`)
      }
    }
  }

  const stopScanning = () => {
    console.log("[v0] Stopping scanner...")
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("[v0] Stopped track:", track.kind)
      })
      setStream(null)
    }
    setIsScanning(false)
    setIsLoading(false)
  }

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== 4) return

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const qrResult = detectQRCode(imageData)

    if (qrResult && !scannedSession) {
      try {
        const sessionData = JSON.parse(qrResult)

        // Validate session data
        if (sessionData.type === "attendance_session" && sessionData.sessionId) {
          setScannedSession({
            sessionId: sessionData.sessionId,
            classId: sessionData.classId,
            sessionName: sessionData.sessionName,
            timestamp: sessionData.timestamp,
            expiresAt: sessionData.expiresAt,
          })

          stopScanning()
          console.log("[v0] QR session detected:", sessionData.sessionId)

          // Visual feedback
          ctx.strokeStyle = "#10b981"
          ctx.lineWidth = 4
          ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100)
          ctx.fillStyle = "#10b981"
          ctx.font = "20px sans-serif"
          ctx.fillText("QR Code Detected!", 60, 40)
        }
      } catch (error) {
        console.error("[v0] Invalid QR data:", error)
      }
    }

    // Draw scanning frame
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.strokeRect(canvas.width * 0.15, canvas.height * 0.15, canvas.width * 0.7, canvas.height * 0.7)
    ctx.setLineDash([])
  }

  const markAttendance = () => {
    if (!scannedSession || !studentId.trim()) {
      setError("Please enter your Student ID")
      return
    }

    // Check if session is still valid
    const now = new Date()
    const expiresAt = new Date(scannedSession.expiresAt)

    if (now > expiresAt) {
      setError("This QR code has expired. Please ask your teacher for a new one.")
      return
    }

    const student = studentDB.getStudentByRollNumber(studentId.trim())
    if (!student) {
      setError("Student ID not found. Please check your ID and try again.")
      return
    }

    // Check if already marked today
    const today = new Date().toISOString().split("T")[0]
    const existingAttendance = studentDB.getAttendanceByDate(today).find((record) => record.studentId === student.id)

    if (existingAttendance) {
      setError(`${student.name} is already marked present for today.`)
      return
    }

    // Mark attendance
    const success = studentDB.markAttendance(student.id, "qr", 1.0)

    if (success) {
      setAttendanceMarked(true)
      setError(null)
      console.log("[v0] Attendance marked for:", student.name)

      // Reset after 3 seconds
      setTimeout(() => {
        setScannedSession(null)
        setStudentId("")
        setAttendanceMarked(false)
      }, 3000)
    } else {
      setError("Failed to mark attendance. Please try again.")
    }
  }

  const resetScanner = () => {
    setScannedSession(null)
    setStudentId("")
    setAttendanceMarked(false)
    setError(null)
  }

  useEffect(() => {
    let animationFrame: number

    if (isScanning && videoRef.current?.readyState === 4) {
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
  }, [isScanning, scannedSession])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  if (attendanceMarked) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">Attendance Marked!</h2>
            <p className="text-muted-foreground">
              Your attendance has been successfully recorded for {scannedSession?.sessionName}
            </p>
            <Badge variant="default" className="text-base px-4 py-2">
              Class: {scannedSession?.classId}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>Scan the QR code displayed by your teacher to mark your attendance</CardDescription>
        </CardHeader>
        <CardContent>
          {!scannedSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  onClick={isScanning ? stopScanning : startScanning}
                  variant={isScanning ? "destructive" : "default"}
                  className="gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : isScanning ? (
                    <>
                      <CameraOff className="w-4 h-4" />
                      Stop Scanner
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Start Scanner
                    </>
                  )}
                </Button>

                {isScanning && (
                  <Badge variant="secondary" className="gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Scanning for QR Code
                  </Badge>
                )}
              </div>

              <div className="relative bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96 object-cover"
                  style={{ display: isScanning ? "block" : "none" }}
                  muted
                  playsInline
                  autoPlay
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ display: isScanning ? "block" : "none" }}
                />

                {!isScanning && !isLoading && (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Camera className="w-12 h-12 mx-auto" />
                      <p>Click "Start Scanner" to scan QR code</p>
                      <p className="text-xs">Point camera at the QR code displayed by your teacher</p>
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

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">QR Code Detected!</h3>
                <div className="space-y-1 text-sm text-green-700">
                  <p>
                    <strong>Session:</strong> {scannedSession.sessionName}
                  </p>
                  <p>
                    <strong>Class:</strong> {scannedSession.classId}
                  </p>
                  <p>
                    <strong>Created:</strong> {new Date(scannedSession.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Enter your Student ID</Label>
                <Input
                  type="text"
                  id="studentId"
                  placeholder="e.g., 2024001, STU001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && markAttendance()}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={markAttendance} className="gap-2 flex-1">
                  <UserCheck className="w-4 h-4" />
                  Mark Attendance
                </Button>
                <Button onClick={resetScanner} variant="outline">
                  Scan Again
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

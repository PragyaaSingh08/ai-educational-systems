"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle, XCircle, User, Clock, Scan, AlertTriangle, UserCheck, Loader2 } from "lucide-react"
import { studentDB, type Student, type AttendanceRecord } from "@/lib/student-database"
import { faceRecognitionService } from "@/lib/face-recognition-utils"

interface StudentAttendanceScannerProps {
  sessionId?: string
  subject?: string
  onAttendanceMarked?: (record: AttendanceRecord, student: Student) => void
  className?: string
}

interface RecognitionResult {
  student: Student
  confidence: number
  timestamp: Date
}

export function StudentAttendanceScanner({
  sessionId = `session_${Date.now()}`,
  subject = "General",
  onAttendanceMarked,
  className,
}: StudentAttendanceScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [lastRecognition, setLastRecognition] = useState<RecognitionResult | null>(null)
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string>("")
  const [scanCount, setScanCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent attendance on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    const todayRecords = studentDB.getAttendanceByDate(today)
    setRecentAttendance(todayRecords.slice(-10))
  }, [])

  const startScanning = async () => {
    try {
      console.log("[v0] Starting attendance scanner...")
      setError("")

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setStream(mediaStream)
          setIsScanning(true)
          startFaceRecognition()
        }
      }
    } catch (error: any) {
      console.error("[v0] Camera error:", error)
      setError("Camera access denied. Please allow camera access and try again.")
    }
  }

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current)
      recognitionIntervalRef.current = null
    }

    setIsScanning(false)
    setIsProcessing(false)
    console.log("[v0] Attendance scanner stopped")
  }

  const startFaceRecognition = () => {
    // Run face recognition every 2 seconds
    recognitionIntervalRef.current = setInterval(async () => {
      if (!isProcessing && videoRef.current && canvasRef.current) {
        await performFaceRecognition()
      }
    }, 2000)
  }

  const performFaceRecognition = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    setIsProcessing(true)
    setScanCount((prev) => prev + 1)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = canvas.toDataURL("image/jpeg", 0.8)

      // Extract face descriptor from current frame
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = async () => {
        try {
          const descriptor = await faceRecognitionService.extractFaceDescriptor(img)

          if (descriptor) {
            // Find matching student
            const matchedStudent = studentDB.findStudentByFaceDescriptor(Array.from(descriptor), 0.6)

            if (matchedStudent) {
              const confidence = 0.85 + Math.random() * 0.1 // Simulate confidence score

              console.log("[v0] Student recognized:", matchedStudent.name, "Confidence:", confidence)

              // Check if already marked today
              const today = new Date().toISOString().split("T")[0]
              const existingRecord = studentDB
                .getAttendanceByDate(today)
                .find((record) => record.studentId === matchedStudent.id)

              if (!existingRecord) {
                // Mark attendance
                const attendanceRecord = studentDB.markAttendance(matchedStudent.id, "face", confidence, subject)

                setLastRecognition({
                  student: matchedStudent,
                  confidence,
                  timestamp: new Date(),
                })

                // Update recent attendance list
                setRecentAttendance((prev) => [attendanceRecord, ...prev.slice(0, 9)])

                onAttendanceMarked?.(attendanceRecord, matchedStudent)

                // Stop scanning after successful recognition
                setTimeout(() => {
                  stopScanning()
                }, 3000)
              } else {
                console.log("[v0] Student already marked present today:", matchedStudent.name)
                setError(`${matchedStudent.name} is already marked present today`)
                setTimeout(() => setError(""), 3000)
              }
            }
          }
        } catch (error) {
          console.error("[v0] Face recognition error:", error)
        }
      }

      img.src = imageData
    } catch (error) {
      console.error("[v0] Recognition processing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStudentByRecord = (record: AttendanceRecord): Student | null => {
    return studentDB.getStudent(record.studentId)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Scanner Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            Student Attendance Scanner
          </CardTitle>
          <CardDescription>Students can scan their face to mark attendance for {subject}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isScanning ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
                  <p className="text-muted-foreground mb-4">
                    Click the button below to start the face recognition scanner
                  </p>
                </div>
                <Button onClick={startScanning} size="lg" className="gap-2">
                  <Camera className="w-5 h-5" />
                  Start Face Scanner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera View */}
                <div className="relative mx-auto max-w-md">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg border-2 border-primary/30"
                  />

                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none">
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary"></div>

                    {/* Processing Indicator */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-white/90 rounded-lg p-3 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm font-medium">Scanning...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Scanner Status */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-4">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      Session: {sessionId.slice(-6)}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Scan className="w-3 h-3" />
                      Scans: {scanCount}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">Position your face in the center of the frame</p>

                  <Button onClick={stopScanning} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <XCircle className="w-4 h-4" />
                    Stop Scanner
                  </Button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Recognition */}
            {lastRecognition && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-700">Attendance Marked!</h4>
                    <p className="text-sm text-green-600">
                      {lastRecognition.student.name} ({lastRecognition.student.rollNumber})
                    </p>
                    <p className="text-xs text-green-500">
                      Confidence: {Math.round(lastRecognition.confidence * 100)}% •
                      {lastRecognition.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Recent Attendance
          </CardTitle>
          <CardDescription>Latest attendance records from today</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => {
                const student = getStudentByRecord(record)
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{student?.name || "Unknown Student"}</p>
                        <p className="text-sm text-muted-foreground">
                          {student?.rollNumber} • {student?.class}-{student?.section}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Present
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {record.time}
                      </Badge>
                      {record.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(record.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

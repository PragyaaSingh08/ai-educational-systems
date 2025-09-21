"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Camera, CameraOff, UserCheck, Users, Clock, AlertTriangle, Download, Trash2, Plus } from "lucide-react"
import { studentDB } from "@/lib/student-database"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  timestamp: Date
  status: "present" | "late"
}

interface AttendanceSession {
  id: string
  classId: string
  sessionName: string
  qrCode: string
  createdAt: Date
  isActive: boolean
}

export function QRAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [classId, setClassId] = useState("")
  const [sessionName, setSessionName] = useState("")
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [lastScan, setLastScan] = useState<string | null>(null)

  const generateSessionQRCode = () => {
    if (!classId || !sessionName) {
      setError("Please enter both Class ID and Session Name")
      return
    }

    const sessionId = `session_${Date.now()}`
    const qrData = JSON.stringify({
      sessionId,
      classId,
      sessionName,
      timestamp: new Date().toISOString(),
      type: "attendance_session",
    })

    const session: AttendanceSession = {
      id: sessionId,
      classId,
      sessionName,
      qrCode: qrData,
      createdAt: new Date(),
      isActive: true,
    }

    setCurrentSession(session)
    setError(null)
    console.log("[v0] Generated attendance session QR code")
  }

  const detectSessionQRCode = (imageData: ImageData): string | null => {
    try {
      if (!currentSession) return null

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      canvas.width = imageData.width
      canvas.height = imageData.height
      ctx.putImageData(imageData, 0, 0)

      const hasHighContrast = checkForHighContrastPattern(imageData)

      if (hasHighContrast && currentSession.isActive) {
        return currentSession.qrCode
      }

      return null
    } catch (error) {
      console.error("[v0] QR detection error:", error)
      return null
    }
  }

  const checkForHighContrastPattern = (imageData: ImageData): boolean => {
    const data = imageData.data
    let contrastCount = 0
    const sampleSize = Math.min(10000, data.length / 4)

    for (let i = 0; i < sampleSize * 4; i += 16) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3

      if (brightness < 50 || brightness > 200) {
        contrastCount++
      }
    }

    return contrastCount > sampleSize * 0.3
  }

  const startScanning = async () => {
    if (!currentSession) {
      setError("Please generate a session QR code first")
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      const constraints = {
        video: {
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
          facingMode: { ideal: "environment" },
          focusMode: { ideal: "continuous" },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      }

      console.log("[v0] Starting QR scanner for student attendance...")
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] QR scanner camera access granted")

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          console.log("[v0] QR scanner video loaded")
          videoRef.current
            ?.play()
            .then(() => {
              console.log("[v0] QR scanner video playback started")
              setIsLoading(false)
            })
            .catch((playError) => {
              console.error("[v0] QR scanner play error:", playError)
              setError("Failed to start video playback")
              setIsLoading(false)
            })
        }
      }

      setStream(mediaStream)
      setIsScanning(true)
    } catch (err: any) {
      console.error("[v0] QR scanner camera error:", err)
      setIsLoading(false)
      setError(`Camera error: ${err.message || "Unknown error occurred"}`)
    }
  }

  const stopScanning = () => {
    console.log("[v0] Stopping QR scanner...")
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("[v0] Stopped QR scanner track:", track.kind)
      })
      setStream(null)
    }
    setIsScanning(false)
    setIsLoading(false)
  }

  const processQRFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning || !currentSession) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== 4) return

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const qrResult = detectSessionQRCode(imageData)

    if (qrResult) {
      setLastScan(qrResult)
      promptStudentIdentification()

      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 3
      ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100)

      ctx.fillStyle = "#10b981"
      ctx.font = "16px sans-serif"
      ctx.fillText("Session QR Detected!", 60, 40)
    }

    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6)
    ctx.setLineDash([])
  }

  const promptStudentIdentification = () => {
    const studentId = prompt("Enter your Student ID:")
    if (!studentId) return

    const student = studentDB.getStudentByRollNumber(studentId)
    if (!student) {
      alert("Student ID not found. Please check your ID and try again.")
      return
    }

    markAttendance(student.rollNumber, student.name)
  }

  const markAttendance = (studentId: string, studentName: string) => {
    if (!currentSession) return

    const existingRecord = attendanceRecords.find(
      (record) =>
        record.studentId === studentId && new Date(record.timestamp).toDateString() === new Date().toDateString(),
    )

    if (!existingRecord) {
      const currentTime = new Date()
      const sessionStartTime = currentSession.createdAt
      const timeDiff = currentTime.getTime() - sessionStartTime.getTime()
      const isLate = timeDiff > 10 * 60 * 1000

      const newRecord: AttendanceRecord = {
        id: `att_${Date.now()}`,
        studentId,
        studentName,
        timestamp: currentTime,
        status: isLate ? "late" : "present",
      }

      setAttendanceRecords((prev) => [newRecord, ...prev])

      const student = studentDB.getStudentByRollNumber(studentId)
      if (student) {
        studentDB.markAttendance(student.id, "qr", 1.0)
      }

      console.log("[v0] Attendance marked for:", studentName)
      alert(`✅ Attendance marked for ${studentName}`)
    } else {
      alert(`${studentName} is already marked present for today.`)
    }
  }

  const generateVisualQRCode = (data: string) => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="white"/>
        <rect x="30" y="30" width="60" height="60" fill="black"/>
        <rect x="45" y="45" width="30" height="30" fill="white"/>
        <rect x="210" y="30" width="60" height="60" fill="black"/>
        <rect x="225" y="45" width="30" height="30" fill="white"/>
        <rect x="30" y="210" width="60" height="60" fill="black"/>
        <rect x="45" y="225" width="30" height="30" fill="white"/>
        <rect x="120" y="30" width="15" height="15" fill="black"/>
        <rect x="150" y="30" width="15" height="15" fill="black"/>
        <rect x="120" y="60" width="15" height="15" fill="black"/>
        <rect x="180" y="60" width="15" height="15" fill="black"/>
        <rect x="120" y="90" width="15" height="15" fill="black"/>
        <rect x="150" y="90" width="15" height="15" fill="black"/>
        <rect x="180" y="90" width="15" height="15" fill="black"/>
        <text x="150" y="285" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="black">Scan to Mark Attendance</text>
      </svg>
    `)}`
  }

  const clearAttendanceRecords = () => {
    setAttendanceRecords([])
    setLastScan(null)
    console.log("[v0] Cleared all attendance records")
  }

  const exportAttendanceRecords = () => {
    const exportData = attendanceRecords.map((record) => ({
      studentId: record.studentId,
      studentName: record.studentName,
      timestamp: record.timestamp.toISOString(),
      status: record.status,
      classId: currentSession?.classId || classId,
      sessionName: currentSession?.sessionName || sessionName,
    }))

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `attendance-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    console.log("[v0] Exported attendance records")
  }

  const endSession = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, isActive: false })
      stopScanning()
      console.log("[v0] Ended attendance session")
    }
  }

  useEffect(() => {
    let animationFrame: number

    if (isScanning && videoRef.current?.readyState === 4) {
      const animate = () => {
        processQRFrame()
        animationFrame = requestAnimationFrame(animate)
      }
      animate()
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isScanning, currentSession])

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
            <Plus className="w-5 h-5 text-primary" />
            Create Attendance Session
          </CardTitle>
          <CardDescription>Generate a QR code for students to scan and mark their attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classId">Class ID</Label>
                <Input
                  type="text"
                  id="classId"
                  placeholder="e.g., CS101, MATH201"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={currentSession?.isActive}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  type="text"
                  id="sessionName"
                  placeholder="e.g., Morning Lecture, Lab Session"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  disabled={currentSession?.isActive}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {!currentSession?.isActive ? (
                <Button onClick={generateSessionQRCode} className="gap-2">
                  <QrCode className="w-4 h-4" />
                  Generate Session QR Code
                </Button>
              ) : (
                <Button onClick={endSession} variant="destructive" className="gap-2">
                  <CameraOff className="w-4 h-4" />
                  End Session
                </Button>
              )}

              {currentSession?.isActive && (
                <Badge variant="default" className="gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Session Active
                </Badge>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session QR Code</CardTitle>
            <CardDescription>
              Display this QR code for students to scan. Students will scan this code and then enter their Student ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white border-2 border-dashed border-primary rounded-lg">
                <img
                  src={generateVisualQRCode(currentSession.qrCode) || "/placeholder.svg"}
                  alt="Session QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-lg">{currentSession.sessionName}</p>
                <p className="text-sm text-muted-foreground">Class: {currentSession.classId}</p>
                <p className="text-xs text-muted-foreground">Created: {currentSession.createdAt.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentSession?.isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Student Attendance Scanner
            </CardTitle>
            <CardDescription>Students: Scan the session QR code displayed by your teacher</CardDescription>
          </CardHeader>
          <CardContent>
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
                    Scanning for Session QR Code
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
                      <QrCode className="w-12 h-12 mx-auto" />
                      <p>Click "Start Scanner" to scan the session QR code</p>
                      <p className="text-xs">Point camera at the QR code displayed by your teacher</p>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p>Initializing scanner...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{attendanceRecords.length}</p>
                <p className="text-sm text-muted-foreground">Total Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{attendanceRecords.filter((r) => r.status === "present").length}</p>
                <p className="text-sm text-muted-foreground">On Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{attendanceRecords.filter((r) => r.status === "late").length}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Session Attendance</span>
              <div className="flex gap-2">
                <Button onClick={exportAttendanceRecords} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  onClick={clearAttendanceRecords}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </div>
            </CardTitle>
            <CardDescription>Real-time attendance records for this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-muted-foreground">ID: {record.studentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={record.status === "present" ? "default" : "secondary"}>
                      {record.status === "present" ? "On Time" : "Late"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{record.timestamp.toLocaleTimeString()}</p>
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

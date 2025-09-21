"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  QrCode,
  Camera,
  CameraOff,
  Users,
  Clock,
  MapPin,
  Download,
  Share2,
  Settings,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  BarChart3,
} from "lucide-react"
import { advancedQRSystem, type QRAttendanceSession, type QRAttendanceRecord } from "@/lib/advanced-qr-system"
import { notificationService } from "@/lib/notification-system"

export function EnhancedQRAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Session creation state
  const [classId, setClassId] = useState("")
  const [sessionName, setSessionName] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [allowLateEntry, setAllowLateEntry] = useState(true)
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState(10)
  const [maxAttendees, setMaxAttendees] = useState<number | undefined>()
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")

  // Current session state
  const [currentSession, setCurrentSession] = useState<QRAttendanceSession | null>(null)
  const [scannedSessionId, setScannedSessionId] = useState<string | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<QRAttendanceRecord[]>([])

  // Statistics
  const [sessionStats, setSessionStats] = useState<any>(null)

  const createSession = () => {
    if (!classId || !sessionName || !teacherName) {
      setError("Please fill in all required fields")
      return
    }

    try {
      const session = advancedQRSystem.createSession({
        classId,
        sessionName,
        teacherId: `teacher_${Date.now()}`,
        teacherName,
        durationMinutes,
        allowLateEntry,
        lateThresholdMinutes,
        maxAttendees,
        location: location || undefined,
        description: description || undefined,
      })

      setCurrentSession(session)
      setAttendanceRecords(session.attendanceRecords)
      setError(null)
      setSuccess("Session created successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to create session")
    }
  }

  const startScanning = async () => {
    try {
      setError(null)
      setIsLoading(true)

      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "environment",
          focusMode: "continuous",
        },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsLoading(false)
          })
        }
      }

      setStream(mediaStream)
      setIsScanning(true)
    } catch (err: any) {
      setIsLoading(false)
      setError(`Camera error: ${err.message || "Failed to access camera"}`)
    }
  }

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
    setIsLoading(false)
  }

  const processQRFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== 4) return

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Simulate QR detection
    if (Math.random() > 0.95) {
      // 5% chance per frame
      await simulateQRDetection()
    }

    // Draw scanning overlay
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 3
    ctx.setLineDash([10, 10])
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const size = Math.min(canvas.width, canvas.height) * 0.6
    ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size)
    ctx.setLineDash([])

    // Add corner markers
    const cornerSize = 30
    const corners = [
      [centerX - size / 2, centerY - size / 2],
      [centerX + size / 2 - cornerSize, centerY - size / 2],
      [centerX - size / 2, centerY + size / 2 - cornerSize],
      [centerX + size / 2 - cornerSize, centerY + size / 2 - cornerSize],
    ]

    ctx.strokeStyle = "#10b981"
    ctx.lineWidth = 4
    corners.forEach(([x, y]) => {
      ctx.strokeRect(x, y, cornerSize, cornerSize)
    })
  }

  const simulateQRDetection = async () => {
    // Simulate different types of QR codes
    const qrTypes = ["session", "student"]
    const qrType = qrTypes[Math.floor(Math.random() * qrTypes.length)]

    if (qrType === "session") {
      // Simulate session QR scan
      const mockSessionData = {
        sessionId: currentSession?.id || `session_${Date.now()}`,
        classId: "CS101",
        sessionName: "Morning Lecture",
        teacherId: "teacher_123",
        timestamp: new Date().toISOString(),
        type: "attendance_session",
        version: "2.0",
      }

      const result = await advancedQRSystem.processQRScan(JSON.stringify(mockSessionData), {
        location: { latitude: 40.7128, longitude: -74.006 },
        deviceInfo: { userAgent: navigator.userAgent, platform: navigator.platform },
        ipAddress: "192.168.1.1",
      })

      if (result.success && result.sessionInfo) {
        setScannedSessionId(result.sessionInfo.id)
        setSuccess(result.message)
        setTimeout(() => setSuccess(null), 3000)
      }
    } else if (qrType === "student" && scannedSessionId) {
      // Simulate student QR scan
      const mockStudentData = {
        studentId: `student_${Math.floor(Math.random() * 1000)}`,
        rollNumber: `CS${Math.floor(Math.random() * 100) + 1}`,
        name: `Student ${Math.floor(Math.random() * 100) + 1}`,
        class: "CS",
        section: "A",
        type: "student_id",
        version: "2.0",
        timestamp: new Date().toISOString(),
      }

      const result = await advancedQRSystem.processQRScan(JSON.stringify(mockStudentData), {
        sessionId: scannedSessionId,
        location: { latitude: 40.7128, longitude: -74.006 },
        deviceInfo: { userAgent: navigator.userAgent, platform: navigator.platform },
        ipAddress: "192.168.1.1",
      })

      if (result.success && result.record) {
        setAttendanceRecords((prev) => [result.record!, ...prev])
        setSuccess(result.message)
        setTimeout(() => setSuccess(null), 3000)

        notificationService.notifyAttendanceMarked(
          result.record!.studentName,
          "qr",
          currentSession?.sessionName || "Current Session",
        )

        if (result.record!.status === "late") {
          const minutesLate = Math.floor(
            (result.record!.timestamp.getTime() - (currentSession?.createdAt.getTime() || 0)) / 60000,
          )
          notificationService.notifyLateArrival(
            result.record!.studentName,
            currentSession?.sessionName || "Current Session",
            minutesLate,
          )
        }

        // Update session stats
        if (scannedSessionId) {
          const stats = advancedQRSystem.getSessionStats(scannedSessionId)
          setSessionStats(stats)
        }
      } else {
        setError(result.message)
        setTimeout(() => setError(null), 3000)
      }
    }
  }

  const endSession = () => {
    if (currentSession) {
      advancedQRSystem.endSession(currentSession.id)
      setCurrentSession({ ...currentSession, isActive: false })
      stopScanning()
      setSuccess("Session ended successfully")
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const exportSessionData = () => {
    if (!currentSession) return

    const { csvData, jsonData } = advancedQRSystem.exportSessionData(currentSession.id)

    // Export CSV
    const csvBlob = new Blob([csvData], { type: "text/csv" })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement("a")
    csvLink.href = csvUrl
    csvLink.download = `attendance-${currentSession.classId}-${new Date().toISOString().split("T")[0]}.csv`
    csvLink.click()
    URL.revokeObjectURL(csvUrl)

    // Export JSON
    const jsonBlob = new Blob([jsonData], { type: "application/json" })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement("a")
    jsonLink.href = jsonUrl
    jsonLink.download = `attendance-${currentSession.classId}-${new Date().toISOString().split("T")[0]}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)
  }

  const shareSession = async () => {
    if (!currentSession) return

    const shareData = {
      title: `${currentSession.sessionName} - Attendance`,
      text: `Join the attendance session for ${currentSession.classId}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      setSuccess("Session link copied to clipboard!")
      setTimeout(() => setSuccess(null), 3000)
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
  }, [isScanning, scannedSessionId])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  // Update stats when attendance records change
  useEffect(() => {
    if (currentSession) {
      const stats = advancedQRSystem.getSessionStats(currentSession.id)
      setSessionStats(stats)
    }
  }, [attendanceRecords, currentSession])

  return (
    <div className="space-y-6">
      {/* Session Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Create Advanced QR Attendance Session
          </CardTitle>
          <CardDescription>Set up a comprehensive attendance session with advanced features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classId">Class ID *</Label>
              <Input
                id="classId"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="e.g., CS101, MATH201"
                disabled={currentSession?.isActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionName">Session Name *</Label>
              <Input
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Morning Lecture"
                disabled={currentSession?.isActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherName">Teacher Name *</Label>
              <Input
                id="teacherName"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g., Dr. Smith"
                disabled={currentSession?.isActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min="5"
                max="300"
                disabled={currentSession?.isActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
              <Input
                id="lateThreshold"
                type="number"
                value={lateThresholdMinutes}
                onChange={(e) => setLateThresholdMinutes(Number(e.target.value))}
                min="0"
                max="60"
                disabled={currentSession?.isActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={maxAttendees || ""}
                onChange={(e) => setMaxAttendees(e.target.value ? Number(e.target.value) : undefined)}
                min="1"
                placeholder="No limit"
                disabled={currentSession?.isActive}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Room 101, Building A"
                disabled={currentSession?.isActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional session details..."
                disabled={currentSession?.isActive}
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch
                checked={allowLateEntry}
                onCheckedChange={setAllowLateEntry}
                disabled={currentSession?.isActive}
              />
              <Label>Allow Late Entry</Label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!currentSession?.isActive ? (
              <Button onClick={createSession} className="gap-2">
                <QrCode className="w-4 h-4" />
                Create Session
              </Button>
            ) : (
              <>
                <Button onClick={endSession} variant="destructive" className="gap-2">
                  <CameraOff className="w-4 h-4" />
                  End Session
                </Button>
                <Button onClick={shareSession} variant="outline" className="gap-2 bg-transparent">
                  <Share2 className="w-4 h-4" />
                  Share Session
                </Button>
                <Button onClick={exportSessionData} variant="outline" className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
              </>
            )}

            {currentSession?.isActive && (
              <Badge variant="default" className="gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Session Active
              </Badge>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Session QR Code Display */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session QR Code</CardTitle>
            <CardDescription>
              Display this QR code for students to scan first, then they scan their student ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-primary rounded-xl">
                <img
                  src={currentSession.qrCodeImage || "/placeholder.svg"}
                  alt="Session QR Code"
                  className="w-80 h-80 mx-auto"
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-xl">{currentSession.sessionName}</h3>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {currentSession.classId}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentSession.durationMinutes} min
                  </div>
                  {currentSession.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {currentSession.location}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Expires: {currentSession.expiresAt.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner */}
      {currentSession?.isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              {!scannedSessionId
                ? "First scan the session QR code, then scan student ID QR codes"
                : "Session detected! Now scan student ID QR codes to mark attendance"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  {!scannedSessionId ? "Scanning for Session QR" : "Scanning for Student IDs"}
                </Badge>
              )}

              {scannedSessionId && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Session Detected
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
                    <p>Enhanced QR Scanner Ready</p>
                    <p className="text-sm">Supports both session and student ID QR codes</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Statistics */}
      {sessionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{sessionStats.totalAttendees}</p>
                  <p className="text-sm text-muted-foreground">Total Attendees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{sessionStats.presentCount}</p>
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
                  <p className="text-2xl font-bold">{sessionStats.lateCount}</p>
                  <p className="text-sm text-muted-foreground">Late Arrivals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{sessionStats.averageArrivalTime.toFixed(1)}m</p>
                  <p className="text-sm text-muted-foreground">Avg Arrival Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Records */}
      {attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Live Attendance Records</span>
              <Badge variant="outline">{attendanceRecords.length} students</Badge>
            </CardTitle>
            <CardDescription>Real-time attendance tracking with detailed information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{record.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.rollNumber} • {record.studentId}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={record.status === "present" ? "default" : "secondary"}>
                        {record.status === "present" ? "On Time" : "Late"}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{record.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {record.scanLocation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location: {record.scanLocation.latitude.toFixed(4)}, {record.scanLocation.longitude.toFixed(4)}
                      </div>
                    )}
                    {record.deviceInfo && (
                      <div className="flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        Device: {record.deviceInfo.platform}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Arrival:{" "}
                      {((record.timestamp.getTime() - (currentSession?.createdAt.getTime() || 0)) / 60000).toFixed(1)}m
                    </div>
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

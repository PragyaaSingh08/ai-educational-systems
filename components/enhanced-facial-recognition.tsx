"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  CameraOff,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  Download,
  Settings,
  Shield,
  Eye,
  Zap,
} from "lucide-react"
import { advancedFaceRecognition, type FaceDetectionResult } from "@/lib/advanced-face-recognition"
import { studentDB } from "@/lib/student-database"
import { notificationService } from "@/lib/notification-system"

interface EnhancedDetectedFace extends FaceDetectionResult {
  id: string
  studentMatch?: {
    studentId: string
    name: string
    rollNumber: string
    confidence: number
  }
  qualityAssessment: {
    score: number
    issues: string[]
  }
  isLive?: boolean
  livenessConfidence?: number
}

export function EnhancedFacialRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [detectedFaces, setDetectedFaces] = useState<EnhancedDetectedFace[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceMarked, setAttendanceMarked] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [currentSession, setCurrentSession] = useState<{ sessionName: string } | null>(null)

  // Settings state
  const [settings, setSettings] = useState(advancedFaceRecognition.getSettings())
  const [enableLivenessDetection, setEnableLivenessDetection] = useState(true)
  const [enableAntiSpoofing, setEnableAntiSpoofing] = useState(true)

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== 4) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Advanced face detection
      const faces = await advancedFaceRecognition.detectFacesAdvanced(video)

      // Liveness detection if enabled
      let livenessResult = null
      if (enableLivenessDetection && faces.length > 0) {
        livenessResult = await advancedFaceRecognition.detectLiveness(video)
      }

      const enhancedFaces: EnhancedDetectedFace[] = []

      for (const face of faces) {
        // Quality assessment
        const qualityAssessment = advancedFaceRecognition.assessFaceQuality(face)

        // Face matching
        let studentMatch = null
        if (face.descriptor && qualityAssessment.score > 0.5) {
          const match = await advancedFaceRecognition.matchFace(face.descriptor)
          if (match.studentId) {
            studentMatch = {
              studentId: match.studentId,
              name: match.name!,
              rollNumber: match.rollNumber!,
              confidence: match.confidence,
            }

            // Auto-mark attendance for high-confidence matches
            if (match.confidence > settings.confidenceThreshold && !attendanceMarked.has(match.studentId)) {
              const sessionInfo =
                typeof localStorage !== "undefined"
                  ? JSON.parse(localStorage.getItem("current_attendance_session") || "{}")
                  : {}

              const attendanceRecord = studentDB.markAttendance(
                match.studentId,
                "face",
                match.confidence,
                sessionInfo.subject,
              )

              setAttendanceMarked((prev) => new Set(prev).add(match.studentId))

              console.log(
                "[v0] Attendance marked for:",
                match.name,
                "Subject:",
                sessionInfo.subject,
                "Record ID:",
                attendanceRecord.id,
              )

              notificationService.notifyAttendanceMarked(match.name!, "face", sessionInfo.subject || "Current Class")
            }
          }
        }

        enhancedFaces.push({
          ...face,
          id: `face_${Date.now()}_${enhancedFaces.length}`,
          studentMatch,
          qualityAssessment,
          isLive: livenessResult?.isLive,
          livenessConfidence: livenessResult?.confidence,
        })
      }

      setDetectedFaces(enhancedFaces)

      // Draw enhanced detection boxes
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      enhancedFaces.forEach((face) => {
        const isRecognized = !!face.studentMatch
        const isHighQuality = face.qualityAssessment.score > 0.7
        const isLive = face.isLive !== false

        // Choose color based on recognition status and quality
        let strokeColor = "#ef4444" // Red for unknown
        if (isRecognized && isHighQuality && isLive) {
          strokeColor = "#10b981" // Green for good recognition
        } else if (isRecognized) {
          strokeColor = "#f59e0b" // Yellow for recognized but low quality
        }

        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 3
        ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height)

        // Draw landmarks
        if (face.landmarks) {
          ctx.fillStyle = strokeColor
          Object.values(face.landmarks).forEach((point) => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
            ctx.fill()
          })
        }

        // Enhanced label with more information
        const label = face.studentMatch
          ? `${face.studentMatch.name} (${(face.studentMatch.confidence * 100).toFixed(0)}%)`
          : `Unknown (Q: ${(face.qualityAssessment.score * 100).toFixed(0)}%)`

        ctx.font = "14px sans-serif"
        const textMetrics = ctx.measureText(label)
        const labelWidth = textMetrics.width + 10
        const labelHeight = 25

        ctx.fillStyle = strokeColor
        ctx.fillRect(face.box.x, face.box.y - labelHeight, labelWidth, labelHeight)

        ctx.fillStyle = "white"
        ctx.fillText(label, face.box.x + 5, face.box.y - 8)

        // Quality indicator
        if (!isHighQuality) {
          ctx.fillStyle = "#ef4444"
          ctx.fillRect(face.box.x + face.box.width - 20, face.box.y, 20, 20)
          ctx.fillStyle = "white"
          ctx.font = "12px sans-serif"
          ctx.fillText("!", face.box.x + face.box.width - 15, face.box.y + 14)
        }

        // Liveness indicator
        if (enableLivenessDetection && face.isLive === false) {
          ctx.fillStyle = "#dc2626"
          ctx.fillRect(face.box.x, face.box.y + face.box.height - 20, 60, 20)
          ctx.fillStyle = "white"
          ctx.font = "10px sans-serif"
          ctx.fillText("SPOOF", face.box.x + 5, face.box.y + face.box.height - 8)
        }
      })
    } catch (error) {
      console.error("[v0] Enhanced face detection error:", error)
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
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user",
          frameRate: { ideal: 30 },
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
      setIsActive(true)
    } catch (err: any) {
      setIsLoading(false)
      setError(`Camera error: ${err.message || "Failed to access camera"}`)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsActive(false)
    setDetectedFaces([])
    setAttendanceMarked(new Set())
    setIsLoading(false)
  }

  const updateSettings = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    advancedFaceRecognition.updateSettings(newSettings)
  }

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      settings,
      detectedFaces: detectedFaces.map((face) => ({
        studentMatch: face.studentMatch,
        confidence: face.studentMatch?.confidence,
        quality: face.qualityAssessment.score,
        isLive: face.isLive,
        issues: face.qualityAssessment.issues,
      })),
      attendanceMarked: Array.from(attendanceMarked),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `enhanced-recognition-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
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
  }, [isActive, settings, enableLivenessDetection, enableAntiSpoofing])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  const stats = {
    totalFaces: detectedFaces.length,
    recognizedFaces: detectedFaces.filter((f) => f.studentMatch).length,
    highQualityFaces: detectedFaces.filter((f) => f.qualityAssessment.score > 0.7).length,
    liveFaces: detectedFaces.filter((f) => f.isLive !== false).length,
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Enhanced Facial Recognition
          </CardTitle>
          <CardDescription>Advanced AI-powered recognition with quality assessment and anti-spoofing</CardDescription>
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
                    Start Enhanced Recognition
                  </>
                )}
              </Button>

              {isActive && (
                <>
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="outline"
                    className="gap-2 bg-transparent"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>

                  <Button
                    onClick={exportResults}
                    variant="outline"
                    className="gap-2 bg-transparent"
                    disabled={detectedFaces.length === 0}
                  >
                    <Download className="w-4 h-4" />
                    Export Results
                  </Button>
                </>
              )}

              {isActive && (
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Enhanced Mode
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <Switch checked={enableAntiSpoofing} onCheckedChange={setEnableAntiSpoofing} />
                    <Label className="text-sm">Anti-Spoofing</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-500" />
                    <Switch checked={enableLivenessDetection} onCheckedChange={setEnableLivenessDetection} />
                    <Label className="text-sm">Liveness</Label>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Recognition Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[settings.confidenceThreshold * 100]}
                        onValueChange={([value]) => updateSettings("confidenceThreshold", value / 100)}
                        max={100}
                        min={50}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quality Threshold: {(settings.qualityThreshold * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[settings.qualityThreshold * 100]}
                        onValueChange={([value]) => updateSettings("qualityThreshold", value / 100)}
                        max={100}
                        min={30}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Face Angle: {settings.maxAngleDeviation}°</Label>
                      <Slider
                        value={[settings.maxAngleDeviation]}
                        onValueChange={([value]) => updateSettings("maxAngleDeviation", value)}
                        max={45}
                        min={15}
                        step={5}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Enhanced Camera Feed */}
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
                    <Zap className="w-12 h-12 mx-auto" />
                    <p>Enhanced Recognition Ready</p>
                    <p className="text-sm">Advanced quality assessment and anti-spoofing enabled</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Statistics */}
      {isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalFaces}</p>
                  <p className="text-sm text-muted-foreground">Detected Faces</p>
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
                  <p className="text-sm text-muted-foreground">Recognized</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.highQualityFaces}</p>
                  <p className="text-sm text-muted-foreground">High Quality</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.liveFaces}</p>
                  <p className="text-sm text-muted-foreground">Live Faces</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Detection Results */}
      {isActive && detectedFaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enhanced Detection Results</CardTitle>
            <CardDescription>Detailed analysis with quality assessment and security features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detectedFaces.map((face) => {
                const studentPhoto = face.studentMatch
                  ? (typeof localStorage !== "undefined"
                      ? localStorage.getItem(`student_photo_${face.studentMatch.rollNumber}`) ||
                        localStorage.getItem(`student_photo_id_${face.studentMatch.studentId}`)
                      : null) || studentDB.getStudent(face.studentMatch.studentId)?.faceImageUrl
                  : null

                console.log("[v0] Student photo lookup for:", face.studentMatch?.name, "Photo found:", !!studentPhoto)

                return (
                  <div key={face.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {studentPhoto ? (
                          <img
                            src={studentPhoto || "/placeholder.svg"}
                            alt={face.studentMatch?.name || "Student"}
                            className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                            onError={(e) => {
                              console.log("[v0] Failed to load student photo, using fallback")
                              e.currentTarget.style.display = "none"
                              e.currentTarget.nextElementSibling?.classList.remove("hidden")
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            face.studentMatch ? "bg-green-100 border-2 border-green-500" : "bg-orange-100"
                          } ${studentPhoto ? "hidden" : ""}`}
                        >
                          <User className={`w-6 h-6 ${face.studentMatch ? "text-green-600" : "text-orange-600"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{face.studentMatch ? face.studentMatch.name : "Unknown Person"}</p>
                          <p className="text-sm text-muted-foreground">
                            {face.studentMatch
                              ? `${face.studentMatch.rollNumber} • Confidence: ${(face.studentMatch.confidence * 100).toFixed(0)}%`
                              : `Position: (${Math.round(face.box.x)}, ${Math.round(face.box.y)})`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {face.isLive === false && (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Spoof Detected
                          </Badge>
                        )}

                        <Badge variant={face.qualityAssessment.score > 0.7 ? "default" : "secondary"}>
                          Quality: {(face.qualityAssessment.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>

                    {/* Quality Issues */}
                    {face.qualityAssessment.issues.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span>Issues: {face.qualityAssessment.issues.join(", ")}</span>
                      </div>
                    )}

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      {face.studentMatch && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm w-20">Match:</span>
                          <Progress value={face.studentMatch.confidence * 100} className="flex-1 h-2" />
                          <span className="text-sm w-12">{(face.studentMatch.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-sm w-20">Quality:</span>
                        <Progress value={face.qualityAssessment.score * 100} className="flex-1 h-2" />
                        <span className="text-sm w-12">{(face.qualityAssessment.score * 100).toFixed(0)}%</span>
                      </div>

                      {face.livenessConfidence !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm w-20">Liveness:</span>
                          <Progress value={face.livenessConfidence * 100} className="flex-1 h-2" />
                          <span className="text-sm w-12">{(face.livenessConfidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Attendance Status */}
                    {face.studentMatch && attendanceMarked.has(face.studentMatch.studentId) && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Attendance Marked
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

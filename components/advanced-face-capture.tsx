"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, Square, CheckCircle, AlertCircle, User } from "lucide-react"

interface AdvancedFaceCaptureProps {
  onPhotoCaptured: (photoData: string, faceDescriptor: Float32Array) => void
  onClose: () => void
  studentName: string
  enrollmentNo: string
}

export default function AdvancedFaceCapture({
  onPhotoCaptured,
  onClose,
  studentName,
  enrollmentNo,
}: AdvancedFaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [faceDetected, setFaceDetected] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [status, setStatus] = useState<"initializing" | "ready" | "capturing" | "processing" | "complete">(
    "initializing",
  )
  const [faceQuality, setFaceQuality] = useState(0)
  const [processedData, setProcessedData] = useState<{ photoData: string; faceDescriptor: Float32Array } | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (processedData && status === "complete") {
      console.log("[v0] Advanced face capture completed")
      onPhotoCaptured(processedData.photoData, processedData.faceDescriptor)
      setProcessedData(null) // Clear processed data
    }
  }, [processedData, status, onPhotoCaptured])

  const initializeCamera = useCallback(async () => {
    try {
      console.log("[v0] Initializing advanced face capture camera")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setStatus("ready")
        startFaceDetection()
      }
    } catch (error) {
      console.error("[v0] Camera initialization failed:", error)
      setStatus("ready") // Fallback to ready state
    }
  }, [])

  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    detectionIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx?.drawImage(video, 0, 0)

        // Simulate face detection and quality assessment
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
        if (imageData) {
          const quality = assessFaceQuality(imageData)
          setFaceQuality(quality)
          setFaceDetected(quality > 30) // Face detected if quality > 30%
        }
      }
    }, 100)
  }, [])

  const assessFaceQuality = (imageData: ImageData): number => {
    const data = imageData.data
    let brightness = 0
    const contrast = 0

    // Calculate brightness
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    brightness = brightness / (data.length / 4)

    // Simple quality score based on brightness and simulated sharpness
    const brightnessScore = Math.max(0, 100 - Math.abs(brightness - 128))
    const sharpnessScore = Math.random() * 40 + 30 // Simulated sharpness

    return Math.min(100, (brightnessScore + sharpnessScore) / 2)
  }

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !faceDetected) return

    setIsCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Capture frame
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const photoData = canvas.toDataURL("image/jpeg", 0.8)

    setCapturedImages((prevImages) => {
      const newImages = [...prevImages, photoData]
      const progress = (newImages.length / 10) * 100
      setCaptureProgress(progress)

      console.log(`[v0] Captured image ${newImages.length}/10 for ${studentName}`)

      // Auto-capture next image if we haven't reached 10 yet
      if (newImages.length < 10) {
        setTimeout(() => {
          setIsCapturing(false)
          if (faceDetected && faceQuality > 50) {
            capturePhoto() // Continue capturing
          }
        }, 500)
      } else {
        // Processing complete
        setStatus("processing")
        processCapturedImages(newImages)
      }

      return newImages
    })
  }, [faceDetected, faceQuality, studentName]) // Removed capturedImages dependency

  const processCapturedImages = async (images: string[]) => {
    try {
      console.log("[v0] Processing captured face images")

      // Simulate face descriptor extraction (in real implementation, use face-api.js)
      const faceDescriptor = new Float32Array(128).map(() => Math.random())

      // Use the best quality image as the primary photo
      const bestImage = images[Math.floor(images.length / 2)] // Middle image usually best

      setProcessedData({ photoData: bestImage, faceDescriptor })
      setStatus("complete")
    } catch (error) {
      console.error("[v0] Face processing failed:", error)
      setStatus("ready")
    }
  }

  const startCaptureSequence = () => {
    if (!faceDetected) {
      console.log("[v0] No face detected, cannot start capture")
      return
    }

    setStatus("capturing")
    setCapturedImages([])
    setCaptureProgress(0)
    capturePhoto()
  }

  useEffect(() => {
    initializeCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [initializeCamera])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
            <Camera className="w-6 h-6" />
            Advanced Face Registration
          </CardTitle>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <User className="w-4 h-4 mr-1" />
              {studentName}
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              ID: {enrollmentNo}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Camera Feed */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Face Detection Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-64 h-64 border-2 rounded-lg ${
                  faceDetected ? "border-green-400" : "border-red-400"
                } ${faceDetected ? "animate-pulse" : ""}`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {faceDetected ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status and Quality Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-gray-400">Face Detection</div>
                <div className={`text-lg font-bold ${faceDetected ? "text-green-400" : "text-red-400"}`}>
                  {faceDetected ? "Detected" : "Not Detected"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-gray-400">Image Quality</div>
                <div className="text-lg font-bold text-blue-400">{Math.round(faceQuality)}%</div>
                <Progress value={faceQuality} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-gray-400">Capture Progress</div>
                <div className="text-lg font-bold text-purple-400">{capturedImages.length}/10</div>
                <Progress value={captureProgress} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Status Messages */}
          <div className="text-center">
            {status === "initializing" && <p className="text-yellow-400">Initializing camera...</p>}
            {status === "ready" && !faceDetected && (
              <p className="text-red-400">Please position your face in the frame</p>
            )}
            {status === "ready" && faceDetected && faceQuality < 50 && (
              <p className="text-yellow-400">Improve lighting for better quality</p>
            )}
            {status === "ready" && faceDetected && faceQuality >= 50 && (
              <p className="text-green-400">Ready to capture! Click "Start Capture" below</p>
            )}
            {status === "capturing" && (
              <p className="text-blue-400">Capturing face samples... {capturedImages.length}/10</p>
            )}
            {status === "processing" && <p className="text-purple-400">Processing face data...</p>}
            {status === "complete" && <p className="text-green-400">Face registration complete!</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {status === "ready" && (
              <Button
                onClick={startCaptureSequence}
                disabled={!faceDetected || faceQuality < 30}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Capture
              </Button>
            )}

            {status === "capturing" && (
              <Button disabled className="bg-blue-600 text-white px-8 py-2">
                <Square className="w-4 h-4 mr-2" />
                Capturing... {capturedImages.length}/10
              </Button>
            )}

            {status === "complete" && (
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Registration
              </Button>
            )}

            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
          </div>

          {/* Captured Images Preview */}
          {capturedImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white text-lg font-semibold mb-3">Captured Samples</h3>
              <div className="grid grid-cols-5 gap-2">
                {capturedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Sample ${index + 1}`}
                      className="w-full h-16 object-cover rounded border-2 border-green-400"
                    />
                    <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs">{index + 1}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

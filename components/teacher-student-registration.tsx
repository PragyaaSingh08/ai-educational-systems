"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Camera, Save, X, CheckCircle, AlertCircle, Users } from "lucide-react"
import { studentDB, type Student } from "@/lib/student-database"
import { faceRecognitionService } from "@/lib/face-recognition-utils"

interface TeacherStudentRegistrationProps {
  onStudentRegistered?: (student: Student) => void
  onClose?: () => void
  className?: string
}

export function TeacherStudentRegistration({
  onStudentRegistered,
  onClose,
  className,
}: TeacherStudentRegistrationProps) {
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    email: "",
    class: "",
    section: "",
  })

  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "success" | "error">("idle")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Student name is required"
    if (!formData.rollNumber.trim()) newErrors.rollNumber = "Roll number is required"
    if (!formData.class.trim()) newErrors.class = "Class is required"
    if (!formData.section.trim()) newErrors.section = "Section is required"

    // Check if roll number already exists
    if (formData.rollNumber && studentDB.getStudentByRollNumber(formData.rollNumber)) {
      newErrors.rollNumber = "Roll number already exists"
    }

    if (!faceImage) {
      newErrors.face = "Face photo is required for attendance system"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const startCamera = async () => {
    try {
      console.log("[v0] Starting camera for teacher registration...")
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
          setShowCamera(true)
          setErrors((prev) => ({ ...prev, camera: "" }))
        }
      }
    } catch (error: any) {
      console.error("[v0] Camera error:", error)
      setErrors((prev) => ({
        ...prev,
        camera: "Camera access denied. Please allow camera access and try again.",
      }))
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = canvas.toDataURL("image/jpeg", 0.95)
      console.log("[v0] Photo captured for teacher registration")

      // Extract face descriptor immediately
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = async () => {
        try {
          const descriptor = await faceRecognitionService.extractFaceDescriptor(img)
          if (descriptor) {
            setFaceDescriptor(descriptor)
            console.log("[v0] Face descriptor extracted successfully")
          }
        } catch (error) {
          console.error("[v0] Face descriptor extraction error:", error)
        }
      }
      img.src = imageData

      setFaceImage(imageData)
      stopCamera()
      setErrors((prev) => ({ ...prev, face: "", camera: "" }))
    } catch (error) {
      console.error("[v0] Photo capture error:", error)
      setErrors((prev) => ({ ...prev, camera: "Failed to capture photo" }))
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsProcessing(true)
    setRegistrationStatus("idle")

    try {
      console.log("[v0] Teacher registering student:", formData.name)

      // Create student record
      const newStudent = studentDB.addStudent({
        name: formData.name,
        rollNumber: formData.rollNumber,
        email: formData.email || undefined,
        class: formData.class,
        section: formData.section,
        faceImageUrl: faceImage || undefined,
      })

      // Store face data for recognition
      if (faceImage && faceDescriptor) {
        studentDB.updateStudentFaceData(newStudent.id, faceImage, Array.from(faceDescriptor))

        // Store in localStorage for immediate access
        localStorage.setItem(`student_photo_${formData.rollNumber}`, faceImage)
        localStorage.setItem(`face_descriptor_${formData.rollNumber}`, JSON.stringify(Array.from(faceDescriptor)))

        console.log("[v0] Face data stored for student:", newStudent.rollNumber)
      }

      setRegistrationStatus("success")
      onStudentRegistered?.(newStudent)

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: "",
          rollNumber: "",
          email: "",
          class: "",
          section: "",
        })
        setFaceImage(null)
        setFaceDescriptor(null)
        setRegistrationStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("[v0] Student registration error:", error)
      setRegistrationStatus("error")
      setErrors((prev) => ({ ...prev, submit: "Failed to register student" }))
    } finally {
      setIsProcessing(false)
    }
  }

  if (registrationStatus === "success") {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">Student Registered Successfully!</h3>
          <p className="text-muted-foreground mb-4">
            {formData.name} has been registered and can now use face recognition for attendance.
          </p>
          <Button onClick={() => setRegistrationStatus("idle")} className="mr-2">
            Register Another Student
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Register New Student
            </CardTitle>
            <CardDescription>
              Register a student with face recognition for automatic attendance tracking
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Student Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input
                id="rollNumber"
                value={formData.rollNumber}
                onChange={(e) => handleInputChange("rollNumber", e.target.value)}
                placeholder="Enter roll number"
                className={errors.rollNumber ? "border-red-500" : ""}
              />
              {errors.rollNumber && <p className="text-sm text-red-500">{errors.rollNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={formData.class} onValueChange={(value) => handleInputChange("class", value)}>
                <SelectTrigger className={errors.class ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9th">9th Grade</SelectItem>
                  <SelectItem value="10th">10th Grade</SelectItem>
                  <SelectItem value="11th">11th Grade</SelectItem>
                  <SelectItem value="12th">12th Grade</SelectItem>
                  <SelectItem value="freshman">Freshman</SelectItem>
                  <SelectItem value="sophomore">Sophomore</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
              {errors.class && <p className="text-sm text-red-500">{errors.class}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Select value={formData.section} onValueChange={(value) => handleInputChange("section", value)}>
                <SelectTrigger className={errors.section ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                  <SelectItem value="CS">Computer Science</SelectItem>
                  <SelectItem value="EE">Electrical Engineering</SelectItem>
                  <SelectItem value="ME">Mechanical Engineering</SelectItem>
                  <SelectItem value="BBA">Business Administration</SelectItem>
                </SelectContent>
              </Select>
              {errors.section && <p className="text-sm text-red-500">{errors.section}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Face Capture Section */}
          <div className="space-y-4">
            <div>
              <Label>Face Photo for Attendance *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Capture the student's face photo for automatic attendance recognition
              </p>
            </div>

            {!showCamera && !faceImage && (
              <Button type="button" onClick={startCamera} className="w-full flex items-center gap-2" size="lg">
                <Camera className="w-5 h-5" />
                Start Camera to Capture Face
              </Button>
            )}

            {showCamera && (
              <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-muted/20">
                <div className="text-center">
                  <h3 className="font-semibold text-primary mb-2">Position Student's Face</h3>
                  <p className="text-sm text-muted-foreground">
                    Make sure the student's face is clearly visible and well-lit
                  </p>
                </div>

                <div className="relative mx-auto max-w-md">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg border-2 border-primary/30"
                  />
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none">
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-3 justify-center">
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={stopCamera} size="lg">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {faceImage && (
              <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 mb-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Face Photo Captured!</span>
                </div>
                <img
                  src={faceImage || "/placeholder.svg"}
                  alt="Student face"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-green-300 mx-auto mb-3"
                />
                {faceDescriptor && (
                  <Badge variant="secondary" className="mb-3">
                    Face data processed for recognition
                  </Badge>
                )}
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFaceImage(null)
                      setFaceDescriptor(null)
                    }}
                    className="text-red-600 border-red-300"
                  >
                    Remove Photo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={startCamera}>
                    Retake Photo
                  </Button>
                </div>
              </div>
            )}

            {errors.face && <p className="text-sm text-red-500">{errors.face}</p>}
            {errors.camera && <p className="text-sm text-red-500">{errors.camera}</p>}
          </div>

          {/* Submit Section */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isProcessing} className="flex items-center gap-2" size="lg">
              <Save className="w-4 h-4" />
              {isProcessing ? "Registering Student..." : "Register Student"}
            </Button>

            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} size="lg">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

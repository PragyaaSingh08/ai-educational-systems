"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera, Users, Clock, CheckCircle, X } from "lucide-react"

interface AttendanceRecord {
  studentId: string
  rollNumber: string
  name: string
  timestamp: string
  confidence: number
}

export function SubjectAttendanceCapture() {
  const [subject, setSubject] = useState("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startAttendanceCapture = async () => {
    if (!subject.trim()) {
      alert("Please enter a subject name")
      return
    }

    setIsCapturing(true)
    setAttendanceRecords([])
    setTimeRemaining(20) // 20 seconds capture time

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      console.log("[v0] Started attendance capture for subject:", subject)

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            stopAttendanceCapture()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      const recognitionInterval = setInterval(() => {
        if (timeRemaining > 0) {
          simulateFaceRecognition()
        } else {
          clearInterval(recognitionInterval)
        }
      }, 2000)
    } catch (error) {
      console.error("[v0] Failed to start camera:", error)
      setIsCapturing(false)
    }
  }

  const simulateFaceRecognition = () => {
    const students = JSON.parse(localStorage.getItem("students") || "[]")
    const studentsWithFaces = students.filter((s: any) => s.faceImageUrl)

    if (studentsWithFaces.length > 0) {
      const randomStudent = studentsWithFaces[Math.floor(Math.random() * studentsWithFaces.length)]
      const confidence = 75 + Math.random() * 20 // 75-95% confidence

      const alreadyPresent = attendanceRecords.find((r) => r.studentId === randomStudent.id)
      if (!alreadyPresent && confidence > 70) {
        const newRecord: AttendanceRecord = {
          studentId: randomStudent.id,
          rollNumber: randomStudent.rollNumber,
          name: randomStudent.name,
          timestamp: new Date().toLocaleTimeString(),
          confidence: Math.round(confidence),
        }

        setAttendanceRecords((prev) => [...prev, newRecord])
        console.log("[v0] Student recognized:", newRecord.name, "Confidence:", newRecord.confidence + "%")
      }
    }
  }

  const stopAttendanceCapture = () => {
    setIsCapturing(false)
    setTimeRemaining(0)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (attendanceRecords.length > 0) {
      const attendanceData = {
        subject,
        date: new Date().toISOString().split("T")[0],
        timestamp: new Date().toISOString(),
        records: attendanceRecords,
        totalPresent: attendanceRecords.length,
      }

      const existingAttendance = JSON.parse(localStorage.getItem("attendance_records") || "[]")
      existingAttendance.push(attendanceData)
      localStorage.setItem("attendance_records", JSON.stringify(existingAttendance))

      console.log("[v0] Attendance saved for", subject, ":", attendanceRecords.length, "students present")
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Subject Attendance Capture
          </CardTitle>
          <CardDescription>Enter subject name and start face recognition for attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Name</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Mathematics, Physics, Chemistry"
              disabled={isCapturing}
            />
          </div>

          {!isCapturing ? (
            <Button onClick={startAttendanceCapture} className="w-full" size="lg">
              <Camera className="h-4 w-4 mr-2" />
              Start Attendance Capture
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {timeRemaining}s remaining
                </Badge>
                <Button onClick={stopAttendanceCapture} variant="destructive" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay muted className="w-full h-64 object-cover" />
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm">● LIVE</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students Present ({attendanceRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {attendanceRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                    <div>
                      <div className="font-medium">{record.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Roll: {record.rollNumber} • {record.timestamp}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{record.confidence}%</Badge>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

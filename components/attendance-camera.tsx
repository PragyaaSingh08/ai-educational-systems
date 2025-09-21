"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Scan, User, Clock, Zap } from "lucide-react"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  timestamp: Date
  confidence: number
  status: "present" | "absent" | "late"
  method: "facial_recognition" | "manual"
}

interface AttendanceCameraProps {
  isScanning: boolean
  onFaceDetected: (studentData: { id: string; name: string; confidence: number }) => void
  recentRecords: AttendanceRecord[]
}

export function AttendanceCamera({ isScanning, onFaceDetected, recentRecords }: AttendanceCameraProps) {
  const [detectionStatus, setDetectionStatus] = useState<"idle" | "detecting" | "recognized">("idle")
  const [currentDetection, setCurrentDetection] = useState<{
    name: string
    confidence: number
  } | null>(null)

  // Simulate face detection
  useEffect(() => {
    if (!isScanning) {
      setDetectionStatus("idle")
      setCurrentDetection(null)
      return
    }

    const mockStudents = [
      { id: "STU004", name: "David Wilson" },
      { id: "STU005", name: "Emma Brown" },
      { id: "STU006", name: "Frank Miller" },
      { id: "STU007", name: "Grace Taylor" },
      { id: "STU008", name: "Henry Davis" },
    ]

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance of detection
        setDetectionStatus("detecting")

        setTimeout(() => {
          const student = mockStudents[Math.floor(Math.random() * mockStudents.length)]
          const confidence = 0.85 + Math.random() * 0.1

          setCurrentDetection({ name: student.name, confidence })
          setDetectionStatus("recognized")
          onFaceDetected({ ...student, confidence })

          setTimeout(() => {
            setDetectionStatus("idle")
            setCurrentDetection(null)
          }, 2000)
        }, 1000)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isScanning, onFaceDetected])

  const handleImageUpload = () => {
    // Simulate image upload and recognition
    const mockStudent = { id: "STU009", name: "Uploaded Student", confidence: 0.91 }
    onFaceDetected(mockStudent)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Camera Feed */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Live Camera Feed
            </CardTitle>
            <CardDescription>Real-time facial recognition for attendance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {/* Mock camera feed */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    {isScanning ? "Camera Active - Scanning for faces..." : "Camera Inactive"}
                  </p>
                  {isScanning && (
                    <div className="mt-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-sm">Live</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detection Overlay */}
              {detectionStatus !== "idle" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/80 text-white p-6 rounded-lg text-center">
                    {detectionStatus === "detecting" && (
                      <div className="space-y-3">
                        <Scan className="w-8 h-8 mx-auto animate-pulse text-primary" />
                        <p>Detecting face...</p>
                      </div>
                    )}
                    {detectionStatus === "recognized" && currentDetection && (
                      <div className="space-y-3">
                        <User className="w-8 h-8 mx-auto text-green-500" />
                        <div>
                          <p className="font-semibold text-lg">{currentDetection.name}</p>
                          <p className="text-sm text-green-400">
                            Confidence: {(currentDetection.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detection Frame */}
              {isScanning && (
                <div className="absolute inset-4 border-2 border-primary/50 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Button onClick={handleImageUpload} variant="outline" className="gap-2 bg-transparent">
                <Upload className="w-4 h-4" />
                Upload Image
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                AI-powered facial recognition active
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Detections */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Detections
            </CardTitle>
            <CardDescription>Latest attendance records from facial recognition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRecords.length > 0 ? (
                recentRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{record.studentName}</p>
                      <p className="text-xs text-muted-foreground">{record.timestamp.toLocaleTimeString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          record.status === "present"
                            ? "default"
                            : record.status === "late"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {record.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{(record.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No detections yet</p>
                  <p className="text-sm">Start scanning to see results</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

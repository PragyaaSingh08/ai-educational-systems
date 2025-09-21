"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Users, CheckCircle, XCircle, Clock, Scan, UserCheck, AlertTriangle } from "lucide-react"
import { AttendanceCamera } from "@/components/attendance-camera"
import { AttendanceHistory } from "@/components/attendance-history"
import { StudentDatabase } from "@/components/student-database"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  timestamp: Date
  confidence: number
  status: "present" | "absent" | "late"
  method: "facial_recognition" | "manual"
}

export function AttendanceSystem() {
  const [isScanning, setIsScanning] = useState(false)
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: "1",
      studentId: "STU001",
      studentName: "Alice Johnson",
      timestamp: new Date(Date.now() - 300000),
      confidence: 0.95,
      status: "present",
      method: "facial_recognition",
    },
    {
      id: "2",
      studentId: "STU002",
      studentName: "Bob Smith",
      timestamp: new Date(Date.now() - 240000),
      confidence: 0.92,
      status: "present",
      method: "facial_recognition",
    },
    {
      id: "3",
      studentId: "STU003",
      studentName: "Carol Davis",
      timestamp: new Date(Date.now() - 180000),
      confidence: 0.88,
      status: "late",
      method: "facial_recognition",
    },
  ])

  const startSession = () => {
    const sessionId = `session_${Date.now()}`
    setCurrentSession(sessionId)
    setIsScanning(true)
  }

  const stopSession = () => {
    setIsScanning(false)
    setCurrentSession(null)
  }

  const handleFaceDetected = useCallback((studentData: { id: string; name: string; confidence: number }) => {
    const newRecord: AttendanceRecord = {
      id: `record_${Date.now()}`,
      studentId: studentData.id,
      studentName: studentData.name,
      timestamp: new Date(),
      confidence: studentData.confidence,
      status: "present",
      method: "facial_recognition",
    }
    setAttendanceRecords((prev) => [newRecord, ...prev])
  }, [])

  const todayRecords = attendanceRecords.filter(
    (record) => record.timestamp.toDateString() === new Date().toDateString(),
  )

  const presentCount = todayRecords.filter((r) => r.status === "present").length
  const lateCount = todayRecords.filter((r) => r.status === "late").length
  const totalStudents = 25 // Mock total student count

  return (
    <div className="space-y-6">
      {/* Session Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Attendance Session Control
          </CardTitle>
          <CardDescription>Start or stop facial recognition attendance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {!isScanning ? (
              <Button onClick={startSession} className="gap-2">
                <Scan className="w-4 h-4" />
                Start Attendance Session
              </Button>
            ) : (
              <Button onClick={stopSession} variant="destructive" className="gap-2">
                <XCircle className="w-4 h-4" />
                Stop Session
              </Button>
            )}
            {currentSession && (
              <Badge variant="default" className="gap-1">
                <Clock className="w-3 h-3" />
                Session: {currentSession.slice(-6)}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {todayRecords.length}/{totalStudents} Recorded
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{presentCount}</div>
            <Progress value={(presentCount / totalStudents) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{lateCount}</div>
            <Progress value={(lateCount / totalStudents) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalStudents - todayRecords.length}</div>
            <Progress value={((totalStudents - todayRecords.length) / totalStudents) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {((todayRecords.length / totalStudents) * 100).toFixed(0)}%
            </div>
            <Progress value={(todayRecords.length / totalStudents) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="camera" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="camera">Live Camera</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
          <TabsTrigger value="students">Student Database</TabsTrigger>
        </TabsList>

        <TabsContent value="camera">
          <AttendanceCamera
            isScanning={isScanning}
            onFaceDetected={handleFaceDetected}
            recentRecords={todayRecords.slice(0, 5)}
          />
        </TabsContent>

        <TabsContent value="history">
          <AttendanceHistory records={attendanceRecords} />
        </TabsContent>

        <TabsContent value="students">
          <StudentDatabase />
        </TabsContent>
      </Tabs>
    </div>
  )
}

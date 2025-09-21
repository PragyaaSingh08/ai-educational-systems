"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Calendar, Users, CheckCircle, Clock, BookOpen, FileText } from "lucide-react"
import { studentDB, type AttendanceRecord } from "@/lib/student-database"

export function AttendanceManager() {
  const [currentSubject, setCurrentSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 })

  useEffect(() => {
    loadAttendanceData()
  }, [selectedDate, currentSubject])

  const loadAttendanceData = () => {
    const records = currentSubject
      ? studentDB.getAttendanceBySubjectAndDate(currentSubject, selectedDate)
      : studentDB.getAttendanceByDate(selectedDate)

    setAttendanceRecords(records)

    const allStudents = studentDB.getAllStudents()
    const presentCount = records.length
    const totalCount = allStudents.length

    setStats({
      total: totalCount,
      present: presentCount,
      absent: totalCount - presentCount,
      percentage: totalCount > 0 ? (presentCount / totalCount) * 100 : 0,
    })

    console.log("[v0] Loaded attendance data:", records.length, "records for", selectedDate)
  }

  const exportAttendance = () => {
    studentDB.exportAttendanceData(currentSubject || undefined, selectedDate)
  }

  const startAttendanceSession = () => {
    if (!currentSubject.trim()) {
      alert("Please enter a subject name first!")
      return
    }

    // Store current session info for face recognition
    localStorage.setItem(
      "current_attendance_session",
      JSON.stringify({
        subject: currentSubject,
        date: selectedDate,
        startTime: new Date().toISOString(),
      }),
    )

    console.log("[v0] Started attendance session for subject:", currentSubject)
    alert(`Attendance session started for ${currentSubject}. You can now use face recognition to mark attendance.`)
  }

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Attendance Session Manager
          </CardTitle>
          <CardDescription>Manage attendance sessions and view records by subject and date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Name</Label>
              <Input
                id="subject"
                placeholder="Enter subject name (e.g., Mathematics)"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button onClick={startAttendanceSession} className="flex-1" disabled={!currentSubject.trim()}>
                  <Clock className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
                <Button onClick={exportAttendance} variant="outline" disabled={attendanceRecords.length === 0}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.percentage.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance Records
            {currentSubject && (
              <Badge variant="secondary" className="ml-2">
                {currentSubject}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedDate} • {attendanceRecords.length} students marked present
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <Alert>
              <Calendar className="w-4 h-4" />
              <AlertDescription>
                No attendance records found for the selected date and subject.
                {currentSubject && " Start an attendance session and use face recognition to mark attendance."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {attendanceRecords.map((record) => {
                const student = studentDB.getStudent(record.studentId)
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{student?.name || "Unknown Student"}</p>
                        <p className="text-sm text-muted-foreground">
                          {student?.rollNumber} • {record.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={record.method === "face" ? "default" : "secondary"}>
                        {record.method === "face" ? "Face Recognition" : "QR Code"}
                      </Badge>
                      {record.confidence && (
                        <Badge variant="outline">{(record.confidence * 100).toFixed(0)}% confidence</Badge>
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

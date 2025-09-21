"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Users,
  Clock,
  Play,
  Square,
  UserPlus,
  Scan,
  Calendar,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react"
import { TeacherStudentRegistration } from "./teacher-student-registration"
import { StudentAttendanceScanner } from "./student-attendance-scanner"
import { studentDB, type Student, type AttendanceRecord } from "@/lib/student-database"

interface ClassSession {
  id: string
  subject: string
  class: string
  section: string
  startTime: Date
  endTime?: Date
  status: "active" | "completed"
  totalStudents: number
  presentStudents: number
}

export function ClassSessionManager() {
  const [activeTab, setActiveTab] = useState("session")
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null)
  const [sessionForm, setSessionForm] = useState({
    subject: "",
    class: "",
    section: "",
  })
  const [students, setStudents] = useState<Student[]>([])
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allStudents = studentDB.getAllStudents()
    setStudents(allStudents)

    const today = new Date().toISOString().split("T")[0]
    const attendance = studentDB.getAttendanceByDate(today)
    setTodayAttendance(attendance)
  }

  const startSession = () => {
    if (!sessionForm.subject || !sessionForm.class || !sessionForm.section) return

    const classStudents = students.filter(
      (student) => student.class === sessionForm.class && student.section === sessionForm.section,
    )

    const session: ClassSession = {
      id: `session_${Date.now()}`,
      subject: sessionForm.subject,
      class: sessionForm.class,
      section: sessionForm.section,
      startTime: new Date(),
      status: "active",
      totalStudents: classStudents.length,
      presentStudents: 0,
    }

    setCurrentSession(session)
    console.log("[v0] Started class session:", session)
  }

  const endSession = () => {
    if (!currentSession) return

    const updatedSession: ClassSession = {
      ...currentSession,
      endTime: new Date(),
      status: "completed",
      presentStudents: getSessionAttendanceCount(),
    }

    setCurrentSession(null)
    console.log("[v0] Ended class session:", updatedSession)
  }

  const getSessionAttendanceCount = (): number => {
    if (!currentSession) return 0

    const sessionStudents = students.filter(
      (student) => student.class === currentSession.class && student.section === currentSession.section,
    )

    const presentToday = todayAttendance.filter((record) =>
      sessionStudents.some((student) => student.id === record.studentId),
    )

    return presentToday.length
  }

  const handleStudentRegistered = (student: Student) => {
    loadData()
    setShowRegistration(false)
  }

  const handleAttendanceMarked = (record: AttendanceRecord, student: Student) => {
    setTodayAttendance((prev) => [record, ...prev])
    console.log("[v0] Attendance marked in session:", student.name)
  }

  const getClassStudents = () => {
    if (!currentSession) return []
    return students.filter(
      (student) => student.class === currentSession.class && student.section === currentSession.section,
    )
  }

  const getAttendanceStats = () => {
    const classStudents = getClassStudents()
    const presentStudents = todayAttendance.filter((record) =>
      classStudents.some((student) => student.id === record.studentId),
    )

    return {
      total: classStudents.length,
      present: presentStudents.length,
      absent: classStudents.length - presentStudents.length,
      percentage: classStudents.length > 0 ? (presentStudents.length / classStudents.length) * 100 : 0,
    }
  }

  if (showRegistration) {
    return (
      <TeacherStudentRegistration
        onStudentRegistered={handleStudentRegistered}
        onClose={() => setShowRegistration(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Session Manager</h1>
          <p className="text-muted-foreground mt-1">Manage class sessions, register students, and track attendance</p>
        </div>
        <Button onClick={() => setShowRegistration(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Register Student
        </Button>
      </div>

      {/* Session Status */}
      {currentSession && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Play className="w-5 h-5" />
                  Active Session
                </CardTitle>
                <CardDescription>
                  {currentSession.subject} • {currentSession.class}-{currentSession.section}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {currentSession.startTime.toLocaleTimeString()}
                </Badge>
                <Button onClick={endSession} variant="destructive" size="sm" className="gap-2">
                  <Square className="w-4 h-4" />
                  End Session
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getAttendanceStats().total}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getAttendanceStats().present}</div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getAttendanceStats().absent}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="session" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Session Control
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            Attendance Scanner
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Session Control Tab */}
        <TabsContent value="session" className="space-y-6">
          {!currentSession ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Start New Class Session
                </CardTitle>
                <CardDescription>Configure and start a new class session for attendance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={sessionForm.subject}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter subject name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select
                      value={sessionForm.class}
                      onValueChange={(value) => setSessionForm((prev) => ({ ...prev, class: value }))}
                    >
                      <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={sessionForm.section}
                      onValueChange={(value) => setSessionForm((prev) => ({ ...prev, section: value }))}
                    >
                      <SelectTrigger>
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
                  </div>
                </div>

                <Button
                  onClick={startSession}
                  disabled={!sessionForm.subject || !sessionForm.class || !sessionForm.section}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Class Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Session Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Subject:</span>
                      <div className="font-medium">{currentSession.subject}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <div className="font-medium">
                        {currentSession.class}-{currentSession.section}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <div className="font-medium">{currentSession.startTime.toLocaleTimeString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">
                        {Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)} minutes
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Class Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Class Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getClassStudents().map((student) => {
                      const isPresent = todayAttendance.some((record) => record.studentId === student.id)
                      return (
                        <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.rollNumber}</div>
                          </div>
                          <Badge variant={isPresent ? "default" : "secondary"}>
                            {isPresent ? "Present" : "Absent"}
                          </Badge>
                        </div>
                      )
                    })}
                    {getClassStudents().length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No students registered for this class</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Scanner Tab */}
        <TabsContent value="scanner">
          {currentSession ? (
            <StudentAttendanceScanner
              sessionId={currentSession.id}
              subject={currentSession.subject}
              onAttendanceMarked={handleAttendanceMarked}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
                <p className="text-muted-foreground mb-4">
                  Please start a class session first to enable the attendance scanner.
                </p>
                <Button onClick={() => setActiveTab("session")} className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Start Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Today's Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <div className="text-sm text-muted-foreground">Total Students</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{todayAttendance.length}</div>
                    <div className="text-sm text-muted-foreground">Present Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{currentSession ? "1" : "0"}</div>
                    <div className="text-sm text-muted-foreground">Active Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {students.length > 0 ? Math.round((todayAttendance.length / students.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Attendance Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Today's Attendance
              </CardTitle>
              <CardDescription>All attendance records from today</CardDescription>
            </CardHeader>
            <CardContent>
              {todayAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAttendance.slice(0, 10).map((record) => {
                    const student = studentDB.getStudent(record.studentId)
                    return (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{student?.name || "Unknown Student"}</div>
                          <div className="text-sm text-muted-foreground">
                            {student?.rollNumber} • {student?.class}-{student?.section}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Present</Badge>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

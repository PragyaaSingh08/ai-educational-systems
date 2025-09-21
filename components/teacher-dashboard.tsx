"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserPlus,
  Calendar,
  BarChart3,
  Settings,
  Download,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { studentDB, type Student, type AttendanceRecord } from "@/lib/student-database"
import { StudentRegistration } from "./student-registration"
import { StudentList } from "./student-list"
import { QRCodeGenerator } from "./qr-code-generator"

interface AttendanceStats {
  date: string
  total: number
  present: number
  absent: number
  percentage: number
}

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = () => {
    const allStudents = studentDB.getAllStudents()
    setStudents(allStudents)

    const today = new Date().toISOString().split("T")[0]
    const stats = studentDB.getAttendanceStats(today)
    setAttendanceStats({
      date: today,
      ...stats,
    })

    const todayAttendance = studentDB.getAttendanceByDate(today)
    setRecentAttendance(todayAttendance.slice(-10)) // Last 10 records
  }

  const handleStudentAdded = (student: Student) => {
    setShowAddStudent(false)
    loadDashboardData()
  }

  const exportAttendanceReport = () => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("Export functionality not available in server environment")
      return
    }

    try {
      const today = new Date().toISOString().split("T")[0]
      const attendanceData = studentDB.getAttendanceByDate(today)

      const report = {
        date: today,
        summary: attendanceStats,
        records: attendanceData.map((record) => {
          const student = studentDB.getStudent(record.studentId)
          return {
            ...record,
            studentName: student?.name,
            rollNumber: student?.rollNumber,
            class: student?.class,
            section: student?.section,
          }
        }),
      }

      const dataStr = JSON.stringify(report, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `attendance-report-${today}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export attendance report:", error)
    }
  }

  const getStudentByAttendance = (record: AttendanceRecord) => {
    return studentDB.getStudent(record.studentId)
  }

  if (showAddStudent) {
    return <StudentRegistration onStudentAdded={handleStudentAdded} onClose={() => setShowAddStudent(false)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage students, track attendance, and monitor progress</p>
        </div>
        <Button onClick={() => setShowAddStudent(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{students.length}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{attendanceStats?.present || 0}</p>
                    <p className="text-sm text-muted-foreground">Present Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{attendanceStats?.absent || 0}</p>
                    <p className="text-sm text-muted-foreground">Absent Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {attendanceStats ? Math.round(attendanceStats.percentage) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Attendance
                </CardTitle>
                <CardDescription>Latest attendance records from today</CardDescription>
              </CardHeader>
              <CardContent>
                {recentAttendance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAttendance.map((record) => {
                      const student = getStudentByAttendance(record)
                      return (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{student?.name || "Unknown Student"}</p>
                            <p className="text-sm text-muted-foreground">
                              {student?.rollNumber} • {record.time}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={record.method === "face" ? "default" : "secondary"}>
                              {record.method === "face" ? "Face ID" : "QR Code"}
                            </Badge>
                            {record.confidence && (
                              <Badge variant="outline">{Math.round(record.confidence * 100)}%</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Class Overview
                </CardTitle>
                <CardDescription>Student distribution by class and section</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    students.reduce(
                      (acc, student) => {
                        const key = `${student.class}-${student.section}`
                        acc[key] = (acc[key] || 0) + 1
                        return acc
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([classSection, count]) => (
                    <div key={classSection} className="flex items-center justify-between">
                      <span className="font-medium">Class {classSection}</span>
                      <Badge variant="secondary">{count} students</Badge>
                    </div>
                  ))}

                  {students.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No students registered yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => setShowAddStudent(true)}
                      >
                        Add First Student
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <StudentList
            onAddStudent={() => setShowAddStudent(true)}
            onEditStudent={(student) => {
              // TODO: Implement edit functionality
              console.log("Edit student:", student)
            }}
          />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <QRCodeGenerator />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance Management
                  </CardTitle>
                  <CardDescription>Track and manage student attendance records</CardDescription>
                </div>
                <Button
                  onClick={exportAttendanceReport}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attendanceStats && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Today's Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Students:</span>
                      <span className="ml-2 font-medium">{attendanceStats.total}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Present:</span>
                      <span className="ml-2 font-medium text-green-600">{attendanceStats.present}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Absent:</span>
                      <span className="ml-2 font-medium text-red-600">{attendanceStats.absent}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="ml-2 font-medium">{Math.round(attendanceStats.percentage)}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold">All Students Status</h3>
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No students to track attendance for</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {students.map((student) => {
                      const todayAttendance = recentAttendance.find((r) => r.studentId === student.id)
                      const isPresent = !!todayAttendance

                      return (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isPresent ? "bg-green-500" : "bg-gray-300"}`} />
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.rollNumber} • {student.class}-{student.section}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={isPresent ? "default" : "secondary"}>
                              {isPresent ? "Present" : "Absent"}
                            </Badge>
                            {todayAttendance && (
                              <Badge variant="outline" className="text-xs">
                                {todayAttendance.time}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure attendance system preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Face Recognition Settings</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Confidence threshold: 60%</p>
                    <p>• Auto-attendance marking: Enabled</p>
                    <p>• Face detection interval: 30 FPS</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">QR Code Settings</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• QR code expiry: 24 hours</p>
                    <p>• Auto-refresh: Enabled</p>
                    <p>• Duplicate scan prevention: 5 minutes</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Data Management</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Logs
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { BarChart3, Users, TrendingUp } from "lucide-react"

interface AttendanceData {
  subject: string
  date: string
  timestamp: string
  records: Array<{
    studentId: string
    rollNumber: string
    name: string
    timestamp: string
    confidence: number
  }>
  totalPresent: number
}

interface StudentAttendance {
  rollNumber: string
  name: string
  totalClasses: number
  attendedClasses: number
  attendancePercentage: number
}

export function AttendanceAnalytics() {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [studentStats, setStudentStats] = useState<StudentAttendance[]>([])
  const [subjects, setSubjects] = useState<string[]>([])

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem("attendance_records") || "[]")
    setAttendanceData(records)

    const uniqueSubjects = [...new Set(records.map((r: AttendanceData) => r.subject))]
    setSubjects(uniqueSubjects)
  }, [])

  const calculateAttendanceStats = () => {
    if (!selectedSubject) {
      alert("Please enter a subject name")
      return
    }

    const subjectRecords = attendanceData.filter(
      (record) => record.subject.toLowerCase() === selectedSubject.toLowerCase(),
    )

    if (subjectRecords.length === 0) {
      alert("No attendance records found for this subject")
      return
    }

    const studentMap = new Map<string, StudentAttendance>()
    const allStudents = JSON.parse(localStorage.getItem("students") || "[]")

    allStudents.forEach((student: any) => {
      studentMap.set(student.rollNumber, {
        rollNumber: student.rollNumber,
        name: student.name,
        totalClasses: subjectRecords.length,
        attendedClasses: 0,
        attendancePercentage: 0,
      })
    })

    subjectRecords.forEach((record) => {
      record.records.forEach((studentRecord) => {
        const student = studentMap.get(studentRecord.rollNumber)
        if (student) {
          student.attendedClasses++
        }
      })
    })

    const stats = Array.from(studentMap.values()).map((student) => ({
      ...student,
      attendancePercentage: Math.round((student.attendedClasses / student.totalClasses) * 100),
    }))

    setStudentStats(stats.sort((a, b) => b.attendancePercentage - a.attendancePercentage))
    console.log("[v0] Calculated attendance stats for", selectedSubject, ":", stats.length, "students")
  }

  const chartData = studentStats.slice(0, 10).map((student) => ({
    name: student.name.split(" ")[0], // First name only for chart
    attendance: student.attendancePercentage,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Attendance Analytics
          </CardTitle>
          <CardDescription>View detailed attendance statistics and reports by subject</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-analytics">Subject Name</Label>
            <Input
              id="subject-analytics"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              placeholder="Enter subject name to analyze"
            />
          </div>

          <Button onClick={calculateAttendanceStats} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Analytics
          </Button>

          {subjects.length > 0 && (
            <div className="space-y-2">
              <Label>Available Subjects:</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Attendance Overview - {selectedSubject}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                  <Bar dataKey="attendance" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {studentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Attendance Details
            </CardTitle>
            <CardDescription>Detailed attendance breakdown for {selectedSubject}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {studentStats.map((student, index) => (
                  <div key={student.rollNumber} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">Roll: {student.rollNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={student.attendancePercentage >= 75 ? "default" : "destructive"}>
                          {student.attendancePercentage}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.attendedClasses}/{student.totalClasses} classes
                      </div>
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

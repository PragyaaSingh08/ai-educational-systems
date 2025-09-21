"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Search, Plus, Edit, Trash2, Camera, Upload } from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  class: string
  enrollmentDate: Date
  status: "active" | "inactive"
  faceEnrolled: boolean
  attendanceRate: number
}

export function StudentDatabase() {
  const [searchTerm, setSearchTerm] = useState("")
  const [students] = useState<Student[]>([
    {
      id: "STU001",
      name: "Alice Johnson",
      email: "alice.johnson@school.edu",
      class: "CS-101",
      enrollmentDate: new Date("2024-01-15"),
      status: "active",
      faceEnrolled: true,
      attendanceRate: 95,
    },
    {
      id: "STU002",
      name: "Bob Smith",
      email: "bob.smith@school.edu",
      class: "CS-101",
      enrollmentDate: new Date("2024-01-16"),
      status: "active",
      faceEnrolled: true,
      attendanceRate: 88,
    },
    {
      id: "STU003",
      name: "Carol Davis",
      email: "carol.davis@school.edu",
      class: "CS-102",
      enrollmentDate: new Date("2024-01-17"),
      status: "active",
      faceEnrolled: false,
      attendanceRate: 92,
    },
    {
      id: "STU004",
      name: "David Wilson",
      email: "david.wilson@school.edu",
      class: "CS-101",
      enrollmentDate: new Date("2024-01-18"),
      status: "active",
      faceEnrolled: true,
      attendanceRate: 85,
    },
    {
      id: "STU005",
      name: "Emma Brown",
      email: "emma.brown@school.edu",
      class: "CS-102",
      enrollmentDate: new Date("2024-01-19"),
      status: "inactive",
      faceEnrolled: false,
      attendanceRate: 78,
    },
  ])

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const enrolledCount = students.filter((s) => s.faceEnrolled).length
  const activeCount = students.filter((s) => s.status === "active").length

  return (
    <div className="space-y-6">
      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-green-500" />
              Face Enrolled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{enrolledCount}</div>
            <p className="text-sm text-muted-foreground">
              {((enrolledCount / students.length) * 100).toFixed(0)}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge className="w-5 h-5 text-blue-500" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>Manage student database and facial recognition enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <CardDescription>Manage individual student records and face enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={`/abstract-geometric-shapes.png?height=48&width=48&query=${student.name}`} />
                    <AvatarFallback>
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{student.name}</p>
                      <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                      {student.faceEnrolled && (
                        <Badge variant="outline" className="gap-1">
                          <Camera className="w-3 h-3" />
                          Face Enrolled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>ID: {student.id}</span>
                      <span>Class: {student.class}</span>
                      <span>Attendance: {student.attendanceRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!student.faceEnrolled && (
                    <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                      <Camera className="w-3 h-3" />
                      Enroll Face
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

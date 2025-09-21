"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Plus, TrendingUp, Users, Clock, Target, CheckCircle } from "lucide-react"

interface Subject {
  id: string
  name: string
  code: string
  credits: number
  instructor: string
  enrolledStudents: number
  maxCapacity: number
  completionRate: number
  averageGrade: number
  status: "active" | "completed" | "upcoming"
  category: "core" | "elective" | "lab"
  prerequisites: string[]
  nextDeadline: Date
  totalAssignments: number
  completedAssignments: number
}

interface SubjectTrackerProps {
  semester: string
}

export function SubjectTracker({ semester }: SubjectTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [subjects] = useState<Subject[]>([
    {
      id: "CS101",
      name: "Machine Learning Fundamentals",
      code: "CS-101",
      credits: 4,
      instructor: "Dr. Smith",
      enrolledStudents: 45,
      maxCapacity: 50,
      completionRate: 78,
      averageGrade: 85,
      status: "active",
      category: "core",
      prerequisites: ["CS-100", "MATH-201"],
      nextDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalAssignments: 8,
      completedAssignments: 6,
    },
    {
      id: "CS102",
      name: "Data Structures",
      code: "CS-102",
      credits: 3,
      instructor: "Prof. Johnson",
      enrolledStudents: 30,
      maxCapacity: 35,
      completionRate: 85,
      averageGrade: 82,
      status: "active",
      category: "core",
      prerequisites: ["CS-101"],
      nextDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      totalAssignments: 6,
      completedAssignments: 5,
    },
    {
      id: "CS103",
      name: "Database Systems",
      code: "CS-103",
      credits: 4,
      instructor: "Dr. Brown",
      enrolledStudents: 38,
      maxCapacity: 40,
      completionRate: 72,
      averageGrade: 79,
      status: "active",
      category: "core",
      prerequisites: ["CS-102"],
      nextDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      totalAssignments: 7,
      completedAssignments: 4,
    },
    {
      id: "CS201",
      name: "Advanced Algorithms",
      code: "CS-201",
      credits: 3,
      instructor: "Prof. Davis",
      enrolledStudents: 25,
      maxCapacity: 30,
      completionRate: 90,
      averageGrade: 88,
      status: "completed",
      category: "elective",
      prerequisites: ["CS-102", "MATH-301"],
      nextDeadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      totalAssignments: 5,
      completedAssignments: 5,
    },
    {
      id: "CS301",
      name: "AI Ethics",
      code: "CS-301",
      credits: 2,
      instructor: "Dr. Wilson",
      enrolledStudents: 0,
      maxCapacity: 25,
      completionRate: 0,
      averageGrade: 0,
      status: "upcoming",
      category: "elective",
      prerequisites: ["CS-101"],
      nextDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      totalAssignments: 4,
      completedAssignments: 0,
    },
  ])

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.instructor.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || subject.category === categoryFilter
    const matchesStatus = statusFilter === "all" || subject.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalCredits = subjects.reduce((sum, subject) => sum + subject.credits, 0)
  const activeSubjects = subjects.filter((s) => s.status === "active").length
  const completedSubjects = subjects.filter((s) => s.status === "completed").length
  const overallCompletion = subjects.reduce((sum, s) => sum + s.completionRate, 0) / subjects.length

  return (
    <div className="space-y-6">
      {/* Subject Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalCredits}</div>
            <p className="text-sm text-muted-foreground">{subjects.length} subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Active Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeSubjects}</div>
            <p className="text-sm text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedSubjects}</div>
            <p className="text-sm text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-500" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{overallCompletion.toFixed(0)}%</div>
            <Progress value={overallCompletion} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Management</CardTitle>
          <CardDescription>Track and manage all subjects in your curriculum</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="elective">Elective</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subject List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.code} • {subject.credits} Credits
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      subject.status === "active" ? "default" : subject.status === "completed" ? "secondary" : "outline"
                    }
                  >
                    {subject.status}
                  </Badge>
                  <Badge variant="outline">{subject.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Course Progress</span>
                    <span className="font-medium">{subject.completionRate}%</span>
                  </div>
                  <Progress value={subject.completionRate} className="h-2" />
                </div>

                {/* Assignment Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Assignments</span>
                    <span className="font-medium">
                      {subject.completedAssignments}/{subject.totalAssignments}
                    </span>
                  </div>
                  <Progress value={(subject.completedAssignments / subject.totalAssignments) * 100} className="h-2" />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {subject.enrolledStudents}/{subject.maxCapacity} students
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span>Avg: {subject.averageGrade}%</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Instructor: {subject.instructor}</p>
                  {subject.status === "active" && <p>Next deadline: {subject.nextDeadline.toLocaleDateString()}</p>}
                  {subject.prerequisites.length > 0 && <p>Prerequisites: {subject.prerequisites.join(", ")}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="bg-transparent">
                    View Details
                  </Button>
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No subjects found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

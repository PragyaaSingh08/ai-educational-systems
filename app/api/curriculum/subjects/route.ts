import { type NextRequest, NextResponse } from "next/server"

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

interface CreateSubjectRequest {
  name: string
  code: string
  credits: number
  instructor: string
  maxCapacity: number
  category: "core" | "elective" | "lab"
  prerequisites?: string[]
}

// Mock subjects database
const subjects: Subject[] = [
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
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const semester = searchParams.get("semester")

    let filteredSubjects = [...subjects]

    if (search) {
      const searchLower = search.toLowerCase()
      filteredSubjects = filteredSubjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchLower) ||
          subject.code.toLowerCase().includes(searchLower) ||
          subject.instructor.toLowerCase().includes(searchLower),
      )
    }

    if (status && status !== "all") {
      filteredSubjects = filteredSubjects.filter((subject) => subject.status === status)
    }

    if (category && category !== "all") {
      filteredSubjects = filteredSubjects.filter((subject) => subject.category === category)
    }

    return NextResponse.json({
      success: true,
      subjects: filteredSubjects,
      total: filteredSubjects.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch subjects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSubjectRequest = await request.json()
    const { name, code, credits, instructor, maxCapacity, category, prerequisites = [] } = body

    // Validate required fields
    if (!name || !code || !credits || !instructor || !maxCapacity || !category) {
      return NextResponse.json({ success: false, error: "All required fields must be provided" }, { status: 400 })
    }

    // Check if code already exists
    const existingSubject = subjects.find((s) => s.code === code)
    if (existingSubject) {
      return NextResponse.json({ success: false, error: "Subject with this code already exists" }, { status: 409 })
    }

    const newSubject: Subject = {
      id: code.replace("-", ""),
      name,
      code,
      credits,
      instructor,
      enrolledStudents: 0,
      maxCapacity,
      completionRate: 0,
      averageGrade: 0,
      status: "upcoming",
      category,
      prerequisites,
      nextDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAssignments: 0,
      completedAssignments: 0,
    }

    subjects.push(newSubject)

    return NextResponse.json({
      success: true,
      subject: newSubject,
      message: "Subject created successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create subject" }, { status: 500 })
  }
}

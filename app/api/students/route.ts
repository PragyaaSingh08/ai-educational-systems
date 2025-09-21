import { type NextRequest, NextResponse } from "next/server"

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

interface CreateStudentRequest {
  name: string
  email: string
  class: string
}

// Mock student database
const students: Student[] = [
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
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const classFilter = searchParams.get("class")

    let filteredStudents = [...students]

    if (search) {
      const searchLower = search.toLowerCase()
      filteredStudents = filteredStudents.filter(
        (student) =>
          student.name.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          student.id.toLowerCase().includes(searchLower),
      )
    }

    if (status && status !== "all") {
      filteredStudents = filteredStudents.filter((student) => student.status === status)
    }

    if (classFilter && classFilter !== "all") {
      filteredStudents = filteredStudents.filter((student) => student.class === classFilter)
    }

    return NextResponse.json({
      success: true,
      students: filteredStudents,
      total: filteredStudents.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateStudentRequest = await request.json()
    const { name, email, class: studentClass } = body

    // Validate required fields
    if (!name || !email || !studentClass) {
      return NextResponse.json({ success: false, error: "Name, email, and class are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingStudent = students.find((s) => s.email === email)
    if (existingStudent) {
      return NextResponse.json({ success: false, error: "Student with this email already exists" }, { status: 409 })
    }

    const newStudent: Student = {
      id: `STU${String(students.length + 1).padStart(3, "0")}`,
      name,
      email,
      class: studentClass,
      enrollmentDate: new Date(),
      status: "active",
      faceEnrolled: false,
      attendanceRate: 0,
    }

    students.push(newStudent)

    return NextResponse.json({
      success: true,
      student: newStudent,
      message: "Student created successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create student" }, { status: 500 })
  }
}

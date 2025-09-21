export interface Student {
  id: string
  name: string
  rollNumber: string
  email?: string
  class?: string
  section?: string
  faceImageUrl?: string
  faceDescriptor?: number[] // Face recognition descriptor
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  time: string
  method: "face" | "qr"
  confidence?: number
  status: "present" | "absent" | "late"
}

class StudentDatabase {
  private students: Map<string, Student> = new Map()
  private attendance: AttendanceRecord[] = []

  // Initialize with sample data
  constructor() {
    this.loadFromStorage()
    this.loadSampleData()
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    try {
      const studentsData = localStorage.getItem("eduai_students")
      if (studentsData) {
        const students = JSON.parse(studentsData)
        students.forEach((student: Student) => {
          this.students.set(student.id, student)
        })
        console.log("[v0] Loaded", students.length, "students from storage")
      }

      const attendanceData = localStorage.getItem("eduai_attendance")
      if (attendanceData) {
        this.attendance = JSON.parse(attendanceData)
        console.log("[v0] Loaded", this.attendance.length, "attendance records from storage")
      }
    } catch (error) {
      console.error("[v0] Error loading data from storage:", error)
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    try {
      const studentsArray = Array.from(this.students.values())
      localStorage.setItem("eduai_students", JSON.stringify(studentsArray))
      localStorage.setItem("eduai_attendance", JSON.stringify(this.attendance))
      console.log(
        "[v0] Saved",
        studentsArray.length,
        "students and",
        this.attendance.length,
        "attendance records to storage",
      )
    } catch (error) {
      console.error("[v0] Error saving data to storage:", error)
    }
  }

  // Initialize with sample data
  private loadSampleData() {
    const sampleStudents: Student[] = [
      {
        id: "1",
        name: "John Doe",
        rollNumber: "CS001",
        email: "john.doe@school.edu",
        class: "10th",
        section: "A",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Jane Smith",
        rollNumber: "CS002",
        email: "jane.smith@school.edu",
        class: "10th",
        section: "A",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    sampleStudents.forEach((student) => {
      this.students.set(student.id, student)
    })
  }

  // Student management methods
  addStudent(student: Omit<Student, "id" | "createdAt" | "updatedAt">): Student {
    const newStudent: Student = {
      ...student,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.students.set(newStudent.id, newStudent)
    this.saveToStorage()
    console.log("[v0] Added student:", newStudent.name, "ID:", newStudent.id)
    return newStudent
  }

  updateStudent(id: string, updates: Partial<Student>): Student | null {
    const student = this.students.get(id)
    if (!student) return null

    const updatedStudent = {
      ...student,
      ...updates,
      updatedAt: new Date(),
    }

    this.students.set(id, updatedStudent)
    this.saveToStorage()
    return updatedStudent
  }

  deleteStudent(id: string): boolean {
    const result = this.students.delete(id)
    if (result) {
      this.saveToStorage()
    }
    return result
  }

  getStudent(id: string): Student | null {
    return this.students.get(id) || null
  }

  getStudentByRollNumber(rollNumber: string): Student | null {
    for (const student of this.students.values()) {
      if (student.rollNumber === rollNumber) {
        return student
      }
    }
    return null
  }

  getAllStudents(): Student[] {
    return Array.from(this.students.values())
  }

  searchStudents(query: string): Student[] {
    const lowercaseQuery = query.toLowerCase()
    return Array.from(this.students.values()).filter(
      (student) =>
        student.name.toLowerCase().includes(lowercaseQuery) ||
        student.rollNumber.toLowerCase().includes(lowercaseQuery) ||
        student.email?.toLowerCase().includes(lowercaseQuery),
    )
  }

  // Face recognition methods
  updateStudentFaceData(id: string, faceImageUrl: string, faceDescriptor: number[]): boolean {
    const student = this.students.get(id)
    if (!student) return false

    this.updateStudent(id, { faceImageUrl, faceDescriptor })
    return true
  }

  findStudentByFaceDescriptor(descriptor: number[], threshold = 0.6): Student | null {
    // Simple euclidean distance matching (in real app, use more sophisticated matching)
    let bestMatch: Student | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const student of this.students.values()) {
      if (!student.faceDescriptor) continue

      const distance = this.calculateEuclideanDistance(descriptor, student.faceDescriptor)
      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance
        bestMatch = student
      }
    }

    return bestMatch
  }

  private calculateEuclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Number.POSITIVE_INFINITY

    let sum = 0
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2)
    }
    return Math.sqrt(sum)
  }

  // Attendance methods
  markAttendance(studentId: string, method: "face" | "qr", confidence?: number, subject?: string): AttendanceRecord {
    const student = this.getStudent(studentId)
    if (!student) {
      console.error("[v0] Cannot mark attendance: Student not found:", studentId)
      throw new Error("Student not found")
    }

    const now = new Date()
    const record: AttendanceRecord = {
      id: `${studentId}_${Date.now()}`,
      studentId,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0],
      method,
      confidence,
      status: "present",
    }

    // Check if attendance already marked today
    const todayAttendance = this.attendance.find((r) => r.studentId === studentId && r.date === record.date)

    if (todayAttendance) {
      console.log("[v0] Attendance already marked for", student.name, "today")
      return todayAttendance
    }

    this.attendance.push(record)
    this.saveToStorage()

    console.log("[v0] Attendance marked for:", student.name, "Method:", method, "Confidence:", confidence)

    // Also save to CSV format for compatibility
    this.saveAttendanceToCSV(record, student, subject)

    return record
  }

  private saveAttendanceToCSV(record: AttendanceRecord, student: Student, subject?: string) {
    try {
      const csvData = {
        date: record.date,
        time: record.time,
        studentId: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        method: record.method,
        confidence: record.confidence || 0,
        subject: subject || "General",
        status: record.status,
      }

      // Store in localStorage with subject-based organization
      const csvKey = `attendance_csv_${subject || "general"}_${record.date}`
      const existingCSV = localStorage.getItem(csvKey)
      const csvRecords = existingCSV ? JSON.parse(existingCSV) : []

      // Check if already exists
      const exists = csvRecords.find((r: any) => r.studentId === student.id)
      if (!exists) {
        csvRecords.push(csvData)
        localStorage.setItem(csvKey, JSON.stringify(csvRecords))
        console.log("[v0] Saved attendance to CSV format:", csvKey)
      }
    } catch (error) {
      console.error("[v0] Error saving attendance to CSV:", error)
    }
  }

  getAttendanceBySubjectAndDate(subject: string, date: string): AttendanceRecord[] {
    const csvKey = `attendance_csv_${subject}_${date}`
    const csvData = localStorage.getItem(csvKey)

    if (csvData) {
      try {
        return JSON.parse(csvData).map((record: any) => ({
          id: record.studentId + "_" + date,
          studentId: record.studentId,
          date: record.date,
          time: record.time,
          method: record.method,
          confidence: record.confidence,
          status: record.status,
        }))
      } catch (error) {
        console.error("[v0] Error parsing CSV attendance data:", error)
      }
    }

    return this.attendance.filter((record) => record.date === date)
  }

  exportAttendanceData(subject?: string, date?: string) {
    const targetDate = date || new Date().toISOString().split("T")[0]
    const records = subject
      ? this.getAttendanceBySubjectAndDate(subject, targetDate)
      : this.getAttendanceByDate(targetDate)

    const csvContent = [
      ["Date", "Time", "Student ID", "Roll Number", "Name", "Method", "Confidence", "Status"],
      ...records.map((record) => {
        const student = this.getStudent(record.studentId)
        return [
          record.date,
          record.time,
          record.studentId,
          student?.rollNumber || "Unknown",
          student?.name || "Unknown",
          record.method,
          record.confidence || 0,
          record.status,
        ]
      }),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance_${subject || "all"}_${targetDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  getAttendanceByDate(date: string): AttendanceRecord[] {
    return this.attendance.filter((record) => record.date === date)
  }

  getStudentAttendance(studentId: string): AttendanceRecord[] {
    return this.attendance.filter((record) => record.studentId === studentId)
  }

  getAttendanceStats(date?: string): {
    total: number
    present: number
    absent: number
    percentage: number
  } {
    const targetDate = date || new Date().toISOString().split("T")[0]
    const todayAttendance = this.getAttendanceByDate(targetDate)
    const totalStudents = this.students.size
    const presentStudents = todayAttendance.length

    return {
      total: totalStudents,
      present: presentStudents,
      absent: totalStudents - presentStudents,
      percentage: totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0,
    }
  }
}

// Singleton instance
export const studentDB = new StudentDatabase()

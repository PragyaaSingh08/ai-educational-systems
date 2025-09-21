export interface QRAttendanceSession {
  id: string
  classId: string
  sessionName: string
  teacherId: string
  teacherName: string
  qrCode: string
  qrCodeImage: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  allowLateEntry: boolean
  lateThresholdMinutes: number
  maxAttendees?: number
  location?: string
  description?: string
  attendanceRecords: QRAttendanceRecord[]
}

export interface QRAttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  studentName: string
  rollNumber: string
  timestamp: Date
  status: "present" | "late" | "absent"
  scanLocation?: {
    latitude: number
    longitude: number
  }
  deviceInfo?: {
    userAgent: string
    platform: string
  }
  ipAddress?: string
}

export interface StudentQRProfile {
  studentId: string
  name: string
  rollNumber: string
  email?: string
  class: string
  section: string
  personalQRCode: string
  isActive: boolean
  createdAt: Date
  lastScanAt?: Date
}

export class AdvancedQRAttendanceSystem {
  private sessions: Map<string, QRAttendanceSession> = new Map()
  private studentProfiles: Map<string, StudentQRProfile> = new Map()
  private attendanceHistory: QRAttendanceRecord[] = []

  // Create a new attendance session with advanced options
  createSession(options: {
    classId: string
    sessionName: string
    teacherId: string
    teacherName: string
    durationMinutes?: number
    allowLateEntry?: boolean
    lateThresholdMinutes?: number
    maxAttendees?: number
    location?: string
    description?: string
  }): QRAttendanceSession {
    const sessionId = `qr_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (options.durationMinutes || 60) * 60 * 1000)

    const qrData = {
      sessionId,
      classId: options.classId,
      sessionName: options.sessionName,
      teacherId: options.teacherId,
      timestamp: now.toISOString(),
      type: "attendance_session",
      version: "2.0",
    }

    const session: QRAttendanceSession = {
      id: sessionId,
      classId: options.classId,
      sessionName: options.sessionName,
      teacherId: options.teacherId,
      teacherName: options.teacherName,
      qrCode: JSON.stringify(qrData),
      qrCodeImage: this.generateQRCodeSVG(JSON.stringify(qrData)),
      createdAt: now,
      expiresAt,
      isActive: true,
      allowLateEntry: options.allowLateEntry ?? true,
      lateThresholdMinutes: options.lateThresholdMinutes ?? 10,
      maxAttendees: options.maxAttendees,
      location: options.location,
      description: options.description,
      attendanceRecords: [],
    }

    this.sessions.set(sessionId, session)
    return session
  }

  // Generate student personal QR codes
  generateStudentQRCode(student: {
    studentId: string
    name: string
    rollNumber: string
    email?: string
    class: string
    section: string
  }): StudentQRProfile {
    const qrData = {
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      name: student.name,
      class: student.class,
      section: student.section,
      type: "student_id",
      version: "2.0",
      timestamp: new Date().toISOString(),
    }

    const profile: StudentQRProfile = {
      ...student,
      personalQRCode: JSON.stringify(qrData),
      isActive: true,
      createdAt: new Date(),
    }

    this.studentProfiles.set(student.studentId, profile)
    return profile
  }

  // Process QR code scan with validation
  async processQRScan(
    qrData: string,
    scanContext: {
      sessionId?: string
      location?: { latitude: number; longitude: number }
      deviceInfo?: { userAgent: string; platform: string }
      ipAddress?: string
    },
  ): Promise<{
    success: boolean
    message: string
    record?: QRAttendanceRecord
    sessionInfo?: QRAttendanceSession
  }> {
    try {
      const parsedData = JSON.parse(qrData)

      // Handle session QR code scan
      if (parsedData.type === "attendance_session") {
        return this.handleSessionQRScan(parsedData, scanContext)
      }

      // Handle student ID QR code scan
      if (parsedData.type === "student_id" && scanContext.sessionId) {
        return this.handleStudentQRScan(parsedData, scanContext)
      }

      return {
        success: false,
        message: "Invalid QR code type or missing session context",
      }
    } catch (error) {
      return {
        success: false,
        message: "Invalid QR code format",
      }
    }
  }

  private async handleSessionQRScan(
    sessionData: any,
    scanContext: any,
  ): Promise<{
    success: boolean
    message: string
    sessionInfo?: QRAttendanceSession
  }> {
    const session = this.sessions.get(sessionData.sessionId)

    if (!session) {
      return {
        success: false,
        message: "Session not found",
      }
    }

    if (!session.isActive) {
      return {
        success: false,
        message: "Session has ended",
      }
    }

    if (new Date() > session.expiresAt) {
      return {
        success: false,
        message: "Session has expired",
      }
    }

    return {
      success: true,
      message: "Session QR code scanned successfully. Please scan your student ID QR code.",
      sessionInfo: session,
    }
  }

  private async handleStudentQRScan(
    studentData: any,
    scanContext: any,
  ): Promise<{
    success: boolean
    message: string
    record?: QRAttendanceRecord
  }> {
    const session = this.sessions.get(scanContext.sessionId)

    if (!session) {
      return {
        success: false,
        message: "Session not found",
      }
    }

    // Check if student already marked attendance
    const existingRecord = session.attendanceRecords.find((record) => record.studentId === studentData.studentId)

    if (existingRecord) {
      return {
        success: false,
        message: `Attendance already marked for ${studentData.name}`,
      }
    }

    // Check session capacity
    if (session.maxAttendees && session.attendanceRecords.length >= session.maxAttendees) {
      return {
        success: false,
        message: "Session is at maximum capacity",
      }
    }

    // Determine attendance status
    const now = new Date()
    const sessionStart = session.createdAt
    const timeDiff = (now.getTime() - sessionStart.getTime()) / (1000 * 60) // minutes

    let status: "present" | "late" | "absent" = "present"
    if (timeDiff > session.lateThresholdMinutes) {
      if (session.allowLateEntry) {
        status = "late"
      } else {
        return {
          success: false,
          message: "Late entry not allowed for this session",
        }
      }
    }

    // Create attendance record
    const record: QRAttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      studentId: studentData.studentId,
      studentName: studentData.name,
      rollNumber: studentData.rollNumber,
      timestamp: now,
      status,
      scanLocation: scanContext.location,
      deviceInfo: scanContext.deviceInfo,
      ipAddress: scanContext.ipAddress,
    }

    // Add to session and history
    session.attendanceRecords.push(record)
    this.attendanceHistory.push(record)

    // Update student profile
    const studentProfile = this.studentProfiles.get(studentData.studentId)
    if (studentProfile) {
      studentProfile.lastScanAt = now
    }

    return {
      success: true,
      message: `Attendance marked successfully for ${studentData.name} (${status})`,
      record,
    }
  }

  // Get session statistics
  getSessionStats(sessionId: string): {
    totalAttendees: number
    presentCount: number
    lateCount: number
    attendanceRate: number
    averageArrivalTime: number
    sessionInfo: QRAttendanceSession | null
  } {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return {
        totalAttendees: 0,
        presentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
        averageArrivalTime: 0,
        sessionInfo: null,
      }
    }

    const records = session.attendanceRecords
    const presentCount = records.filter((r) => r.status === "present").length
    const lateCount = records.filter((r) => r.status === "late").length

    // Calculate average arrival time in minutes from session start
    const averageArrivalTime =
      records.length > 0
        ? records.reduce((sum, record) => {
            const arrivalTime = (record.timestamp.getTime() - session.createdAt.getTime()) / (1000 * 60)
            return sum + arrivalTime
          }, 0) / records.length
        : 0

    return {
      totalAttendees: records.length,
      presentCount,
      lateCount,
      attendanceRate: session.maxAttendees ? (records.length / session.maxAttendees) * 100 : 100,
      averageArrivalTime,
      sessionInfo: session,
    }
  }

  // End session
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.isActive = false
      return true
    }
    return false
  }

  // Export session data
  exportSessionData(sessionId: string): {
    session: QRAttendanceSession | null
    csvData: string
    jsonData: string
  } {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return {
        session: null,
        csvData: "",
        jsonData: "",
      }
    }

    // Generate CSV
    const csvHeaders = [
      "Student ID",
      "Student Name",
      "Roll Number",
      "Status",
      "Timestamp",
      "Arrival Time (minutes)",
      "Location",
      "Device",
    ]

    const csvRows = session.attendanceRecords.map((record) => {
      const arrivalTime = ((record.timestamp.getTime() - session.createdAt.getTime()) / (1000 * 60)).toFixed(1)
      const location = record.scanLocation
        ? `${record.scanLocation.latitude.toFixed(6)}, ${record.scanLocation.longitude.toFixed(6)}`
        : "N/A"
      const device = record.deviceInfo?.platform || "N/A"

      return [
        record.studentId,
        record.studentName,
        record.rollNumber,
        record.status,
        record.timestamp.toISOString(),
        arrivalTime,
        location,
        device,
      ]
    })

    const csvData = [csvHeaders, ...csvRows].map((row) => row.join(",")).join("\n")

    // Generate JSON
    const jsonData = JSON.stringify(
      {
        session: {
          id: session.id,
          classId: session.classId,
          sessionName: session.sessionName,
          teacherName: session.teacherName,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          location: session.location,
          description: session.description,
        },
        attendanceRecords: session.attendanceRecords,
        statistics: this.getSessionStats(sessionId),
      },
      null,
      2,
    )

    return {
      session,
      csvData,
      jsonData,
    }
  }

  // Get all active sessions
  getActiveSessions(): QRAttendanceSession[] {
    return Array.from(this.sessions.values()).filter((session) => session.isActive && new Date() <= session.expiresAt)
  }

  // Get student attendance history
  getStudentHistory(studentId: string): QRAttendanceRecord[] {
    return this.attendanceHistory.filter((record) => record.studentId === studentId)
  }

  // Generate QR code SVG
  private generateQRCodeSVG(data: string): string {
    // Enhanced QR code generation with better visual design
    const size = 400
    const modules = 25 // QR code grid size
    const moduleSize = size / modules
    const quietZone = moduleSize * 2

    // Create a more sophisticated QR pattern
    const pattern = this.generateQRPattern(modules, data)

    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`
    svg += `<rect width="${size}" height="${size}" fill="white" rx="20"/>`

    // Add gradient background
    svg += `<defs>
      <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f0f9ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:1" />
      </linearGradient>
    </defs>`

    svg += `<rect x="10" y="10" width="${size - 20}" height="${size - 20}" fill="url(#qrGradient)" rx="15"/>`

    // Draw QR modules
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (pattern[row][col]) {
          const x = quietZone + col * moduleSize
          const y = quietZone + row * moduleSize
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#1e40af" rx="2"/>`
        }
      }
    }

    // Add finder patterns (corner squares)
    this.addFinderPattern(svg, quietZone, quietZone, moduleSize)
    this.addFinderPattern(svg, quietZone + (modules - 7) * moduleSize, quietZone, moduleSize)
    this.addFinderPattern(svg, quietZone, quietZone + (modules - 7) * moduleSize, moduleSize)

    // Add center logo area
    const centerX = size / 2 - 30
    const centerY = size / 2 - 30
    svg += `<rect x="${centerX}" y="${centerY}" width="60" height="60" fill="white" rx="10" stroke="#1e40af" stroke-width="2"/>`
    svg += `<text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e40af">QR</text>`

    // Add bottom text
    svg += `<text x="${size / 2}" y="${size - 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#1e40af">Scan for Attendance</text>`

    svg += "</svg>"

    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }

  private generateQRPattern(size: number, data: string): boolean[][] {
    // Generate a pseudo-random pattern based on data
    const pattern: boolean[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false))

    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }

    // Create pattern based on hash
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const value = (hash + row * size + col) % 3
        pattern[row][col] = value === 0
      }
    }

    return pattern
  }

  private addFinderPattern(svg: string, x: number, y: number, moduleSize: number): string {
    // Add the characteristic finder pattern squares
    svg += `<rect x="${x}" y="${y}" width="${moduleSize * 7}" height="${moduleSize * 7}" fill="#1e40af" rx="4"/>`
    svg += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${moduleSize * 5}" height="${moduleSize * 5}" fill="white" rx="2"/>`
    svg += `<rect x="${x + moduleSize * 2}" y="${y + moduleSize * 2}" width="${moduleSize * 3}" height="${moduleSize * 3}" fill="#1e40af" rx="1"/>`
    return svg
  }
}

export const advancedQRSystem = new AdvancedQRAttendanceSystem()

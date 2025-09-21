import { type NextRequest, NextResponse } from "next/server"

interface ScheduleItem {
  id: string
  subject: string
  type: "lecture" | "lab" | "seminar" | "exam"
  time: string
  duration: number
  room: string
  instructor: string
  students: number
  maxCapacity: number
  conflicts: string[]
  aiOptimized: boolean
  day: string
}

interface CreateScheduleRequest {
  subject: string
  type: "lecture" | "lab" | "seminar" | "exam"
  time: string
  duration: number
  room: string
  instructor: string
  maxCapacity: number
  day: string
}

// Mock schedule database
const scheduleItems: ScheduleItem[] = [
  {
    id: "1",
    subject: "Machine Learning Fundamentals",
    type: "lecture",
    time: "09:00",
    duration: 90,
    room: "Room A-101",
    instructor: "Dr. Smith",
    students: 45,
    maxCapacity: 50,
    conflicts: [],
    aiOptimized: true,
    day: "Monday",
  },
  {
    id: "2",
    subject: "Data Structures",
    type: "lab",
    time: "11:00",
    duration: 120,
    room: "Lab B-201",
    instructor: "Prof. Johnson",
    students: 30,
    maxCapacity: 35,
    conflicts: [],
    aiOptimized: true,
    day: "Monday",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const day = searchParams.get("day")
    const semester = searchParams.get("semester")

    let filteredSchedule = [...scheduleItems]

    if (day) {
      filteredSchedule = filteredSchedule.filter((item) => item.day === day)
    }

    return NextResponse.json({
      success: true,
      schedule: filteredSchedule,
      total: filteredSchedule.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch schedule" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateScheduleRequest = await request.json()
    const { subject, type, time, duration, room, instructor, maxCapacity, day } = body

    // Validate required fields
    if (!subject || !type || !time || !duration || !room || !instructor || !maxCapacity || !day) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Check for conflicts
    const conflicts: string[] = []
    const existingItems = scheduleItems.filter((item) => item.day === day && item.room === room && item.time === time)

    if (existingItems.length > 0) {
      conflicts.push(`Room conflict with ${existingItems[0].subject}`)
    }

    const newScheduleItem: ScheduleItem = {
      id: `schedule_${Date.now()}`,
      subject,
      type,
      time,
      duration,
      room,
      instructor,
      students: 0,
      maxCapacity,
      conflicts,
      aiOptimized: conflicts.length === 0,
      day,
    }

    scheduleItems.push(newScheduleItem)

    return NextResponse.json({
      success: true,
      scheduleItem: newScheduleItem,
      message: "Schedule item created successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create schedule item" }, { status: 500 })
  }
}

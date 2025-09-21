"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Brain, Plus, Edit, Trash2, AlertTriangle } from "lucide-react"

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
}

interface CurriculumSchedulerProps {
  semester: string
}

export function CurriculumScheduler({ semester }: CurriculumSchedulerProps) {
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [schedule] = useState<Record<string, ScheduleItem[]>>({
    Monday: [
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
      },
      {
        id: "3",
        subject: "Database Systems",
        type: "lecture",
        time: "14:00",
        duration: 90,
        room: "Room A-102",
        instructor: "Dr. Brown",
        students: 38,
        maxCapacity: 40,
        conflicts: ["Room conflict with CS-201"],
        aiOptimized: false,
      },
    ],
    Tuesday: [
      {
        id: "4",
        subject: "Algorithms",
        type: "lecture",
        time: "10:00",
        duration: 90,
        room: "Room A-103",
        instructor: "Prof. Davis",
        students: 42,
        maxCapacity: 45,
        conflicts: [],
        aiOptimized: true,
      },
      {
        id: "5",
        subject: "Software Engineering",
        type: "seminar",
        time: "13:00",
        duration: 60,
        room: "Seminar Room C-301",
        instructor: "Dr. Wilson",
        students: 25,
        maxCapacity: 30,
        conflicts: [],
        aiOptimized: true,
      },
    ],
    Wednesday: [
      {
        id: "6",
        subject: "Machine Learning Fundamentals",
        type: "lab",
        time: "09:00",
        duration: 120,
        room: "Lab B-202",
        instructor: "Dr. Smith",
        students: 45,
        maxCapacity: 50,
        conflicts: [],
        aiOptimized: true,
      },
    ],
    Thursday: [
      {
        id: "7",
        subject: "Database Systems",
        type: "lab",
        time: "11:00",
        duration: 120,
        room: "Lab B-203",
        instructor: "Dr. Brown",
        students: 38,
        maxCapacity: 40,
        conflicts: [],
        aiOptimized: true,
      },
    ],
    Friday: [
      {
        id: "8",
        subject: "Final Examinations",
        type: "exam",
        time: "09:00",
        duration: 180,
        room: "Exam Hall",
        instructor: "Multiple",
        students: 150,
        maxCapacity: 200,
        conflicts: [],
        aiOptimized: true,
      },
    ],
  })

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const currentSchedule = schedule[selectedDay] || []

  const totalConflicts = Object.values(schedule)
    .flat()
    .reduce((sum, item) => sum + item.conflicts.length, 0)

  const aiOptimizedCount = Object.values(schedule)
    .flat()
    .filter((item) => item.aiOptimized).length

  const totalClasses = Object.values(schedule).flat().length

  return (
    <div className="space-y-6">
      {/* AI Optimization Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Optimized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{aiOptimizedCount}</div>
            <p className="text-sm text-muted-foreground">
              {((aiOptimizedCount / totalClasses) * 100).toFixed(0)}% of schedule
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{totalConflicts}</div>
            <p className="text-sm text-muted-foreground">Scheduling conflicts detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalClasses}</div>
            <p className="text-sm text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Actions */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Schedule Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically resolve conflicts and optimize room utilization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Brain className="w-4 h-4" />
                Auto-Optimize
              </Button>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Class
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule - {semester}</CardTitle>
          <CardDescription>AI-assisted scheduling with conflict detection and optimization</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day Selector */}
          <div className="flex items-center gap-2 mb-6">
            {days.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                onClick={() => setSelectedDay(day)}
                className="bg-transparent"
              >
                {day}
              </Button>
            ))}
          </div>

          {/* Schedule Items */}
          <div className="space-y-4">
            {currentSchedule.length > 0 ? (
              currentSchedule.map((item) => (
                <Card key={item.id} className={`relative ${item.conflicts.length > 0 ? "border-yellow-500/50" : ""}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{item.time}</div>
                          <div className="text-sm text-muted-foreground">{item.duration}min</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.subject}</h3>
                            <Badge
                              variant={
                                item.type === "lecture"
                                  ? "default"
                                  : item.type === "lab"
                                    ? "secondary"
                                    : item.type === "exam"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {item.type}
                            </Badge>
                            {item.aiOptimized && (
                              <Badge variant="outline" className="gap-1">
                                <Brain className="w-3 h-3" />
                                AI Optimized
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.room}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {item.students}/{item.maxCapacity}
                            </div>
                            <span>{item.instructor}</span>
                          </div>
                          {item.conflicts.length > 0 && (
                            <div className="mt-2">
                              {item.conflicts.map((conflict, index) => (
                                <Badge key={index} variant="destructive" className="mr-1 text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  {conflict}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No classes scheduled for {selectedDay}</p>
                <p>Add a new class to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

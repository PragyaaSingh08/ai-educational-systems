"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Download, Filter, Clock, User } from "lucide-react"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  timestamp: Date
  confidence: number
  status: "present" | "absent" | "late"
  method: "facial_recognition" | "manual"
}

interface AttendanceHistoryProps {
  records: AttendanceRecord[]
}

export function AttendanceHistory({ records }: AttendanceHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("today")

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || record.status === statusFilter

    const today = new Date()
    const recordDate = record.timestamp
    let matchesDate = true

    if (dateFilter === "today") {
      matchesDate = recordDate.toDateString() === today.toDateString()
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = recordDate >= weekAgo
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchesDate = recordDate >= monthAgo
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const exportData = () => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("Export functionality not available in server environment")
      return
    }

    try {
      const csvContent = [
        ["Student ID", "Student Name", "Timestamp", "Status", "Confidence", "Method"],
        ...filteredRecords.map((record) => [
          record.studentId,
          record.studentName,
          record.timestamp.toISOString(),
          record.status,
          (record.confidence * 100).toFixed(1) + "%",
          record.method,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export data:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Attendance History
          </CardTitle>
          <CardDescription>View and filter attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportData} variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Records</CardTitle>
              <CardDescription>
                Showing {filteredRecords.length} of {records.length} records
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Filter className="w-3 h-3" />
              {filteredRecords.length} filtered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-muted-foreground">ID: {record.studentId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {record.timestamp.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {record.method === "facial_recognition" ? "AI Recognition" : "Manual Entry"} •
                        {(record.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>

                    <Badge
                      variant={
                        record.status === "present" ? "default" : record.status === "late" ? "secondary" : "destructive"
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No records found</p>
                <p>Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

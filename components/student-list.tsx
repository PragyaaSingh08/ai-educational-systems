"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Edit, Trash2, Users, Plus } from "lucide-react"
import { studentDB, type Student } from "@/lib/student-database"

interface StudentListProps {
  onAddStudent?: () => void
  onEditStudent?: (student: Student) => void
}

export function StudentList({ onAddStudent, onEditStudent }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredStudents(studentDB.searchStudents(searchQuery))
    } else {
      setFilteredStudents(students)
    }
  }, [searchQuery, students])

  const loadStudents = () => {
    const allStudents = studentDB.getAllStudents()
    setStudents(allStudents)
    setFilteredStudents(allStudents)
  }

  const handleDeleteStudent = (studentId: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      studentDB.deleteStudent(studentId)
      loadStudents()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription>Manage student records and information</CardDescription>
          </div>
          <Button onClick={onAddStudent} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students by name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No students found" : "No students registered"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Start by adding your first student"}
            </p>
            {!searchQuery && <Button onClick={onAddStudent}>Add First Student</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.faceImageUrl || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                      <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
                      {student.email && <p className="text-sm text-gray-500 truncate">{student.email}</p>}

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {student.class}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Sec {student.section}
                        </Badge>
                        {student.faceImageUrl && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            Face ID
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => onEditStudent?.(student)} className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

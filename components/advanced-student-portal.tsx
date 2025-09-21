"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  User,
  Upload,
  Camera,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Download,
  Mail,
  GraduationCap,
  Users,
  FileText,
  Shield,
} from "lucide-react"
import { advancedFaceRecognition } from "@/lib/advanced-face-recognition"
import { advancedQRSystem } from "@/lib/advanced-qr-system"
import { studentDB } from "@/lib/student-database"

interface StudentFormData {
  // Personal Information
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  gender: string
  nationality: string

  // Contact Information
  email: string
  phone: string
  alternatePhone?: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string

  // Academic Information
  rollNumber: string
  studentId: string
  class: string
  section: string
  department: string
  program: string
  yearOfAdmission: string
  expectedGraduation: string

  // Guardian Information
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  guardianEmail?: string
  guardianAddress?: string

  // Emergency Contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string

  // Additional Information
  bloodGroup?: string
  medicalConditions?: string
  allergies?: string
  hobbies?: string
  previousSchool?: string

  // System Settings
  enableFaceRecognition: boolean
  enableQRCode: boolean
  enableNotifications: boolean
  privacyLevel: "public" | "private" | "restricted"
}

export function AdvancedStudentPortal() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    rollNumber: "",
    studentId: "",
    class: "",
    section: "",
    department: "",
    program: "",
    yearOfAdmission: "",
    expectedGraduation: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    enableFaceRecognition: true,
    enableQRCode: true,
    enableNotifications: true,
    privacyLevel: "private",
  })

  const [faceImages, setFaceImages] = useState<File[]>([])
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [documents, setDocuments] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [studentQRCode, setStudentQRCode] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const faceInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const steps = [
    { id: 0, title: "Personal Info", icon: User },
    { id: 1, title: "Contact Details", icon: Mail },
    { id: 2, title: "Academic Info", icon: GraduationCap },
    { id: 3, title: "Guardian Info", icon: Users },
    { id: 4, title: "Biometric Setup", icon: Camera },
    { id: 5, title: "Documents", icon: FileText },
    { id: 6, title: "Privacy Settings", icon: Shield },
  ]

  const handleInputChange = (field: keyof StudentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
        if (!formData.gender) newErrors.gender = "Gender is required"
        if (!formData.nationality) newErrors.nationality = "Nationality is required"
        break

      case 1: // Contact Details
        if (!formData.email.trim()) newErrors.email = "Email is required"
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format"
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
        if (!formData.address.trim()) newErrors.address = "Address is required"
        if (!formData.city.trim()) newErrors.city = "City is required"
        if (!formData.country.trim()) newErrors.country = "Country is required"
        break

      case 2: // Academic Info
        if (!formData.rollNumber.trim()) newErrors.rollNumber = "Roll number is required"
        if (!formData.studentId.trim()) newErrors.studentId = "Student ID is required"
        if (!formData.class) newErrors.class = "Class is required"
        if (!formData.section) newErrors.section = "Section is required"
        if (!formData.department) newErrors.department = "Department is required"
        if (!formData.program) newErrors.program = "Program is required"
        if (!formData.yearOfAdmission) newErrors.yearOfAdmission = "Year of admission is required"

        // Check for duplicate roll number
        if (formData.rollNumber && studentDB.getStudentByRollNumber(formData.rollNumber)) {
          newErrors.rollNumber = "Roll number already exists"
        }
        break

      case 3: // Guardian Info
        if (!formData.guardianName.trim()) newErrors.guardianName = "Guardian name is required"
        if (!formData.guardianRelation) newErrors.guardianRelation = "Guardian relation is required"
        if (!formData.guardianPhone.trim()) newErrors.guardianPhone = "Guardian phone is required"
        if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = "Emergency contact name is required"
        if (!formData.emergencyContactPhone.trim())
          newErrors.emergencyContactPhone = "Emergency contact phone is required"
        if (!formData.emergencyContactRelation)
          newErrors.emergencyContactRelation = "Emergency contact relation is required"
        break

      case 4: // Biometric Setup
        if (formData.enableFaceRecognition && faceImages.length < 2) {
          newErrors.faceImages = "At least 2 face images required for face recognition"
        }
        break

      case 5: // Documents
        // Optional validation for documents
        break

      case 6: // Privacy Settings
        if (!formData.privacyLevel) newErrors.privacyLevel = "Privacy level is required"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFaceImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFaceImages((prev) => [...prev, ...files])
  }

  const handleDocumentsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setDocuments((prev) => [...prev, ...files])
  }

  const removeFaceImage = (index: number) => {
    setFaceImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)

    try {
      // Create student record
      const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`

      const newStudent = studentDB.addStudent({
        name: fullName,
        rollNumber: formData.rollNumber,
        email: formData.email,
        class: formData.class,
        section: formData.section,
        faceImageUrl: profileImage || undefined,
      })

      // Setup face recognition if enabled
      if (formData.enableFaceRecognition && faceImages.length >= 2) {
        await advancedFaceRecognition.trainStudent({
          studentId: newStudent.id,
          name: fullName,
          rollNumber: formData.rollNumber,
          images: faceImages,
        })
      }

      // Generate QR code if enabled
      if (formData.enableQRCode) {
        const qrProfile = advancedQRSystem.generateStudentQRCode({
          studentId: newStudent.id,
          name: fullName,
          rollNumber: formData.rollNumber,
          email: formData.email,
          class: formData.class,
          section: formData.section,
        })
        setStudentQRCode(qrProfile.personalQRCode)
      }

      setRegistrationComplete(true)
    } catch (error) {
      setErrors({ submit: "Registration failed. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadStudentCard = () => {
    // Generate and download student ID card
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    canvas.width = 400
    canvas.height = 250

    // Draw student card background
    ctx.fillStyle = "#1e40af"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "white"
    ctx.font = "bold 18px Arial"
    ctx.fillText("STUDENT ID CARD", 20, 30)

    ctx.font = "14px Arial"
    ctx.fillText(`Name: ${formData.firstName} ${formData.lastName}`, 20, 60)
    ctx.fillText(`Roll No: ${formData.rollNumber}`, 20, 80)
    ctx.fillText(`Class: ${formData.class} - ${formData.section}`, 20, 100)
    ctx.fillText(`Department: ${formData.department}`, 20, 120)

    // Download the card
    const link = document.createElement("a")
    link.download = `student-card-${formData.rollNumber}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const getStepProgress = () => {
    return ((currentStep + 1) / steps.length) * 100
  }

  if (registrationComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Registration Complete!</CardTitle>
          <CardDescription>
            Welcome {formData.firstName}! Your student account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Student Details</h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Name:</strong> {formData.firstName} {formData.lastName}
                </p>
                <p>
                  <strong>Roll Number:</strong> {formData.rollNumber}
                </p>
                <p>
                  <strong>Student ID:</strong> {formData.studentId}
                </p>
                <p>
                  <strong>Class:</strong> {formData.class} - {formData.section}
                </p>
                <p>
                  <strong>Department:</strong> {formData.department}
                </p>
              </div>
            </div>

            {studentQRCode && (
              <div className="text-center">
                <h3 className="font-semibold mb-2">Your QR Code</h3>
                <div className="w-32 h-32 mx-auto bg-white p-2 border rounded">
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Use this for attendance</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={downloadStudentCard} className="gap-2">
              <Download className="w-4 h-4" />
              Download Student Card
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Register Another Student
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          Advanced Student Registration Portal
        </CardTitle>
        <CardDescription>Complete student registration with biometric setup and document management</CardDescription>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </span>
            <span>{Math.round(getStepProgress())}% Complete</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                        ? "bg-primary border-primary text-white"
                        : "bg-muted border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-xs mt-1 text-center">{step.title}</span>
              </div>
            )
          })}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Step 0: Personal Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName || ""}
                    onChange={(e) => handleInputChange("middleName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    className={errors.nationality ? "border-red-500" : ""}
                  />
                  {errors.nationality && <p className="text-sm text-red-500">{errors.nationality}</p>}
                </div>
              </div>

              {/* Profile Image Upload */}
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-4">
                  {profileImage ? (
                    <img
                      src={profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Contact Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={formData.alternatePhone || ""}
                    onChange={(e) => handleInputChange("alternatePhone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className={errors.address ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className={errors.country ? "border-red-500" : ""}
                  />
                  {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number *</Label>
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange("rollNumber", e.target.value)}
                    className={errors.rollNumber ? "border-red-500" : ""}
                  />
                  {errors.rollNumber && <p className="text-sm text-red-500">{errors.rollNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => handleInputChange("studentId", e.target.value)}
                    className={errors.studentId ? "border-red-500" : ""}
                  />
                  {errors.studentId && <p className="text-sm text-red-500">{errors.studentId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Class/Year *</Label>
                  <Select value={formData.class} onValueChange={(value) => handleInputChange("class", value)}>
                    <SelectTrigger className={errors.class ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9th">9th Grade</SelectItem>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                      <SelectItem value="freshman">Freshman</SelectItem>
                      <SelectItem value="sophomore">Sophomore</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.class && <p className="text-sm text-red-500">{errors.class}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section *</Label>
                  <Select value={formData.section} onValueChange={(value) => handleInputChange("section", value)}>
                    <SelectTrigger className={errors.section ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Section A</SelectItem>
                      <SelectItem value="B">Section B</SelectItem>
                      <SelectItem value="C">Section C</SelectItem>
                      <SelectItem value="D">Section D</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.section && <p className="text-sm text-red-500">{errors.section}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CS">Computer Science</SelectItem>
                      <SelectItem value="EE">Electrical Engineering</SelectItem>
                      <SelectItem value="ME">Mechanical Engineering</SelectItem>
                      <SelectItem value="CE">Civil Engineering</SelectItem>
                      <SelectItem value="BBA">Business Administration</SelectItem>
                      <SelectItem value="MATH">Mathematics</SelectItem>
                      <SelectItem value="PHYS">Physics</SelectItem>
                      <SelectItem value="CHEM">Chemistry</SelectItem>
                      <SelectItem value="BIO">Biology</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <Select value={formData.program} onValueChange={(value) => handleInputChange("program", value)}>
                    <SelectTrigger className={errors.program ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.program && <p className="text-sm text-red-500">{errors.program}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfAdmission">Year of Admission *</Label>
                  <Input
                    id="yearOfAdmission"
                    type="number"
                    min="2000"
                    max="2030"
                    value={formData.yearOfAdmission}
                    onChange={(e) => handleInputChange("yearOfAdmission", e.target.value)}
                    className={errors.yearOfAdmission ? "border-red-500" : ""}
                  />
                  {errors.yearOfAdmission && <p className="text-sm text-red-500">{errors.yearOfAdmission}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedGraduation">Expected Graduation</Label>
                  <Input
                    id="expectedGraduation"
                    type="number"
                    min="2020"
                    max="2035"
                    value={formData.expectedGraduation}
                    onChange={(e) => handleInputChange("expectedGraduation", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousSchool">Previous School/Institution</Label>
                <Input
                  id="previousSchool"
                  value={formData.previousSchool || ""}
                  onChange={(e) => handleInputChange("previousSchool", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Guardian Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Guardian & Emergency Contact Information</h3>

              <div className="space-y-4">
                <h4 className="font-medium text-primary">Guardian Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name *</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) => handleInputChange("guardianName", e.target.value)}
                      className={errors.guardianName ? "border-red-500" : ""}
                    />
                    {errors.guardianName && <p className="text-sm text-red-500">{errors.guardianName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianRelation">Relation *</Label>
                    <Select
                      value={formData.guardianRelation}
                      onValueChange={(value) => handleInputChange("guardianRelation", value)}
                    >
                      <SelectTrigger className={errors.guardianRelation ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="guardian">Legal Guardian</SelectItem>
                        <SelectItem value="uncle">Uncle</SelectItem>
                        <SelectItem value="aunt">Aunt</SelectItem>
                        <SelectItem value="grandparent">Grandparent</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.guardianRelation && <p className="text-sm text-red-500">{errors.guardianRelation}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Guardian Phone *</Label>
                    <Input
                      id="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={(e) => handleInputChange("guardianPhone", e.target.value)}
                      className={errors.guardianPhone ? "border-red-500" : ""}
                    />
                    {errors.guardianPhone && <p className="text-sm text-red-500">{errors.guardianPhone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">Guardian Email</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      value={formData.guardianEmail || ""}
                      onChange={(e) => handleInputChange("guardianEmail", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianAddress">Guardian Address</Label>
                  <Textarea
                    id="guardianAddress"
                    value={formData.guardianAddress || ""}
                    onChange={(e) => handleInputChange("guardianAddress", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-primary">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      className={errors.emergencyContactName ? "border-red-500" : ""}
                    />
                    {errors.emergencyContactName && (
                      <p className="text-sm text-red-500">{errors.emergencyContactName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      className={errors.emergencyContactPhone ? "border-red-500" : ""}
                    />
                    {errors.emergencyContactPhone && (
                      <p className="text-sm text-red-500">{errors.emergencyContactPhone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelation">Relation *</Label>
                    <Select
                      value={formData.emergencyContactRelation}
                      onValueChange={(value) => handleInputChange("emergencyContactRelation", value)}
                    >
                      <SelectTrigger className={errors.emergencyContactRelation ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="relative">Relative</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="neighbor">Neighbor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.emergencyContactRelation && (
                      <p className="text-sm text-red-500">{errors.emergencyContactRelation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-primary">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={formData.bloodGroup || ""}
                      onValueChange={(value) => handleInputChange("bloodGroup", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Input
                      id="medicalConditions"
                      value={formData.medicalConditions || ""}
                      onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                      placeholder="Any medical conditions"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input
                      id="allergies"
                      value={formData.allergies || ""}
                      onChange={(e) => handleInputChange("allergies", e.target.value)}
                      placeholder="Any known allergies"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hobbies">Hobbies & Interests</Label>
                  <Textarea
                    id="hobbies"
                    value={formData.hobbies || ""}
                    onChange={(e) => handleInputChange("hobbies", e.target.value)}
                    placeholder="List your hobbies and interests"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Biometric Setup */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Biometric Setup</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.enableFaceRecognition}
                    onCheckedChange={(checked) => handleInputChange("enableFaceRecognition", checked)}
                  />
                  <Label>Enable Face Recognition for Attendance</Label>
                </div>

                {formData.enableFaceRecognition && (
                  <div className="space-y-4">
                    <Alert>
                      <Camera className="w-4 h-4" />
                      <AlertDescription>
                        Upload at least 2 clear face images from different angles for better recognition accuracy.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Face Images for Training</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => faceInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Face Images
                      </Button>
                      <input
                        ref={faceInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFaceImagesUpload}
                        className="hidden"
                      />
                    </div>

                    {faceImages.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Images ({faceImages.length})</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {faceImages.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file) || "/placeholder.svg"}
                                alt={`Face ${index + 1}`}
                                className="w-full h-24 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 w-6 h-6 p-0"
                                onClick={() => removeFaceImage(index)}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {errors.faceImages && <p className="text-sm text-red-500">{errors.faceImages}</p>}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.enableQRCode}
                    onCheckedChange={(checked) => handleInputChange("enableQRCode", checked)}
                  />
                  <Label>Generate Personal QR Code for Attendance</Label>
                </div>

                {formData.enableQRCode && (
                  <Alert>
                    <QrCode className="w-4 h-4" />
                    <AlertDescription>
                      A personal QR code will be generated that you can use for quick attendance marking.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Documents */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Document Upload</h3>

              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  Upload relevant documents such as transcripts, certificates, or identification documents.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => documentInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Documents
                </Button>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleDocumentsUpload}
                  className="hidden"
                />
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Documents ({documents.length})</Label>
                  <div className="space-y-2">
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                        </div>
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeDocument(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Privacy Settings */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Privacy & Notification Settings</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Privacy Level</Label>
                  <Select
                    value={formData.privacyLevel}
                    onValueChange={(value: any) => handleInputChange("privacyLevel", value)}
                  >
                    <SelectTrigger className={errors.privacyLevel ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select privacy level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Information visible to all users</SelectItem>
                      <SelectItem value="private">
                        Private - Information visible to authorized personnel only
                      </SelectItem>
                      <SelectItem value="restricted">Restricted - Minimal information sharing</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.privacyLevel && <p className="text-sm text-red-500">{errors.privacyLevel}</p>}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.enableNotifications}
                      onCheckedChange={(checked) => handleInputChange("enableNotifications", checked)}
                    />
                    <Label>Enable Email Notifications</Label>
                  </div>

                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      Your data will be securely stored and used only for educational purposes. You can update these
                      settings anytime.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            )}
          </div>

          {errors.submit && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

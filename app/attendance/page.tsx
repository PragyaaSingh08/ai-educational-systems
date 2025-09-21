"use client" // Added client directive to prevent SSR document errors

import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, QrCode, Brain, BarChart3, Users } from "lucide-react"
import { FacialRecognition } from "@/components/facial-recognition"
import { QRScanner } from "@/components/qr-scanner"
import { EnhancedFacialRecognition } from "@/components/enhanced-facial-recognition"
import { FaceModelTrainer } from "@/components/face-model-trainer"
import { SubjectAttendanceCapture } from "@/components/subject-attendance-capture"
import { AttendanceAnalytics } from "@/components/attendance-analytics"

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Smart Attendance System</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            AI-powered attendance tracking with facial recognition and QR code scanning
          </p>
        </div>

        <Tabs defaultValue="qr" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-12">
            <TabsTrigger value="qr" className="gap-2 text-sm">
              <QrCode className="w-4 h-4" />
              QR Scanner
            </TabsTrigger>
            <TabsTrigger value="facial" className="gap-2 text-sm">
              <Camera className="w-4 h-4" />
              Basic Face
            </TabsTrigger>
            <TabsTrigger value="enhanced" className="gap-2 text-sm">
              <Camera className="w-4 h-4" />
              Enhanced Face
            </TabsTrigger>
            <TabsTrigger value="trainer" className="gap-2 text-sm">
              <Brain className="w-4 h-4" />
              Train Model
            </TabsTrigger>
            <TabsTrigger value="subject" className="gap-2 text-sm">
              <Users className="w-4 h-4" />
              Subject Capture
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr">
            <QRScanner />
          </TabsContent>

          <TabsContent value="facial">
            <FacialRecognition />
          </TabsContent>

          <TabsContent value="enhanced">
            <EnhancedFacialRecognition />
          </TabsContent>

          <TabsContent value="trainer">
            <FaceModelTrainer />
          </TabsContent>

          <TabsContent value="subject">
            <SubjectAttendanceCapture />
          </TabsContent>

          <TabsContent value="analytics">
            <AttendanceAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

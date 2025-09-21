"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Camera, Users, BarChart3, Settings, Zap } from "lucide-react"
import { FaceModelTrainer } from "./face-model-trainer"
import { SubjectAttendanceCapture } from "./subject-attendance-capture"
import { AttendanceAnalytics } from "./attendance-analytics"
import { EnhancedFacialRecognition } from "./enhanced-facial-recognition"

export function ComprehensiveFaceSystem() {
  const [activeTab, setActiveTab] = useState("recognition")
  const [modelTrained, setModelTrained] = useState(false)

  const handleTrainingComplete = () => {
    setModelTrained(true)
    setActiveTab("recognition")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Comprehensive Face Recognition System
          </CardTitle>
          <CardDescription>
            Complete attendance management with advanced AI face recognition, model training, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <Brain className="h-8 w-8 mx-auto text-blue-500" />
              <h3 className="font-medium">AI Training</h3>
              <p className="text-sm text-muted-foreground">Train face recognition models</p>
            </div>
            <div className="text-center space-y-2">
              <Camera className="h-8 w-8 mx-auto text-green-500" />
              <h3 className="font-medium">Live Recognition</h3>
              <p className="text-sm text-muted-foreground">Real-time face detection</p>
            </div>
            <div className="text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-purple-500" />
              <h3 className="font-medium">Subject Capture</h3>
              <p className="text-sm text-muted-foreground">Class-based attendance</p>
            </div>
            <div className="text-center space-y-2">
              <BarChart3 className="h-8 w-8 mx-auto text-orange-500" />
              <h3 className="font-medium">Analytics</h3>
              <p className="text-sm text-muted-foreground">Detailed reports</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recognition" className="gap-2">
            <Camera className="h-4 w-4" />
            Recognition
          </TabsTrigger>
          <TabsTrigger value="trainer" className="gap-2">
            <Brain className="h-4 w-4" />
            Train Model
          </TabsTrigger>
          <TabsTrigger value="subject" className="gap-2">
            <Users className="h-4 w-4" />
            Subject Capture
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recognition">
          <div className="space-y-4">
            {!modelTrained && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Recommendation: Train the face recognition model first for better accuracy
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            <EnhancedFacialRecognition />
          </div>
        </TabsContent>

        <TabsContent value="trainer">
          <FaceModelTrainer onTrainingComplete={handleTrainingComplete} />
        </TabsContent>

        <TabsContent value="subject">
          <SubjectAttendanceCapture />
        </TabsContent>

        <TabsContent value="analytics">
          <AttendanceAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Users, BookOpen, Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Database } from "lucide-react"

interface SystemStats {
  totalStudents: number
  activeSubjects: number
  attendanceRate: number
  systemUptime: number
  apiCalls: number
  mlModelsActive: number
}

export function SystemDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalStudents: 0,
    activeSubjects: 0,
    attendanceRate: 0,
    systemUptime: 0,
    apiCalls: 0,
    mlModelsActive: 0,
  })

  const [apiStatus, setApiStatus] = useState<Record<string, "online" | "offline" | "degraded">>({
    "ML Models": "online",
    Attendance: "online",
    Curriculum: "online",
    Analytics: "online",
    Students: "degraded",
    Recommendations: "online",
  })

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        totalStudents: 156 + Math.floor(Math.random() * 10),
        activeSubjects: 12 + Math.floor(Math.random() * 3),
        attendanceRate: 85 + Math.random() * 10,
        systemUptime: 99.2 + Math.random() * 0.7,
        apiCalls: 1250 + Math.floor(Math.random() * 100),
        mlModelsActive: 5,
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const systemHealth =
    (Object.values(apiStatus).filter((status) => status === "online").length / Object.keys(apiStatus).length) * 100

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalStudents}</div>
            <p className="text-sm text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Active Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.activeSubjects}</div>
            <p className="text-sm text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.attendanceRate.toFixed(1)}%</div>
            <Progress value={stats.attendanceRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              ML Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.mlModelsActive}</div>
            <p className="text-sm text-muted-foreground">Active models</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Health Overview
          </CardTitle>
          <CardDescription>Real-time monitoring of all system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <span className="text-2xl font-bold text-primary">{systemHealth.toFixed(1)}%</span>
              </div>
              <Progress value={systemHealth} className="h-3" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-2xl font-bold text-green-600">{stats.systemUptime.toFixed(1)}%</span>
              </div>
              <Progress value={stats.systemUptime} className="h-3" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Calls Today</span>
                <span className="text-2xl font-bold text-blue-600">{stats.apiCalls.toLocaleString()}</span>
              </div>
              <div className="text-sm text-muted-foreground">+12% from yesterday</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            API Services Status
          </CardTitle>
          <CardDescription>Current status of all backend services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(apiStatus).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status === "online" ? "bg-green-500" : status === "degraded" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium">{service}</span>
                </div>
                <Badge variant={status === "online" ? "default" : status === "degraded" ? "secondary" : "destructive"}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>Latest events and operations across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "2 minutes ago", event: "ML model training completed", type: "success", icon: Brain },
                  { time: "5 minutes ago", event: "New student enrolled: Emma Wilson", type: "info", icon: Users },
                  { time: "12 minutes ago", event: "Attendance session started for CS-101", type: "info", icon: Clock },
                  {
                    time: "18 minutes ago",
                    event: "Schedule optimization completed",
                    type: "success",
                    icon: CheckCircle,
                  },
                  { time: "25 minutes ago", event: "Performance analytics updated", type: "info", icon: TrendingUp },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <activity.icon
                      className={`w-5 h-5 ${
                        activity.type === "success"
                          ? "text-green-500"
                          : activity.type === "warning"
                            ? "text-yellow-500"
                            : "text-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{activity.event}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: "warning",
                    title: "Student Database Service Degraded",
                    description: "Response times are 20% slower than normal",
                    time: "15 minutes ago",
                  },
                  {
                    type: "info",
                    title: "Scheduled Maintenance",
                    description: "ML model retraining scheduled for tonight at 2:00 AM",
                    time: "1 hour ago",
                  },
                  {
                    type: "success",
                    title: "Backup Completed",
                    description: "Daily system backup completed successfully",
                    time: "3 hours ago",
                  },
                ].map((alert, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    {alert.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />}
                    {alert.type === "info" && <Activity className="w-5 h-5 text-blue-500 mt-0.5" />}
                    {alert.type === "success" && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                    <div className="flex-1">
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators for system optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Response Time</span>
                    <span className="text-sm font-mono">245ms</span>
                  </div>
                  <Progress value={75} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Query Time</span>
                    <span className="text-sm font-mono">89ms</span>
                  </div>
                  <Progress value={60} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ML Model Inference</span>
                    <span className="text-sm font-mono">1.2s</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm font-mono">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm font-mono">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Usage</span>
                    <span className="text-sm font-mono">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

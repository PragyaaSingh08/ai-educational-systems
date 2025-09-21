"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Users, Target, Award, AlertTriangle, CheckCircle } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface PerformanceInsightsProps {
  semester: string
}

export function PerformanceInsights({ semester }: PerformanceInsightsProps) {
  const performanceData = [
    { month: "Jan", average: 78, attendance: 85, assignments: 82 },
    { month: "Feb", average: 81, attendance: 88, assignments: 85 },
    { month: "Mar", average: 83, attendance: 87, assignments: 88 },
    { month: "Apr", average: 85, attendance: 90, assignments: 87 },
    { month: "May", average: 87, attendance: 89, assignments: 90 },
  ]

  const subjectPerformance = [
    { subject: "ML Fundamentals", performance: 85, trend: "up" },
    { subject: "Data Structures", performance: 82, trend: "up" },
    { subject: "Database Systems", performance: 79, trend: "down" },
    { subject: "Algorithms", performance: 88, trend: "up" },
    { subject: "Software Engineering", performance: 84, trend: "stable" },
  ]

  const gradeDistribution = [
    { grade: "A", count: 45, color: "hsl(var(--chart-1))" },
    { grade: "B", count: 38, color: "hsl(var(--chart-2))" },
    { grade: "C", count: 22, color: "hsl(var(--chart-3))" },
    { grade: "D", count: 8, color: "hsl(var(--chart-4))" },
    { grade: "F", count: 3, color: "hsl(var(--chart-5))" },
  ]

  const insights = [
    {
      type: "positive",
      title: "Improved Performance Trend",
      description: "Overall class performance has increased by 12% this semester",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      type: "warning",
      title: "Database Systems Concern",
      description: "Performance in Database Systems has declined by 5% - consider additional support",
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      type: "positive",
      title: "High Attendance Correlation",
      description: "Students with >90% attendance show 15% better performance",
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      type: "info",
      title: "Assignment Completion",
      description: "87% average assignment completion rate across all subjects",
      icon: Target,
      color: "text-blue-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Class Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">85.2%</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-3 h-3" />
              +3.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">89.5%</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-3 h-3" />
              +1.8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Assignment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">87.3%</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-3 h-3" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-yellow-500" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">94.8%</div>
            <div className="flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="w-3 h-3" />
              -0.5% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Monthly performance metrics across key areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis domain={[70, 95]} className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Average Grade"
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Attendance"
                />
                <Line
                  type="monotone"
                  dataKey="assignments"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="Assignments"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Current semester grade distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} students`,
                    `Grade ${props.payload.grade}`,
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {gradeDistribution.map((item) => (
                <div key={item.grade} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">
                    Grade {item.grade}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Analysis</CardTitle>
          <CardDescription>Individual subject performance and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectPerformance.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">{subject.subject}</h3>
                    <p className="text-sm text-muted-foreground">Class Average</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{subject.performance}%</div>
                    <div className="flex items-center gap-1 text-sm">
                      {subject.trend === "up" && (
                        <>
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-green-600">Improving</span>
                        </>
                      )}
                      {subject.trend === "down" && (
                        <>
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span className="text-red-600">Declining</span>
                        </>
                      )}
                      {subject.trend === "stable" && <span className="text-muted-foreground">Stable</span>}
                    </div>
                  </div>
                  <Progress value={subject.performance} className="w-24 h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>Automated analysis and recommendations based on performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <insight.icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
                <div>
                  <h3 className="font-medium mb-1">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

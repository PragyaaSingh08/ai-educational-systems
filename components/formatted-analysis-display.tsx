"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertTriangle, Target, BarChart3, Users, Lightbulb } from "lucide-react"

interface FormattedAnalysisDisplayProps {
  content: string
  title: string
  timestamp: string
  type: "analysis" | "insights" | "predictions"
}

export function FormattedAnalysisDisplay({ content, title, timestamp, type }: FormattedAnalysisDisplayProps) {
  const formatContent = (text: string) => {
    // Split by sections and format
    const sections = text.split(/##\s+/).filter(Boolean)

    return sections.map((section, index) => {
      const lines = section.split("\n").filter((line) => line.trim())
      const sectionTitle = lines[0]?.replace(/[📊🎯⚠️📈👤📋🔮]/gu, "").trim()
      const sectionContent = lines.slice(1)

      // Get appropriate icon for section
      const getIcon = (title: string) => {
        if (title.toLowerCase().includes("data") || title.toLowerCase().includes("analysis")) {
          return <BarChart3 className="w-4 h-4 text-blue-500" />
        }
        if (title.toLowerCase().includes("recommendation") || title.toLowerCase().includes("action")) {
          return <Lightbulb className="w-4 h-4 text-yellow-500" />
        }
        if (title.toLowerCase().includes("risk") || title.toLowerCase().includes("warning")) {
          return <AlertTriangle className="w-4 h-4 text-red-500" />
        }
        if (title.toLowerCase().includes("prediction") || title.toLowerCase().includes("forecast")) {
          return <TrendingUp className="w-4 h-4 text-purple-500" />
        }
        if (title.toLowerCase().includes("student") || title.toLowerCase().includes("profile")) {
          return <Users className="w-4 h-4 text-green-500" />
        }
        return <Target className="w-4 h-4 text-gray-500" />
      }

      return (
        <div key={index} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            {getIcon(sectionTitle)}
            <h3 className="font-semibold text-lg">{sectionTitle}</h3>
          </div>
          <div className="space-y-2 pl-6">
            {sectionContent.map((line, lineIndex) => {
              const trimmedLine = line.trim()
              if (!trimmedLine) return null

              // Format different types of content
              if (trimmedLine.startsWith("###")) {
                return (
                  <h4 key={lineIndex} className="font-medium text-base mt-4 mb-2 text-primary">
                    {trimmedLine.replace("###", "").trim()}
                  </h4>
                )
              }

              if (trimmedLine.startsWith("####")) {
                return (
                  <h5 key={lineIndex} className="font-medium text-sm mt-3 mb-1 text-muted-foreground">
                    {trimmedLine.replace("####", "").trim()}
                  </h5>
                )
              }

              if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
                return (
                  <div key={lineIndex} className="flex items-start gap-2 ml-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{trimmedLine.substring(2)}</p>
                  </div>
                )
              }

              if (/^\d+\./.test(trimmedLine)) {
                return (
                  <div key={lineIndex} className="flex items-start gap-3 ml-2">
                    <Badge variant="outline" className="text-xs px-2 py-0.5 mt-0.5">
                      {trimmedLine.match(/^\d+/)?.[0]}
                    </Badge>
                    <p className="text-sm leading-relaxed">{trimmedLine.replace(/^\d+\.\s*/, "")}</p>
                  </div>
                )
              }

              if (trimmedLine.includes("**") && trimmedLine.includes(":")) {
                const [label, ...valueParts] = trimmedLine.split(":")
                const value = valueParts.join(":").trim()
                return (
                  <div key={lineIndex} className="flex items-start gap-2 ml-2">
                    <span className="font-medium text-sm text-primary">{label.replace(/\*\*/g, "")}:</span>
                    <span className="text-sm">{value}</span>
                  </div>
                )
              }

              return (
                <p key={lineIndex} className="text-sm leading-relaxed ml-2">
                  {trimmedLine}
                </p>
              )
            })}
          </div>
        </div>
      )
    })
  }

  const getTypeIcon = () => {
    switch (type) {
      case "analysis":
        return <Brain className="w-5 h-5 text-green-600" />
      case "insights":
        return <Users className="w-5 h-5 text-blue-600" />
      case "predictions":
        return <TrendingUp className="w-5 h-5 text-purple-600" />
      default:
        return <Brain className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getTypeIcon()}
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Generated on {new Date(timestamp).toLocaleString()}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">{formatContent(content)}</div>
      </CardContent>
    </Card>
  )
}

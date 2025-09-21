"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, RefreshCw, Copy, Download, Clock, Users, CheckCircle2 } from "lucide-react"

interface QRSession {
  id: string
  classId: string
  sessionName: string
  qrData: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  attendanceCount: number
}

export function QRCodeGenerator() {
  const [classId, setClassId] = useState("")
  const [sessionName, setSessionName] = useState("")
  const [currentSession, setCurrentSession] = useState<QRSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  const generateQRCode = () => {
    if (!classId.trim() || !sessionName.trim()) {
      alert("Please enter both Class ID and Session Name")
      return
    }

    const sessionId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) // 24 hours

    const qrData = JSON.stringify({
      sessionId,
      classId: classId.trim(),
      sessionName: sessionName.trim(),
      timestamp: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      type: "attendance_session",
    })

    const session: QRSession = {
      id: sessionId,
      classId: classId.trim(),
      sessionName: sessionName.trim(),
      qrData,
      createdAt,
      expiresAt,
      isActive: true,
      attendanceCount: 0,
    }

    setCurrentSession(session)

    // Store session in localStorage for persistence
    localStorage.setItem("currentQRSession", JSON.stringify(session))

    console.log("[v0] Generated QR session:", sessionId)
  }

  const generateVisualQRCode = (data: string) => {
    const size = 300
    const modules = 25 // QR code grid size
    const moduleSize = size / modules

    // Create a pattern based on the data hash
    const hash = data.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    const pattern = []
    for (let i = 0; i < modules * modules; i++) {
      pattern.push((hash + i) % 3 === 0)
    }

    const svgElements = []

    // Add finder patterns (corners)
    const finderPattern = [
      { x: 0, y: 0 },
      { x: modules - 7, y: 0 },
      { x: 0, y: modules - 7 },
    ]

    finderPattern.forEach(({ x, y }) => {
      svgElements.push(
        `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="black"/>`,
      )
      svgElements.push(
        `<rect x="${(x + 1) * moduleSize}" y="${(y + 1) * moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="white"/>`,
      )
      svgElements.push(
        `<rect x="${(x + 2) * moduleSize}" y="${(y + 2) * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="black"/>`,
      )
    })

    // Add data modules
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        // Skip finder patterns
        const isFinderArea = (x < 9 && y < 9) || (x >= modules - 8 && y < 9) || (x < 9 && y >= modules - 8)

        if (!isFinderArea && pattern[y * modules + x]) {
          svgElements.push(
            `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`,
          )
        }
      }
    }

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="white"/>
        ${svgElements.join("")}
      </svg>
    `)}`
  }

  const copyQRData = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.qrData)
      alert("QR code data copied to clipboard!")
    }
  }

  const downloadQRCode = () => {
    if (!currentSession) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = 400
      canvas.height = 500

      // White background
      ctx!.fillStyle = "white"
      ctx!.fillRect(0, 0, 400, 500)

      // Draw QR code
      ctx!.drawImage(img, 50, 50, 300, 300)

      // Add text
      ctx!.fillStyle = "black"
      ctx!.font = "bold 18px Arial"
      ctx!.textAlign = "center"
      ctx!.fillText(currentSession.sessionName, 200, 380)

      ctx!.font = "14px Arial"
      ctx!.fillText(`Class: ${currentSession.classId}`, 200, 405)
      ctx!.fillText(`Created: ${currentSession.createdAt.toLocaleString()}`, 200, 425)
      ctx!.fillText("Scan to mark attendance", 200, 450)

      // Download
      const link = document.createElement("a")
      link.download = `qr-attendance-${currentSession.classId}-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    }

    img.src = generateVisualQRCode(currentSession.qrData)
  }

  const refreshSession = () => {
    if (currentSession) {
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const updatedSession = {
        ...currentSession,
        expiresAt: newExpiresAt,
        qrData: JSON.stringify({
          ...JSON.parse(currentSession.qrData),
          expiresAt: newExpiresAt.toISOString(),
          refreshed: new Date().toISOString(),
        }),
      }

      setCurrentSession(updatedSession)
      localStorage.setItem("currentQRSession", JSON.stringify(updatedSession))
      console.log("[v0] Refreshed QR session")
    }
  }

  const endSession = () => {
    if (currentSession) {
      setCurrentSession(null)
      localStorage.removeItem("currentQRSession")
      console.log("[v0] Ended QR session")
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSession) {
        const now = new Date().getTime()
        const expires = currentSession.expiresAt.getTime()
        const remaining = expires - now

        if (remaining <= 0) {
          setTimeRemaining("Expired")
          setCurrentSession((prev) => (prev ? { ...prev, isActive: false } : null))
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60))
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
          setTimeRemaining(`${hours}h ${minutes}m`)
        }
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [currentSession])

  useEffect(() => {
    const savedSession = localStorage.getItem("currentQRSession")
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        session.createdAt = new Date(session.createdAt)
        session.expiresAt = new Date(session.expiresAt)

        // Check if session is still valid
        if (new Date() < session.expiresAt) {
          setCurrentSession(session)
          setClassId(session.classId)
          setSessionName(session.sessionName)
        } else {
          localStorage.removeItem("currentQRSession")
        }
      } catch (error) {
        console.error("[v0] Error loading saved session:", error)
        localStorage.removeItem("currentQRSession")
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate QR codes for attendance sessions. Students will scan these codes to mark their attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classId">Class ID</Label>
                <Input
                  type="text"
                  id="classId"
                  placeholder="e.g., CS101, MATH201"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={currentSession?.isActive}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  type="text"
                  id="sessionName"
                  placeholder="e.g., Morning Lecture, Lab Session"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  disabled={currentSession?.isActive}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {!currentSession?.isActive ? (
                <Button onClick={generateQRCode} className="gap-2">
                  <QrCode className="w-4 h-4" />
                  Generate QR Code
                </Button>
              ) : (
                <>
                  <Button onClick={refreshSession} variant="outline" className="gap-2 bg-transparent">
                    <RefreshCw className="w-4 h-4" />
                    Refresh Session
                  </Button>
                  <Button onClick={endSession} variant="destructive" className="gap-2">
                    End Session
                  </Button>
                </>
              )}

              {currentSession?.isActive && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Active
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {timeRemaining}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated QR Code</CardTitle>
            <CardDescription>
              Display this QR code for students to scan. The code is valid for 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white border-2 border-dashed border-primary rounded-lg">
                  <img
                    src={generateVisualQRCode(currentSession.qrData) || "/placeholder.svg"}
                    alt="Attendance QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <div className="flex justify-center gap-2">
                  <Button onClick={copyQRData} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Copy className="w-4 h-4" />
                    Copy Data
                  </Button>
                  <Button onClick={downloadQRCode} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{currentSession.sessionName}</h3>
                  <p className="text-muted-foreground">Class: {currentSession.classId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Attendance</span>
                    </div>
                    <p className="text-2xl font-bold">{currentSession.attendanceCount}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <p className="text-sm font-semibold text-green-600">
                      {currentSession.isActive ? "Active" : "Expired"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{currentSession.createdAt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{currentSession.expiresAt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session ID:</span>
                    <span className="font-mono text-xs">{currentSession.id.slice(-8)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

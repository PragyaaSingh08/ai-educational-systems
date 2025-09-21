"use client"

import type React from "react"
import { useEffect } from "react"
import { notificationService } from "@/lib/notification-system"

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeNotifications = () => {
      // Demo attendance notifications
      notificationService.notifyAttendanceMarked("John Doe", "face", "Mathematics 101")
      notificationService.notifyLateArrival("Jane Smith", "Physics 201", 15)

      // Demo security alert
      notificationService.notifySecurityAlert("Unusual login attempt detected from new device", "high")

      // Demo system update
      notificationService.notifySystemUpdate("Face recognition model updated with improved accuracy")

      // Clean up old notifications periodically
      const cleanup = setInterval(
        () => {
          notificationService.clearOldNotifications(7) // Keep notifications for 7 days
        },
        24 * 60 * 60 * 1000,
      ) // Run daily

      return () => clearInterval(cleanup)
    }

    const cleanup = initializeNotifications()
    return cleanup
  }, [])

  return <>{children}</>
}

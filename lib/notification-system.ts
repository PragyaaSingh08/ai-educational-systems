export interface Notification {
  id: string
  type: "attendance" | "alert" | "system" | "academic" | "security"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  timestamp: Date
  read: boolean
  userId?: string
  metadata?: Record<string, any>
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  attendanceAlerts: boolean
  securityAlerts: boolean
  systemUpdates: boolean
  academicUpdates: boolean
}

class NotificationService {
  private notifications: Notification[] = []
  private subscribers: ((notifications: Notification[]) => void)[] = []
  private settings: NotificationSettings = {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    attendanceAlerts: true,
    securityAlerts: true,
    systemUpdates: true,
    academicUpdates: true,
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: Notification[]) => void) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.notifications))
  }

  // Add new notification
  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    }

    this.notifications.unshift(newNotification)
    this.notifySubscribers()

    // Trigger browser notification if enabled
    if (this.settings.pushNotifications && "Notification" in window) {
      this.showBrowserNotification(newNotification)
    }

    return newNotification
  }

  // Show browser notification
  private showBrowserNotification(notification: Notification) {
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      })
    }
  }

  // Request notification permission
  async requestPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }

  // Mark notification as read
  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.notifySubscribers()
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.notifySubscribers()
  }

  // Get notifications
  getNotifications() {
    return this.notifications
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter((n) => !n.read).length
  }

  // Update settings
  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings }
  }

  // Get settings
  getSettings() {
    return this.settings
  }

  // Clear old notifications
  clearOldNotifications(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    this.notifications = this.notifications.filter((n) => n.timestamp > cutoffDate)
    this.notifySubscribers()
  }

  // Attendance-specific notifications
  notifyAttendanceMarked(studentName: string, method: "face" | "qr", className: string) {
    this.addNotification({
      type: "attendance",
      priority: "low",
      title: "Attendance Marked",
      message: `${studentName} marked present in ${className} via ${method === "face" ? "Face Recognition" : "QR Code"}`,
      metadata: { studentName, method, className },
    })
  }

  notifyLateArrival(studentName: string, className: string, minutesLate: number) {
    this.addNotification({
      type: "attendance",
      priority: "medium",
      title: "Late Arrival",
      message: `${studentName} arrived ${minutesLate} minutes late to ${className}`,
      metadata: { studentName, className, minutesLate },
    })
  }

  notifyAbsentStudent(studentName: string, className: string) {
    this.addNotification({
      type: "attendance",
      priority: "medium",
      title: "Student Absent",
      message: `${studentName} is absent from ${className}`,
      metadata: { studentName, className },
    })
  }

  // Security notifications
  notifySecurityAlert(message: string, severity: "low" | "high" = "high") {
    this.addNotification({
      type: "security",
      priority: severity === "high" ? "critical" : "medium",
      title: "Security Alert",
      message,
      metadata: { severity },
    })
  }

  // System notifications
  notifySystemUpdate(message: string) {
    this.addNotification({
      type: "system",
      priority: "low",
      title: "System Update",
      message,
    })
  }
}

export const notificationService = new NotificationService()

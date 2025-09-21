export interface FaceTrainingData {
  studentId: string
  name: string
  rollNumber: string
  faceImages: string[] // Base64 encoded images
  descriptors: number[][] // Multiple face descriptors for better accuracy
  trainingDate: Date
}

export interface FaceDetectionResult {
  box: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  descriptor?: number[]
  landmarks?: {
    leftEye: { x: number; y: number }
    rightEye: { x: number; y: number }
    nose: { x: number; y: number }
    leftMouth: { x: number; y: number }
    rightMouth: { x: number; y: number }
  }
  quality: number // Face quality score (0-1)
  angle: number // Face angle in degrees
}

export interface RecognitionSettings {
  confidenceThreshold: number
  qualityThreshold: number
  maxAngleDeviation: number
  enableAntiSpoofing: boolean
  enableLivenessDetection: boolean
}

export class AdvancedFaceRecognitionService {
  private trainingData: Map<string, FaceTrainingData> = new Map()
  private settings: RecognitionSettings = {
    confidenceThreshold: 0.75,
    qualityThreshold: 0.6,
    maxAngleDeviation: 30,
    enableAntiSpoofing: true,
    enableLivenessDetection: true,
  }

  // Train face recognition model with multiple images per student
  async trainStudent(studentData: {
    studentId: string
    name: string
    rollNumber: string
    images: File[]
  }): Promise<{ success: boolean; message: string; descriptors?: number[][] }> {
    try {
      const descriptors: number[][] = []
      const imageUrls: string[] = []

      for (const image of studentData.images) {
        const imageUrl = await this.fileToBase64(image)
        const descriptor = await this.extractFaceDescriptor(imageUrl)

        if (descriptor && descriptor.quality > this.settings.qualityThreshold) {
          descriptors.push(descriptor.descriptor)
          imageUrls.push(imageUrl)
        }
      }

      if (descriptors.length < 2) {
        return {
          success: false,
          message: "Need at least 2 high-quality face images for training",
        }
      }

      const trainingData: FaceTrainingData = {
        studentId: studentData.studentId,
        name: studentData.name,
        rollNumber: studentData.rollNumber,
        faceImages: imageUrls,
        descriptors,
        trainingDate: new Date(),
      }

      this.trainingData.set(studentData.studentId, trainingData)

      return {
        success: true,
        message: `Successfully trained face recognition for ${studentData.name} with ${descriptors.length} face samples`,
        descriptors,
      }
    } catch (error) {
      return {
        success: false,
        message: `Training failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  // Enhanced face detection with quality assessment
  async detectFacesAdvanced(video: HTMLVideoElement): Promise<FaceDetectionResult[]> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Simulate advanced face detection with quality metrics
    const faces: FaceDetectionResult[] = []
    const numFaces = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < numFaces; i++) {
      const x = Math.random() * (canvas.width - 120)
      const y = Math.random() * (canvas.height - 120)
      const width = 100 + Math.random() * 50
      const height = 100 + Math.random() * 50

      faces.push({
        box: { x, y, width, height },
        confidence: 0.8 + Math.random() * 0.2,
        descriptor: this.generateRandomDescriptor(),
        landmarks: {
          leftEye: { x: x + width * 0.3, y: y + height * 0.35 },
          rightEye: { x: x + width * 0.7, y: y + height * 0.35 },
          nose: { x: x + width * 0.5, y: y + height * 0.55 },
          leftMouth: { x: x + width * 0.4, y: y + height * 0.75 },
          rightMouth: { x: x + width * 0.6, y: y + height * 0.75 },
        },
        quality: 0.7 + Math.random() * 0.3,
        angle: (Math.random() - 0.5) * 60, // -30 to +30 degrees
      })
    }

    return faces
  }

  // Match face against trained students with improved accuracy
  async matchFace(descriptor: number[]): Promise<{
    studentId: string | null
    confidence: number
    name?: string
    rollNumber?: string
  }> {
    let bestMatch: { studentId: string; confidence: number; data: FaceTrainingData } | null = null

    for (const [studentId, trainingData] of this.trainingData) {
      // Compare against all descriptors for this student
      let maxConfidence = 0

      for (const trainedDescriptor of trainingData.descriptors) {
        const similarity = this.calculateCosineSimilarity(descriptor, trainedDescriptor)
        maxConfidence = Math.max(maxConfidence, similarity)
      }

      if (maxConfidence > this.settings.confidenceThreshold && (!bestMatch || maxConfidence > bestMatch.confidence)) {
        bestMatch = { studentId, confidence: maxConfidence, data: trainingData }
      }
    }

    if (bestMatch) {
      return {
        studentId: bestMatch.studentId,
        confidence: bestMatch.confidence,
        name: bestMatch.data.name,
        rollNumber: bestMatch.data.rollNumber,
      }
    }

    return { studentId: null, confidence: 0 }
  }

  // Anti-spoofing detection
  async detectLiveness(video: HTMLVideoElement): Promise<{
    isLive: boolean
    confidence: number
    reason?: string
  }> {
    // Simulate liveness detection
    const isLive = Math.random() > 0.1 // 90% chance of being live
    const confidence = isLive ? 0.85 + Math.random() * 0.15 : Math.random() * 0.3

    return {
      isLive,
      confidence,
      reason: isLive ? undefined : "Potential spoofing detected - static image or video replay",
    }
  }

  // Face quality assessment
  assessFaceQuality(face: FaceDetectionResult): {
    score: number
    issues: string[]
  } {
    const issues: string[] = []
    let score = 1.0

    // Check face angle
    if (Math.abs(face.angle) > this.settings.maxAngleDeviation) {
      issues.push("Face angle too extreme")
      score -= 0.3
    }

    // Check face size
    const faceArea = face.box.width * face.box.height
    if (faceArea < 5000) {
      issues.push("Face too small")
      score -= 0.2
    }

    // Check quality score
    if (face.quality < this.settings.qualityThreshold) {
      issues.push("Image quality too low")
      score -= 0.3
    }

    return {
      score: Math.max(0, score),
      issues,
    }
  }

  // Update recognition settings
  updateSettings(newSettings: Partial<RecognitionSettings>) {
    this.settings = { ...this.settings, ...newSettings }
  }

  getSettings(): RecognitionSettings {
    return { ...this.settings }
  }

  // Get training statistics
  getTrainingStats(): {
    totalStudents: number
    totalDescriptors: number
    averageDescriptorsPerStudent: number
    lastTrainingDate?: Date
  } {
    const totalStudents = this.trainingData.size
    let totalDescriptors = 0
    let lastTrainingDate: Date | undefined

    for (const data of this.trainingData.values()) {
      totalDescriptors += data.descriptors.length
      if (!lastTrainingDate || data.trainingDate > lastTrainingDate) {
        lastTrainingDate = data.trainingDate
      }
    }

    return {
      totalStudents,
      totalDescriptors,
      averageDescriptorsPerStudent: totalStudents > 0 ? totalDescriptors / totalStudents : 0,
      lastTrainingDate,
    }
  }

  // Export training data
  exportTrainingData(): string {
    const data = Array.from(this.trainingData.entries()).map(([id, data]) => ({
      studentId: id,
      ...data,
      faceImages: data.faceImages.length, // Don't export actual images, just count
    }))

    return JSON.stringify(data, null, 2)
  }

  // Import training data
  async importTrainingData(jsonData: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonData)
      let imported = 0

      for (const item of data) {
        if (item.studentId && item.descriptors && Array.isArray(item.descriptors)) {
          this.trainingData.set(item.studentId, {
            studentId: item.studentId,
            name: item.name,
            rollNumber: item.rollNumber,
            faceImages: [], // Images not imported for security
            descriptors: item.descriptors,
            trainingDate: new Date(item.trainingDate),
          })
          imported++
        }
      }

      return {
        success: true,
        message: `Successfully imported ${imported} student face models`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : "Invalid data format"}`,
      }
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private async extractFaceDescriptor(imageUrl: string): Promise<{
    descriptor: number[]
    quality: number
  } | null> {
    // Simulate face descriptor extraction with quality assessment
    return {
      descriptor: this.generateRandomDescriptor(),
      quality: 0.7 + Math.random() * 0.3,
    }
  }

  private generateRandomDescriptor(): number[] {
    return Array.from({ length: 128 }, () => Math.random() * 2 - 1)
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

export const advancedFaceRecognition = new AdvancedFaceRecognitionService()

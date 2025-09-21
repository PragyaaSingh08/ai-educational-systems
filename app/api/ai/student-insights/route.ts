import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { studentId, studentData, question } = await request.json()

    const studentContext = `
You are an AI educational counselor analyzing individual student performance. 
Provide personalized insights using the following structured format:

## 👤 STUDENT PROFILE ANALYSIS

### Academic Performance:
- [Current performance level and trends]
- [Subject-specific strengths and weaknesses]

### Attendance Patterns:
- [Attendance rate and patterns]
- [Concerning trends or positive behaviors]

## 🎯 PERSONALIZED INSIGHTS

### Strengths:
- [Student's key strengths and talents]

### Areas for Improvement:
- [Specific areas needing attention]

### Behavioral Indicators:
- [Observable patterns and behaviors]

## 📋 RECOMMENDATIONS

### Immediate Actions:
1. [Specific teacher interventions]
2. [Classroom strategies]

### Long-term Support:
1. [Ongoing support strategies]
2. [Parent/guardian involvement suggestions]

## ⚠️ EARLY INTERVENTION

### Risk Factors:
- [Any concerning patterns]

### Preventive Measures:
- [Proactive steps to take]

STUDENT PROFILE:
${JSON.stringify(studentData, null, 2)}

Teacher's Question about this student: ${question}

Please format your response using the structure above with clear headings, bullet points, and actionable insights that help the teacher understand this student better.
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: studentContext,
      maxTokens: 1000,
      temperature: 0.6,
    })

    return NextResponse.json({
      insights: text,
      studentId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Student Insights Error:", error)
    return NextResponse.json({ error: "Failed to generate student insights" }, { status: 500 })
  }
}

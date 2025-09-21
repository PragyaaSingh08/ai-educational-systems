import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { question, context, studentData, attendanceData, performanceData } = await request.json()

    const analysisContext = `
You are an AI educational analyst with access to comprehensive student data and ML model insights. 
Provide a well-structured, detailed analysis using the following format:

## 📊 DATA ANALYSIS

### Key Findings:
- [Bullet point findings from the data]

### Statistical Insights:
- [Quantitative insights with percentages/numbers]

## 🎯 RECOMMENDATIONS

### Immediate Actions:
1. [Numbered action items]

### Long-term Strategies:
1. [Strategic recommendations]

## ⚠️ RISK ASSESSMENT

### High Priority Students:
- [Students needing immediate attention]

### Warning Signs:
- [Patterns to monitor]

## 📈 NEXT STEPS

### For Teachers:
- [Specific teacher actions]

### For Administration:
- [Administrative recommendations]

STUDENT DATA:
${JSON.stringify(studentData, null, 2)}

ATTENDANCE DATA:
${JSON.stringify(attendanceData, null, 2)}

PERFORMANCE DATA:
${JSON.stringify(performanceData, null, 2)}

SYSTEM CONTEXT:
${context}

Teacher's Question: ${question}

Please format your response using the structure above with clear headings, bullet points, and actionable insights.
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: analysisContext,
      maxTokens: 1200,
      temperature: 0.7,
    })

    return NextResponse.json({
      analysis: text,
      timestamp: new Date().toISOString(),
      context: "AI-powered educational analysis",
    })
  } catch (error) {
    console.error("AI Analysis Error:", error)
    return NextResponse.json({ error: "Failed to generate AI analysis" }, { status: 500 })
  }
}

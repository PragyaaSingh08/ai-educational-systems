import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { modelResults, historicalData, predictionType } = await request.json()

    const predictiveContext = `
You are an AI predictive analyst for educational systems. Based on ML model results and historical data, provide structured predictive insights.

## 🔮 PREDICTIVE ANALYSIS - ${predictionType.toUpperCase().replace("_", " ")}

### Current Trends:
- [Analysis of current patterns in the data]
- [Key indicators and metrics]

### Future Projections:
- [Specific predictions with timeframes]
- [Expected outcomes based on current trajectory]

## 📊 RISK ASSESSMENT

### High Risk Indicators:
- [Students or patterns requiring immediate attention]

### Medium Risk Factors:
- [Areas to monitor closely]

### Success Predictors:
- [Positive indicators and trends]

## 🎯 RECOMMENDED INTERVENTIONS

### Immediate Actions (Next 2-4 weeks):
1. [Urgent interventions needed]
2. [Quick wins and immediate steps]

### Medium-term Strategies (1-3 months):
1. [Sustained intervention programs]
2. [System-level improvements]

### Long-term Planning (3-12 months):
1. [Strategic initiatives]
2. [Preventive measures]

## 📈 SUCCESS METRICS

### Key Performance Indicators:
- [Metrics to track progress]
- [Success benchmarks]

### Timeline Expectations:
- [When to expect results]
- [Milestone checkpoints]

ML MODEL RESULTS:
${JSON.stringify(modelResults, null, 2)}

HISTORICAL DATA:
${JSON.stringify(historicalData, null, 2)}

PREDICTION TYPE: ${predictionType}

Please format your response using the structure above with clear headings, bullet points, and actionable predictions that help educators make proactive decisions.
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: predictiveContext,
      maxTokens: 1200,
      temperature: 0.5,
    })

    return NextResponse.json({
      predictions: text,
      predictionType,
      confidence: "Based on ML model analysis",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Predictive Analysis Error:", error)
    return NextResponse.json({ error: "Failed to generate predictive analysis" }, { status: 500 })
  }
}

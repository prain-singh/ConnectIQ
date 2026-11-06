import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, messages, wpm, fillerWords, emotion, duration, resume } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is missing. Please check your environment variables." },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const conversationLog = messages.map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');

    const prompt = `
      You are an expert technical interviewer and career coach.
      Generate a comprehensive performance report for a candidate who just completed a ${role} mock interview.
      
      ${resume ? `Here is the candidate's resume/profile data:\n${resume}\n\nPlease extract the candidate's name from this resume and personalize the report by addressing them by name.` : `Address the candidate directly.`}
      
      Here are the metrics collected during the interview:
      - Total Duration: ${duration} seconds
      - Speaking Pace: ${wpm} Words Per Minute (WPM)
      - Filler Words Used: ${fillerWords}
      - Dominant Facial Emotion Detected: ${emotion}
      
      Here is the complete conversation log:
      ${conversationLog}
      
      Please provide a detailed report formatted in Markdown, covering the following sections:
      1. **Overall Summary**: A brief overview of how the candidate did.
      2. **Communication & Delivery**: Analyze their speaking pace (WPM), use of filler words, and facial expressions/emotions. Give specific advice on improvements (e.g., facial gestures, eye contact, tone).
      3. **Technical Competence**: Based on the answers in the transcript, evaluate their technical depth and problem-solving skills.
      4. **Strengths**: Bullet points of what they did well.
      5. **Areas for Improvement**: Specific, actionable steps to improve both technically and behaviorally.
      
      Keep the tone encouraging but constructive. Use standard markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ report: text });
    
  } catch (error: any) {
    console.error('Gemini Report Generation Error:', error);
    return NextResponse.json(
      { error: "Failed to generate report." },
      { status: 500 }
    );
  }
}

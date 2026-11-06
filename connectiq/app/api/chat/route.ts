import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, role } = body;

    if (!apiKey) {
      return NextResponse.json(
        { content: "API Key is missing. Please check your environment variables.", feedback: "System Configuration Error" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Construct history for the chat model
    let formattedHistory = history
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Gemini requires history to start with a 'user' role
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory = [
        { role: 'user', parts: [{ text: 'Hello, I am ready for the interview.' }] },
        ...formattedHistory
      ];
    }
    
    // Create the chat session
    const chat = model.startChat({
      history: formattedHistory,
    });

    // The prompt for the current turn
    const prompt = `
      Context: You are an expert technical interviewer conducting an interview for a ${role} position.
      Your goal is to assess the candidate's skills, depth of knowledge, and communication.
      
      Current Interaction:
      The candidate just said: "${message}"

      Instructions:
      1. Analyze the candidate's response. Is it strong? Vague? Incorrect?
      2. Decide on the next logical step:
         - If the answer was good, ask a follow-up question digging deeper.
         - If the answer was weak, ask for clarification or a concrete example.
         - If it's time to move on, transition smoothly to the next relevant topic for a ${role}.
      3. Your spoken response (content) should be professional, conversational, and direct (max 2-3 sentences).
      4. Your internal feedback (feedback) should be a short 5-10 word critique of their delivery or content.
      5. ACTION: If you want the candidate to write code (e.g., "Write a function to..."), set "action": "code". Otherwise set "action": null.

      Format your response as a valid JSON object with keys "content", "feedback", and "action". Do not include markdown code blocks.
    `;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up potential markdown formatting in the response
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini:", text);
      // Fallback if JSON parsing fails
      parsedResponse = {
        content: text,
        feedback: "Response format error, but interview continues."
      };
    }

    return NextResponse.json(parsedResponse);
    
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Handle Rate Limiting (429) & Quota Issues
    // Google's error message usually contains "Quota" or "429" or "Retry"
    const isRateLimit = 
      error.status === 429 || 
      error.message?.includes('429') || 
      error.message?.includes('Quota') ||
      error.message?.includes('Retry');

    if (isRateLimit) {
      return NextResponse.json(
        { 
          content: "I need a short break as I'm processing too many requests. Let's verify some concepts in 30 seconds.", 
          feedback: "System Busy (Quota Exceeded)" 
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        content: "I'm experiencing a slight connection issue. Could you please repeat that?", 
        feedback: "Network/API Error" 
      },
      { status: 500 }
    );
  }
}

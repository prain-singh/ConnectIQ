import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // There isn't a direct "listModels" in the simple SDK helper sometimes exposed easily, 
        // but we can try to get a model and see or just rely on the error.
        // Actually, the SDK wraps the API. configuring it might not expose listModels directly on genAI instance in older versions?
        // Let's check the generic GET request if possible or just try a standard one.
        // But the error message said: "Call ListModels to see the list..."

        // Using the lower level REST call might be easier if SDK doesn't expose it clear in the types I know.
        // But let's verify if I can just try 'gemini-1.5-flash-latest' which is often the fix.

        console.log("Checking models...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash work: " + result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();

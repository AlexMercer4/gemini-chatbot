// /app/api/chat/route.ts
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/embed";
import { pineconeIndex } from "@/lib/pinecone";

// Retrieve relevant context from Pinecone
async function getRelevantContext(query: string, topK = 5) {
  try {
    // Get embedding for the query
    const queryEmbedding = await getEmbeddings(query);

    // Search Pinecone for similar vectors
    const searchResponse = await pineconeIndex.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    // Extract text from matched vectors
    const context = searchResponse.matches
      .map((match) => match.metadata?.text || "")
      .filter((text) => text.length > 0)
      .join("\n\n");

    return context;
  } catch (error) {
    console.error("Context retrieval failed:", error);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];

    // Retrieve relevant context
    const context = await getRelevantContext(lastMessage.content);

    // Create system prompt with context
    const systemPrompt = `You are a helpful assistant. Use the following context to answer questions when relevant:

Context:
${context}

Instructions:
- Answer based on the provided context when possible
- If the context doesn't contain relevant information, use your general knowledge
- Be concise and helpful
- If you're unsure about something, say so`;

    // Prepare messages with system prompt
    const enhancedMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Generate response using Gemini 2.0 Flash
    const result = await streamText({
      model: google("gemini-2.0-flash"),
      messages: enhancedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

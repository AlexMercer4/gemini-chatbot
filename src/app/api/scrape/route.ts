import { chromium } from "playwright";
import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/embed";
import { pineconeIndex } from "@/lib/pinecone";


// =======================================================================

// Split text into chunks (e.g., 500 chars)
function chunkText(text: string, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// =======================================================================

async function storeInPinecone(
  chunks: string[],
  embeddings: number[][],
  url: string
) {
  try {
    if (!chunks.length || !embeddings.length) {
      throw new Error("Empty chunks or embeddings array");
    }

    const vectors = chunks.map((chunk, i) => ({
      id: `vec-${Date.now()}-${i}`,
      values: embeddings[i],
      metadata: {
        text: chunk.slice(0, 500), // Truncate to avoid metadata size limits
        url: url,
      },
    }));

    // Validate vector dimensions match index
    if (vectors[0].values.length !== 768) {
      // Match your embedding model's dimension
      throw new Error(
        `Vector dimension mismatch (expected 768, got ${vectors[0].values.length})`
      );
    }

    const upsertResponse = await pineconeIndex.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors`);
    return upsertResponse;
  } catch (error) {
    console.error("Pinecone store failed:", error);
    throw new Error(
      `Pinecone error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// =======================================================================

export async function GET(request: Request) {
  // Extract target URL from query params (e.g., /api/scrape?url=/projects)
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("url") || "/"; // Default to homepage

  try {
    // Launch Playwright (headless in production)
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Scrape your OWN site (avoid third-party rate limits)
    const targetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${path}`;
    await page.goto(targetUrl, { waitUntil: "networkidle" });

    // Extract clean text (optional: filter nav/footer)
    const pageText = await page.evaluate(() => {
      // Skip boilerplate (customize for your site)
      const body = document.querySelector("body")?.innerText || "";
      return body
        .replace(/\s+/g, " ") // Collapse whitespace
        .trim();
    });

    await browser.close();

    // After scraping the page:
    const chunks = chunkText(pageText);

    // Generate embeddings for all chunks
    const embeddings = await Promise.all(
      chunks.map((chunk) => getEmbeddings(chunk))
    );

    // Store in Pinecone
    await storeInPinecone(chunks, embeddings, targetUrl);

    // Return raw or chunked text (for embeddings)
    return NextResponse.json({
      success: true,
      url: targetUrl,
      chunks: chunks.length, // Return count instead of raw content
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, error: "Scraping failed" },
      { status: 500 }
    );
  }
}

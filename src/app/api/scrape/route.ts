import { chromium } from "playwright";
import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/embed";
import { pineconeIndex } from "@/lib/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

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
      id: btoa(`${url}-${i}`), // Deterministic ID based on URL and chunk index
      values: embeddings[i],
      metadata: {
        text: chunk.slice(0, 500), // Truncate to avoid metadata size limits
        url: url,
        chunkIndex: i,
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
    console.log(`Upserted ${vectors.length} vectors for ${url}`);
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
  // Define all internal pages to scrape
  const internalPaths = [
    "/",
    "/about", 
    "/projects",
    "/chat"
  ];

  try {
    console.log("Starting full website scraping and indexing...");
    
    // Delete all existing vectors from Pinecone to start fresh
    console.log("Clearing existing vectors from Pinecone...");
    await pineconeIndex.deleteAll();
    console.log("Successfully cleared all vectors from Pinecone");

    // Initialize LangChain text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
      separators: ["\n\n", "\n", " ", ""],
    });

    // Launch Playwright browser once for all pages
    const browser = await chromium.launch();
    
    let totalChunks = 0;
    const processedPages = [];

    // Process each internal page
    for (const path of internalPaths) {
      try {
        console.log(`Processing page: ${path}`);
        
        const page = await browser.newPage();
        const targetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${path}`;
        
        await page.goto(targetUrl, { waitUntil: "networkidle" });

        // Extract clean text content
        const pageText = await page.evaluate(() => {
          // Remove navigation, footer, and other boilerplate elements
          const elementsToRemove = [
            'nav', 'header[role="banner"]', 'footer', 
            '[role="navigation"]', '.navigation', '#navigation',
            '.header', '.footer', '.nav', '.navbar'
          ];
          
          elementsToRemove.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });

          // Get main content
          const mainContent = document.querySelector('main') || document.body;
          const text = mainContent?.innerText || "";
          
          return text
            .replace(/\s+/g, " ") // Collapse whitespace
            .trim();
        });

        await page.close();

        if (!pageText || pageText.length < 50) {
          console.warn(`Skipping ${path} - insufficient content`);
          continue;
        }

        // Use LangChain to split text into semantic chunks
        const chunks = await textSplitter.splitText(pageText);
        
        if (chunks.length === 0) {
          console.warn(`No chunks generated for ${path}`);
          continue;
        }

        console.log(`Generated ${chunks.length} chunks for ${path}`);

        // Generate embeddings for all chunks
        const embeddings = await Promise.all(
          chunks.map((chunk) => getEmbeddings(chunk))
        );

        // Store in Pinecone
        await storeInPinecone(chunks, embeddings, targetUrl);
        
        totalChunks += chunks.length;
        processedPages.push({
          path,
          url: targetUrl,
          chunks: chunks.length,
          textLength: pageText.length
        });

      } catch (pageError) {
        console.error(`Failed to process page ${path}:`, pageError);
        processedPages.push({
          path,
          error: pageError instanceof Error ? pageError.message : String(pageError)
        });
      }
    }

    await browser.close();

    console.log(`Scraping completed. Total chunks indexed: ${totalChunks}`);

    return NextResponse.json({
      success: true,
      message: "Successfully scraped and indexed all pages",
      totalChunks,
      processedPages,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Scraping process failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Scraping failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
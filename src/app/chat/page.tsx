'use client'

// /app/chat/page.tsx
import ChatBot from "@/components/ChatBot";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            AI Assistant Chat
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">How it works</h2>
            <div className="space-y-3 text-gray-700">
              <p>• Ask questions about your website content</p>
              <p>• Get contextual answers powered by your scraped data</p>
              <p>• Powered by Gemini 2.0 Flash and Pinecone vector search</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Try asking:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  &quot;What projects are featured on the site?&quot;
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  &quot;What technologies are mentioned?&quot;
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  &quot;Tell me about the main features&quot;
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  &quot;What services are offered?&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating ChatBot */}
      <ChatBot />
    </div>
  );
}

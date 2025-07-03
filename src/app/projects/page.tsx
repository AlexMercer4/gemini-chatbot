export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">My Projects</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">E-commerce Platform</h2>
          <p className="text-muted-foreground mb-4">
            A full-featured online store with payment integration and inventory
            management.
          </p>
          <p className="text-sm text-muted-foreground">
            Technologies: Next.js, Stripe, MongoDB
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">AI Content Assistant</h2>
          <p className="text-muted-foreground mb-4">
            A RAG-based chatbot that helps users with content creation and
            research.
          </p>
          <p className="text-sm text-muted-foreground">
            Technologies: LangChain, Gemini API, Vector Search
          </p>
        </div>
      </div>
    </div>
  );
}

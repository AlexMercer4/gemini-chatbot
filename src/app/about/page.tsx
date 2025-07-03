export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">About Me</h1>
      <div className="prose max-w-3xl">
        <p>
          I&apos;m a full-stack developer with over 5 years of experience
          building web applications. My expertise includes React, Node.js, and
          modern AI technologies.
        </p>
        <h2 className="text-2xl font-semibold mt-8">My Skills</h2>
        <ul>
          <li>Frontend: React, Next.js, TypeScript</li>
          <li>Backend: Node.js, Express, MongoDB</li>
          <li>AI: LangChain, LLM integration, RAG systems</li>
          <li>DevOps: Docker, AWS, CI/CD</li>
        </ul>
      </div>
    </div>
  );
}

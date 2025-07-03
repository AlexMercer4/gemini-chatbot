import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold">My Portfolio</h1>
        <nav className="flex gap-4">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/projects" className="hover:underline">
            Projects
          </Link>
          <Link href="/blog" className="hover:underline">
            Blog
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </nav>
      </header>

      <section className="mb-16">
        <h2 className="text-4xl font-bold mb-4">
          Welcome to My Creative Space
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          I&apos;m a passionate developer building innovative solutions. Explore
          my work and feel free to chat with my AI assistant about any of my
          projects.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/projects">View Projects</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/chat">Chat with AI</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Web Development</h3>
          <p className="text-muted-foreground">
            Modern, responsive websites built with cutting-edge technologies.
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">AI Integration</h3>
          <p className="text-muted-foreground">
            Smart solutions powered by artificial intelligence.
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">UX Design</h3>
          <p className="text-muted-foreground">
            User-centered designs that deliver exceptional experiences.
          </p>
        </div>
      </section>

      <footer className="border-t pt-8">
        <p className="text-muted-foreground text-center">
          © {new Date().getFullYear()} My Portfolio. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

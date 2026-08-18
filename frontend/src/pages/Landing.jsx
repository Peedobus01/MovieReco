import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-ink text-cream">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <img src="/movie-reco-logo.png" alt="MovieReco Logo" className="h-10" />
          <span className="font-display font-semibold text-2xl tracking-tight text-cream">MovieReco</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/login" className="text-muted hover:text-cream transition-colors">Log in</Link>
          <Link to="/register" className="bg-primary text-ink px-4 py-2 rounded font-semibold hover:bg-primary-soft transition-colors">
            Create account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Stop scrolling. <br className="hidden sm:block" /> Start watching.
          </h1>
          <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            The Movie Recommendation System is your personal AI-powered movie discovery platform. We cut through the noise with deep contextual recommendations tailored to your exact taste.
          </p>
          <Link to="/register" className="inline-block bg-primary text-ink text-lg font-semibold px-8 py-4 rounded hover:bg-primary-soft transition-colors">
            Get started for free
          </Link>
        </section>

        {/* Features / Screenshots Section */}
        <section className="px-6 py-16 max-w-6xl mx-auto space-y-24">
          
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-4">
              <h2 className="font-display text-3xl font-semibold">AI-Powered "For You" Picks</h2>
              <p className="text-muted leading-relaxed">
                Describe exactly what you're in the mood for. "A sci-fi movie about time travel, but with a strong emotional core." Our AI engine understands complex plots, tropes, and tones, giving you recommendations that actually make sense.
              </p>
            </div>
            <img 
              src="/ai-search-demo.png" 
              alt="AI Search Demo" 
              className="flex-1 w-full rounded-xl border border-border shadow-lg" 
            />
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 space-y-4">
              <h2 className="font-display text-3xl font-semibold">Structured Ratings & Watchlist</h2>
              <p className="text-muted leading-relaxed">
                Keep track of everything you watch. Rate your favorite films, save movies for later in your watchlist, and build a taste profile that gets sharper with every rating you provide.
              </p>
            </div>
            <img 
              src="/dashboard-demo.jpg" 
              alt="Dashboard Demo" 
              className="flex-1 w-full rounded-xl border border-border shadow-lg" 
            />
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border mt-12 bg-surface">
        <p className="text-muted text-sm font-mono">
          Made with love ❤️ by Subhodeep Paul
        </p>
      </footer>
    </div>
  );
}

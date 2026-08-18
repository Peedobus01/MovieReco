// A cleaner, logo-centric editorial panel
export default function AuthVisualPanel({ eyebrow, headline, sub }) {
  return (
    <div className="hidden lg:flex flex-col justify-center items-center w-1/2 min-h-screen bg-[#6ee7b7]/10 border-r border-border px-14 py-16 relative overflow-hidden">
      
      {/* Decorative background logo fade */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <img src="/movie-reco-logo.png" alt="" className="w-[150%] max-w-none blur-sm" />
      </div>

      <div className="relative z-10 max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <img src="/movie-reco-logo.png" alt="MovieReco Logo" className="w-64 drop-shadow-xl" />
        </div>

        <span className="inline-block px-3 py-1.5 mb-6 text-xs font-mono tracking-widest text-primary border border-primary/40 rounded uppercase bg-primary/10">
          {eyebrow}
        </span>
        
        <h1 className="font-display text-4xl leading-tight font-semibold text-cream">
          {headline}
        </h1>
        
        <p className="mt-5 text-muted text-base leading-relaxed">
          {sub}
        </p>
      </div>

      <div className="absolute bottom-12 w-full text-center text-xs font-mono text-muted/60 tracking-widest">
        MOVIE RECO SINCE 2026
      </div>
    </div>
  );
}

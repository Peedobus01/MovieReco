import { useState, useEffect } from "react";
import { useNavigate, useNavigationType } from "react-router-dom";
import recommendationService from "../services/recommendationService";
import RecommendationCard from "../components/RecommendationCard";

const STORAGE_KEY = "cinematch_recommendations_state";

function loadSavedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage can fail in some private-browsing modes - not critical, just skip persisting
  }
}

function isHardReload() {
  try {
    const entries = performance.getEntriesByType("navigation");
    return entries.length > 0 && entries[0].type === "reload";
  } catch {
    return false;
  }
}

export default function Recommendations() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const cameBackViaHistory = navigationType === "POP" && !isHardReload();
  const saved = cameBackViaHistory ? loadSavedState() : null;

  useEffect(() => {
    if (!cameBackViaHistory) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [query, setQuery] = useState(saved?.query ?? "");
  const [recommendations, setRecommendations] = useState(saved?.recommendations ?? []);
  const [isColdStart, setIsColdStart] = useState(saved?.isColdStart ?? false);
  const [usedLLM, setUsedLLM] = useState(saved?.usedLLM ?? false);
  const [referenceMatchApplied, setReferenceMatchApplied] = useState(saved?.referenceMatchApplied ?? null);
  const [referenceTitle, setReferenceTitle] = useState(saved?.referenceTitle ?? null);
  const [hasApiKey, setHasApiKey] = useState(saved?.hasApiKey ?? true);
  const [loading, setLoading] = useState(!saved);
  const [error, setError] = useState("");
  const [activeLabel, setActiveLabel] = useState(saved?.activeLabel ?? "Personalized for you");

  const applyResult = (data, label, currentQuery) => {
    setRecommendations(data.recommendations);
    setIsColdStart(data.isColdStart);
    setUsedLLM(data.usedLLM);
    setReferenceMatchApplied(data.referenceMatchApplied ?? null);
    setReferenceTitle(data.referenceTitle ?? null);
    setHasApiKey(data.hasApiKey ?? true);
    if (label) setActiveLabel(label);

    saveState({
      query: currentQuery ?? query,
      recommendations: data.recommendations,
      isColdStart: data.isColdStart,
      usedLLM: data.usedLLM,
      hasApiKey: data.hasApiKey ?? true,
      referenceMatchApplied: data.referenceMatchApplied ?? null,
      referenceTitle: data.referenceTitle ?? null,
      activeLabel: label ?? activeLabel,
    });
  };

  useEffect(() => {
    if (saved) return;

    let cancelled = false;
    recommendationService
      .getRecommendations()
      .then((data) => {
        if (!cancelled) applyResult(data, "Personalized for you", "");
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Couldn't load recommendations");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    try {
      const data = await recommendationService.getRecommendationsForQuery(query.trim());
      applyResult(data, `Results for "${query.trim()}"`, query.trim());
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't process that request");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setQuery("");
    setLoading(true);
    try {
      const data = await recommendationService.getRecommendations();
      applyResult(data, "Personalized for you", "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-cream mb-1">For You</h1>
      <p className="text-muted text-sm mb-6">
        Personalized picks based on your ratings, or ask for something specific.
      </p>

      {hasApiKey === false && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/40 rounded-card flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-red-400 font-semibold text-sm mb-1">AI Features Disabled</h3>
            <p className="text-muted text-xs">You need to set up your Gemini API Key in your profile to enable smart search and AI recommendations.</p>
          </div>
          <button 
            onClick={() => navigate("/profile")}
            className="text-xs px-4 py-2 bg-surfaceRaised border border-border rounded hover:bg-surface transition-colors whitespace-nowrap text-cream"
          >
            Setup API Key
          </button>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try: "an emotional sci-fi movie like Interstellar but less complex"'
          className="input-field"
        />
        <button type="submit" disabled={loading} className="btn-primary w-auto px-6 flex-shrink-0">
          Ask
        </button>
      </form>
      {activeLabel !== "Personalized for you" && (
        <button onClick={handleClearSearch} className="text-xs text-muted hover:text-cream mb-6">
          ← Back to personalized picks
        </button>
      )}

      <div className="flex items-center gap-2 my-6">
        <h2 className="text-sm text-muted">{activeLabel}</h2>
        {isColdStart && (
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted border border-border rounded-full px-2 py-0.5">
            Rate a few movies to personalize this
          </span>
        )}
        {usedLLM && (
          <span className="text-[10px] font-mono uppercase tracking-wide text-primary border border-primary/40 rounded-full px-2 py-0.5">
            AI-explained
          </span>
        )}
        {referenceMatchApplied === true && (
          <span className="text-[10px] font-mono uppercase tracking-wide text-primary border border-primary/40 rounded-full px-2 py-0.5">
            Matched to "{referenceTitle}"
          </span>
        )}
        {referenceMatchApplied === false && referenceTitle && (
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted border border-border rounded-full px-2 py-0.5">
            Couldn't look up "{referenceTitle}" this time — showing your general taste instead
          </span>
        )}
      </div>

      {loading && <p className="text-muted font-mono text-sm">Thinking...</p>}
      {error && <p className="text-primary-soft text-sm">{error}</p>}

      {!loading && !error && recommendations.length === 0 && (
        <p className="text-muted text-sm">No recommendations yet — try rating a few movies first.</p>
      )}

      <div className="space-y-3">
        {recommendations.map((movie) => (
          <RecommendationCard key={movie.id} movie={movie} onClick={(m) => navigate(`/movie/${m.id}`)} />
        ))}
      </div>
    </div>
  );
}
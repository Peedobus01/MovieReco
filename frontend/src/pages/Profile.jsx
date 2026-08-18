import { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import profileService from "../services/profileService";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_COLORS = ["#E8A33D", "#C7842A", "#F4C878", "#8B8B93", "#4A4B4F", "#2E2F33"];

function StatBlock({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-card px-4 py-3">
      <p className="text-2xl font-display font-semibold text-cream">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}

function TagList({ items, nameKey }) {
  if (!items?.length) return <p className="text-muted text-sm">Not enough ratings yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 6).map((item) => (
        <span key={item[nameKey === "genreName" ? "genreId" : "personId"]} className="text-xs px-3 py-1.5 rounded-full border border-border text-cream">
          {item[nameKey]}
        </span>
      ))}
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // API Key Management State
  const [geminiKey, setGeminiKey] = useState("");
  const [savingKeys, setSavingKeys] = useState(false);
  const [usage, setUsage] = useState({ usageToday: 0, hasGeminiKey: false });
  const [keyMessage, setKeyMessage] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    Promise.all([
      profileService.getMyProfile(),
      profileService.getLlmUsage().catch(() => null)
    ])
      .then(([profileData, usageData]) => {
        setProfile(profileData);
        if (usageData) {
          setUsage(usageData);
          // We intentionally leave geminiKey empty so we don't accidentally save asterisks
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveKeys = async () => {
    setSavingKeys(true);
    setKeyMessage("");
    try {
      const payload = {};
      if (geminiKey && geminiKey.trim() !== "") payload.gemini = geminiKey.trim();
      
      if (!payload.gemini) {
        setKeyMessage("Please enter a valid key to save.");
        setSavingKeys(false);
        return;
      }
      
      await profileService.updateApiKeys(payload);
      setKeyMessage("Keys saved successfully!");
      
      // Update local state to reflect it's saved
      setUsage(prev => ({ ...prev, hasGeminiKey: true }));
      setGeminiKey("");
    } catch (err) {
      setKeyMessage(err.response?.data?.message || "Failed to save keys.");
    } finally {
      setSavingKeys(false);
    }
  };

  const handleRemoveKey = async () => {
    setSavingKeys(true);
    setKeyMessage("");
    try {
      await profileService.updateApiKeys({ gemini: "" });
      setUsage(prev => ({ ...prev, hasGeminiKey: false }));
      setGeminiKey("");
      setKeyMessage("API Key removed.");
    } catch (err) {
      setKeyMessage("Failed to remove key.");
    } finally {
      setSavingKeys(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-6 py-20 text-muted font-mono text-sm">Loading...</div>;
  }
  if (!profile) {
    return <div className="max-w-5xl mx-auto px-6 py-20 text-primary-soft">Couldn't load your profile.</div>;
  }

  const genreChartData = {
    labels: profile.favouriteGenres.slice(0, 6).map((g) => g.genreName),
    datasets: [
      {
        data: profile.favouriteGenres.slice(0, 6).map((g) => g.score),
        backgroundColor: CHART_COLORS,
        borderColor: "#121214",
        borderWidth: 2,
      },
    ],
  };

  const ratingChartData = {
    labels: profile.ratingDistribution.map((r) => `${r.star}★`),
    datasets: [
      {
        data: profile.ratingDistribution.map((r) => r.count),
        backgroundColor: "#E8A33D",
        borderRadius: 4,
      },
    ],
  };

  const chartTextColor = "#8B8B93";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-surfaceRaised border border-border flex items-center justify-center text-2xl font-display text-primary">
          {profile.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream">{profile.name}</h1>
          <p className="text-muted text-sm">{profile.email}</p>
          <p className="text-muted text-xs font-mono mt-0.5">
            Joined {new Date(profile.accountCreatedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatBlock label="Movies rated" value={profile.totalMoviesRated} />
        <StatBlock label="Avg. rating given" value={profile.averageRatingGiven?.toFixed(1) || "—"} />
        <StatBlock label="Watchlist" value={profile.watchlistCount} />
        <StatBlock label="Reviews written" value={profile.reviewCount} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        <div>
          <h3 className="text-sm text-muted mb-2">Favourite genres</h3>
          <TagList items={profile.favouriteGenres} nameKey="genreName" />
        </div>
        <div>
          <h3 className="text-sm text-muted mb-2">Favourite directors</h3>
          <TagList items={profile.favouriteDirectors} nameKey="name" />
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-sm text-muted mb-2">Favourite actors</h3>
        <TagList items={profile.favouriteActors} nameKey="name" />
      </div>

      <div className="bg-surface border border-border rounded-card p-5 mb-10">
        <h3 className="text-lg font-display text-cream font-semibold mb-4">AI Features & API Keys</h3>
        <p className="text-sm text-muted mb-6 max-w-2xl">
          The Movie Recommendation System uses AI to provide deep, contextual recommendations. To use this feature, please provide your own Gemini API Key.
          Your key is stored securely.
        </p>

        {usage.hasGeminiKey ? (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/30 text-green-400 border border-green-800 rounded text-sm font-medium">
            <span className="text-lg">✓</span> AI Features Active
          </div>
        ) : (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-red-900/30 text-red-400 border border-red-800 rounded text-sm font-medium">
            <span className="text-lg">⚠</span> AI Features Disabled (API Key Required)
          </div>
        )}
        
        <div className="flex flex-col gap-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Gemini API Key</label>
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"} 
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter your Api key here"
                className="w-full bg-[#fef3c7] border border-border rounded px-3 py-2 pr-10 text-sm text-black placeholder:text-black/50 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-black/60 hover:text-black transition-colors"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={handleSaveKeys}
              disabled={savingKeys}
              className="px-4 py-2 bg-primary text-black font-semibold rounded hover:bg-primary-soft transition-colors disabled:opacity-50"
            >
              {savingKeys ? "Saving..." : "Save API Key"}
            </button>
            {usage.hasGeminiKey && (
              <button 
                onClick={handleRemoveKey}
                disabled={savingKeys}
                className="px-4 py-2 bg-red-900/20 text-red-400 font-semibold rounded hover:bg-red-900/40 transition-colors disabled:opacity-50 border border-red-900/30"
              >
                Remove Key
              </button>
            )}
            {keyMessage && <span className="text-sm text-primary-soft">{keyMessage}</span>}
          </div>
          
          <div className="mt-4 p-4 bg-background border border-border rounded text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted">Today's LLM Requests:</span>
              <span className="text-cream font-mono">{usage.usageToday}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-card p-5">
          <h3 className="text-sm text-muted mb-4">Genre distribution</h3>
          {profile.favouriteGenres.length > 0 ? (
            <Pie
              data={genreChartData}
              options={{
                plugins: { legend: { position: "bottom", labels: { color: chartTextColor, boxWidth: 12, font: { size: 11 } } } },
              }}
            />
          ) : (
            <p className="text-muted text-sm">Rate a few movies to see this chart.</p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-card p-5">
          <h3 className="text-sm text-muted mb-4">Rating distribution</h3>
          <Bar
            data={ratingChartData}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: chartTextColor }, grid: { color: "#2E2F33" } },
                y: { ticks: { color: chartTextColor, stepSize: 1 }, grid: { color: "#2E2F33" } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
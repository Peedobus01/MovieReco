const gemini = require("../config/gemini");

const RECOMMENDATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tmdbId: { type: "INTEGER" },
          reason: { type: "STRING" },
        },
        required: ["tmdbId", "reason"],
      },
    },
  },
  required: ["recommendations"],
};

const EXTRACTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    language: { type: "STRING" },
    genres: { type: "ARRAY", items: { type: "STRING" } },
    yearFrom: { type: "INTEGER" },
    yearTo: { type: "INTEGER" },
    suggestedTitles: { type: "ARRAY", items: { type: "STRING" } }
  }
};

async function extractSearchParameters(query, apiKey) {
  const prompt = `You are a movie recommendation assistant. Your job is to extract exact search parameters from a user's natural language query to query the TMDB API.
  
User Query: "${query}"

Rules:
- language: ISO 639-1 two letter code if specified. Examples: 'hi' (Hindi), 'te' (Telugu), 'ta' (Tamil), 'ml' (Malayalam), 'bn' (Bengali), 'en' (English), 'ko' (Korean), 'ja' (Japanese), 'it' (Italian), 'fr' (French), 'es' (Spanish), etc.
- genres: List of exact TMDB genre names (e.g., 'Action', 'Comedy', 'Drama', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 'Horror').
- yearFrom: The start year if a decade or range is specified (e.g., "1990s" -> 1990, "21st century" -> 2000, "old 1950s" -> 1950).
- yearTo: The end year if a decade or range is specified (e.g., "1990s" -> 1999, "21st century" -> 2099, "old 1950s" -> 1959).
- suggestedTitles: CRITICAL! If the user mentions a very specific plot, highly specific theme, famous actor/director, or complex scenario, provide a list of 5 to 10 famous movie titles that perfectly match the request. 
  - Sci-Fi/Mind-bending: "dream within a dream", "AI falling in love", "time loop", "space travel with time dilation".
  - Action/Thriller: "retired hitman gets revenge", "heist in a casino", "unreliable narrator with amnesia", "locked room murder mystery", "serial killer playing games with police".
  - Romance/Drama: "enemies to lovers", "arranged marriage turning into real love", "terminal illness romance", "rich boy poor girl", "caste-based forbidden love", "hero dies and reborn".
  - Comedy/Slice-of-life: "friends on a road trip before marriage", "body swap", "family financial issues but child clears big exam", "forced to study engineering".
  - Tropes/Themes: "coming of age", "rags to riches", "underdog sports team wins", "whodunnit", "fish out of water".
  - Actor/Director examples: "A Shah Rukh Khan movie", "directed by Christopher Nolan", "starring Mohanlal".
  - If the query is complex like the examples above, brainstorm the best exact titles (e.g., ["Inception", "John Wick", "Zindagi Na Milegi Dobara", "12th Fail", "Om Shanti Om", "Drishyam"]).
  - Leave empty ONLY if the query is a generic genre search (e.g., "give me a good comedy").`;

  return await gemini.generateStructuredContent({ prompt, schema: EXTRACTION_SCHEMA, apiKey });
}

// function buildPrompt({ candidates, profile, isColdStart, nlQuery }) {
//   const candidateLines = candidates
//     .map((c) => {
//       const tag = c.isReferenceMatch ? " [SIMILAR TO REQUESTED MOVIE]" : "";
//       return `- id:${c.id} | "${c.title}" | rating:${c.vote_average} | genre_ids:${(c.genre_ids || []).join(",")}${tag}`;
//     })
//     .join("\n");

//   const profileLines = isColdStart
//     ? "This is a new user with little or no rating history yet - recommend broadly appealing, high-quality picks from the candidates."
//     : `Favourite genres: ${profile.topGenres.map((g) => g.genreName).join(", ") || "none yet"}
// Favourite directors: ${profile.topDirectors.map((d) => d.name).join(", ") || "none yet"}
// Favourite actors: ${profile.topActors.map((a) => a.name).join(", ") || "none yet"}
// Movies they rated highly: ${profile.liked.map((m) => m.title).join(", ") || "none yet"}
// Movies they rated poorly: ${profile.disliked.map((m) => m.title).join(", ") || "none yet"}`;

//   const queryLine = nlQuery
//     ? `The user is specifically asking: "${nlQuery}" - prioritize matching this request over general taste. Candidates tagged [SIMILAR TO REQUESTED MOVIE] were pulled specifically because they resemble the movie the user named - strongly prefer these over movies that only match the user's general historical taste. Among those tagged candidates, favor the ones that are critically well-regarded, directed by acclaimed filmmakers, or known for strong writing/score/craft, and that most closely match the emotional tone and complexity level described in the request - not just shared genre.`
//     : "No specific request right now - give well-matched personalized picks based on their profile.";


function buildPrompt({ candidates, profile, isColdStart, nlQuery }) {
  const candidateLines = candidates
    .map((c) => {
      let tag = "";
      if (c.isReferenceMatch) tag = " [SIMILAR TO REQUESTED MOVIE]";
      if (c.isSuggested) tag = " [HIGHLY RELEVANT TO PLOT]";
      
      const lang = c.original_language ? ` | lang:${c.original_language}` : "";
      const year = c.release_date ? ` | year:${c.release_date.substring(0, 4)}` : "";
      const overview = c.overview ? ` | overview: "${c.overview.replace(/\n/g, " ").substring(0, 150)}..."` : "";
      return `- id:${c.id} | "${c.title}"${year} | rating:${c.vote_average}${lang}${overview} | genre_ids:${(c.genre_ids || []).join(",")}${tag}`;
    })
    .join("\n");

  let profileLines;
  if (nlQuery) {
    profileLines =
      "No user profile is being used for this request, by design - the user asked for something specific, so judge candidates purely on their own merits (genre, tone, cast, critical reception) and how well they match the request below, not on any assumed personal taste.";
  } else if (isColdStart) {
    profileLines =
      "This is a new user with little or no rating history yet - recommend broadly appealing, high-quality picks from the candidates.";
  } else {
    profileLines = `Favourite genres: ${profile.topGenres.map((g) => g.genreName).join(", ") || "none yet"}
Favourite directors: ${profile.topDirectors.map((d) => d.name).join(", ") || "none yet"}
Favourite actors: ${profile.topActors.map((a) => a.name).join(", ") || "none yet"}
Movies they rated highly: ${profile.liked.map((m) => m.title).join(", ") || "none yet"}
Movies they rated poorly: ${profile.disliked.map((m) => m.title).join(", ") || "none yet"}`;
  }

  const queryLine = nlQuery
    ? `The user is specifically asking: "${nlQuery}". Candidates tagged [SIMILAR TO REQUESTED MOVIE] or [HIGHLY RELEVANT TO PLOT] were pulled specifically to match the user's request - strongly prefer these when present. Among all candidates, read the overviews and favor the ones that are critically well-regarded, directed by acclaimed filmmakers, and that most closely match the exact plot, emotional tone, and complexity level described in the request - not just shared genre.`
    : "No specific request right now - give well-matched personalized picks based on their profile.";
    
  return `You are the recommendation assistant for the Movie Recommendation System, a movie discovery platform.

STRICT RULE: You must choose ONLY from the CANDIDATE MOVIES list below, referencing each by its exact id. Never invent, assume, or suggest any movie that is not in this list, even if you believe a better match exists elsewhere.

USER PROFILE:
${profileLines}

REQUEST:
${queryLine}

CANDIDATE MOVIES:
${candidateLines}

Pick the 5 to 8 best-matching movies from the candidate list above for this user and this request. For each pick, write a short reason (under 20 words) explaining specifically why it fits this user - reference their taste or the request directly rather than a generic description of the movie.`;
}

async function getRecommendationsFromLLM({ candidates, profile, isColdStart, nlQuery = null, apiKey }) {
  try {
    const prompt = buildPrompt({ candidates, profile, isColdStart, nlQuery });
    const result = await gemini.generateStructuredContent({ prompt, schema: RECOMMENDATION_SCHEMA, apiKey });

    const candidateIds = new Set(candidates.map((c) => c.id));
    const validated = (result.recommendations || []).filter((r) => candidateIds.has(r.tmdbId));

    if (validated.length === 0) return null;

    const candidateById = Object.fromEntries(candidates.map((c) => [c.id, c]));
    return validated.map((r) => ({ ...candidateById[r.tmdbId], reason: r.reason, source: "llm" }));
  } catch (err) {
    console.error("LLM recommendation call failed, falling back to deterministic ranking:", err.message);
    return null;
  }
}

module.exports = { getRecommendationsFromLLM, extractSearchParameters };
const asyncHandler = require("express-async-handler");
const recommendationService = require("../services/recommendationService");
const llmService = require("../services/llmService");
const tmdbService = require("../services/tmdbService");
const User = require("../models/User");

function extractReferenceTitle(query) {
  const lower = query.toLowerCase();
  const triggers = ["like ", "similar to ", "such as "];
  let idx = -1;
  let triggerLen = 0;
  for (const t of triggers) {
    const pos = lower.indexOf(t);
    if (pos !== -1 && (idx === -1 || pos < idx)) {
      idx = pos;
      triggerLen = t.length;
    }
  }
  if (idx === -1) return null;

  const rest = query.slice(idx + triggerLen);
  const match = rest.match(/^([A-Z0-9][\w:'-]*(?:\s+[A-Z0-9][\w:'-]*)*)/);
  return match ? match[1].trim() : null;
}

async function withRetry(fn, retries = 2, delayMs = 500) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, retries - 1, delayMs);
  }
}

async function buildCandidatePool(userId, nlQuery) {
  if (!nlQuery) {
    const { candidates, isColdStart, profile } = await recommendationService.getCandidatesForUser(userId);
    return { candidates, isColdStart, profile, referenceMatchApplied: false, referenceTitle: null };
  }

  const genericCandidates = await recommendationService.buildGenericCandidates();

  const referenceTitle = extractReferenceTitle(nlQuery);
  if (!referenceTitle) {
    return {
      candidates: genericCandidates,
      isColdStart: false,
      profile: null,
      referenceMatchApplied: false,
      referenceTitle: null,
    };
  }

  try {
    const searchResult = await withRetry(() => tmdbService.searchMoviesByTitle(referenceTitle));

    const topCandidates = (searchResult.results || []).slice(0, 5);
    const topMatch = topCandidates.length
      ? topCandidates.reduce((best, m) => (m.vote_count > best.vote_count ? m : best))
      : null;

    if (!topMatch) {
      return {
        candidates: genericCandidates,
        isColdStart: false,
        profile: null,
        referenceMatchApplied: false,
        referenceTitle,
      };
    }

    const [similar, recommended] = await Promise.all([
      withRetry(() => tmdbService.getSimilarMovies(topMatch.id)),
      withRetry(() => tmdbService.getRecommendedMovies(topMatch.id)),
    ]);

    const enriched = recommendationService.mergeCandidatePools(genericCandidates, [...similar, ...recommended]);
    return { candidates: enriched, isColdStart: false, profile: null, referenceMatchApplied: true, referenceTitle };
  } catch (err) {
    console.error(
      `Reference-title enrichment failed for "${referenceTitle}", continuing without it:`,
      err.message
    );
    return {
      candidates: genericCandidates,
      isColdStart: false,
      profile: null,
      referenceMatchApplied: false,
      referenceTitle,
    };
  }
}

function deterministicReason(isColdStart, hasQuery) {
  if (hasQuery) return "Matches your search.";
  return isColdStart ? "Popular and highly rated right now." : "Matches your favourite genres and directors.";
}

const getRecommendations = asyncHandler(async (req, res) => {
  const { candidates, isColdStart, profile } = await buildCandidatePool(req.user._id, null);

  const user = await User.findById(req.user._id).select("+geminiApiKey");

  let llmResult = null;
  if (user.geminiApiKey) {
    llmResult = await llmService.getRecommendationsFromLLM({
      candidates,
      profile,
      isColdStart,
      nlQuery: null,
      apiKey: user.geminiApiKey
    });
  }

  const recommendations =
    llmResult ||
    candidates
      .slice(0, 8)
      .map((c) => ({ ...c, reason: deterministicReason(isColdStart, false), source: "deterministic" }));

  res.json({ success: true, data: { recommendations, isColdStart, usedLLM: !!llmResult, hasApiKey: !!user.geminiApiKey } });
});

const getRecommendationsForQuery = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    res.status(400);
    throw new Error("Please provide a search query");
  }

  const user = await User.findById(req.user._id).select("+geminiApiKey +llmUsage");
  let apiKey = user.geminiApiKey;
  let extractedParams = null;

  if (apiKey) {
    const now = new Date();
    const lastReset = user.llmUsage?.lastReset ? new Date(user.llmUsage.lastReset) : new Date();
    if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      if (!user.llmUsage) user.llmUsage = {};
      user.llmUsage.count = 0;
      user.llmUsage.lastReset = now;
    }
    
    try {
      const { candidates: baseCandidates, isColdStart, profile, referenceMatchApplied, referenceTitle } = await buildCandidatePool(req.user._id, query);
      
      extractedParams = await llmService.extractSearchParameters(query, apiKey);
      
      if (!user.llmUsage) user.llmUsage = {};
      user.llmUsage.count = (user.llmUsage.count || 0) + 1;
      user.markModified("llmUsage");
      await user.save();
      
      const allGenres = await tmdbService.getGenreList();
      let genreIds = [];
      if (extractedParams.genres && Array.isArray(extractedParams.genres)) {
        genreIds = extractedParams.genres.map(g => {
          const match = allGenres.find(tmdbG => tmdbG.name.toLowerCase() === g.toLowerCase());
          return match ? match.id : null;
        }).filter(id => id !== null);
      }

      let language = extractedParams.language;
      if (language && language.length > 2) {
         if (language.toLowerCase().includes("hindi")) language = "hi";
         else if (language.toLowerCase().includes("english")) language = "en";
         else if (language.toLowerCase().includes("korean")) language = "ko";
      }

      const tmdbFilters = {
        genreIds,
        language: language || undefined,
        yearFrom: extractedParams.yearFrom,
        yearTo: extractedParams.yearTo,
      };

      const [search1, search2] = await Promise.all([
        tmdbService.discoverMovies(tmdbFilters, 1),
        tmdbService.discoverMovies(tmdbFilters, 2)
      ]);
      
      const newCandidates = [...(search1.results || []), ...(search2.results || [])];
      
      // Inject LLM's suggested exact movie titles if they exist
      if (extractedParams.suggestedTitles && Array.isArray(extractedParams.suggestedTitles)) {
        const titleSearches = await Promise.all(
          extractedParams.suggestedTitles.map(title => 
            withRetry(() => tmdbService.searchMoviesByTitle(title, 1).catch(() => null))
          )
        );
        for (const search of titleSearches) {
          if (search && search.results && search.results.length > 0) {
            newCandidates.push({ ...search.results[0], isSuggested: true }); // Add the best match for the title
          }
        }
      }
      
      const seen = new Set();
      const combinedCandidates = [...baseCandidates, ...newCandidates].filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      }).slice(0, 80);
      
      if (combinedCandidates.length > 0) {
        const llmResult = await llmService.getRecommendationsFromLLM({
          candidates: combinedCandidates,
          profile,
          isColdStart,
          nlQuery: query,
          apiKey
        });
        
        const recommendations = llmResult || combinedCandidates.slice(0, 8).map(c => ({
          ...c,
          reason: "Matches your specific search perfectly.",
          source: "llm_extracted"
        }));

        return res.json({
          success: true,
          data: {
            recommendations,
            isColdStart: false,
            usedLLM: true,
            referenceTitle,
            referenceMatchApplied,
            extractedParams,
            hasApiKey: !!apiKey
          }
        });
      }
    } catch (err) {
      if (err.message === "PROVIDER_LIMIT_REACHED") {
        res.status(429);
        throw new Error("You have reached your daily limit for this API provider. Please try again tomorrow.");
      }
      console.error("LLM Extraction failed, falling back to deterministic:", err.message);
    }
  }

  const { candidates, isColdStart, profile, referenceMatchApplied, referenceTitle } = await buildCandidatePool(
    req.user._id,
    query
  );

  let fallbackLlmResult = null;
  if (apiKey) {
    fallbackLlmResult = await llmService.getRecommendationsFromLLM({
      candidates,
      profile,
      isColdStart,
      nlQuery: query,
      apiKey
    });
  }

  const recommendations =
    fallbackLlmResult ||
    candidates.slice(0, 8).map((c) => ({ ...c, reason: deterministicReason(isColdStart, true), source: "deterministic" }));

  res.json({
    success: true,
    data: {
      recommendations,
      isColdStart,
      usedLLM: !!fallbackLlmResult,
      referenceTitle,
      referenceMatchApplied,
      extractedParams,
      hasApiKey: !!apiKey
    },
  });
});

module.exports = { getRecommendations, getRecommendationsForQuery };
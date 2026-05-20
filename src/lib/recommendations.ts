export type MovieItem = {
  id: string;
  title?: string;
  category?: string;
  tags?: string;
  views?: number;
  createdAt?: { toDate?: () => Date } | Date | string;
  [key: string]: unknown;
};

export type UserTasteSignals = {
  viewedMovieIds: string[];
  likedMovieIds: string[];
};

export type PersonalizedFeedResult = {
  movies: MovieItem[];
  isPersonalized: boolean;
  topCategory?: string;
};

const DIVERSITY_INSERT_AT = [2, 6];
const DIVERSITY_COUNT = 2;

function movieTimestamp(movie: MovieItem): number {
  const created = movie.createdAt;
  if (created && typeof created === 'object' && 'toDate' in created && created.toDate) {
    return created.toDate().getTime();
  }
  if (created instanceof Date) return created.getTime();
  if (typeof created === 'string') return new Date(created).getTime();
  return 0;
}

function sortByNewest(movies: MovieItem[]): MovieItem[] {
  return [...movies].sort((a, b) => movieTimestamp(b) - movieTimestamp(a));
}

function sortByPopularity(movies: MovieItem[]): MovieItem[] {
  return [...movies].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
}

/** Read anonymous watch history from localStorage (set on watch page). */
export function getGuestViewedMovieIds(): string[] {
  if (typeof window === 'undefined') return [];
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('viewed_movie_')) {
      ids.push(key.replace('viewed_movie_', ''));
    }
  }
  return ids;
}

function addCategoryWeight(
  weights: Map<string, number>,
  movie: MovieItem | undefined,
  amount: number
) {
  if (!movie) return;
  const category = movie.category?.trim().toLowerCase();
  if (category) {
    weights.set(`cat:${category}`, (weights.get(`cat:${category}`) || 0) + amount);
  }
  if (movie.tags) {
    movie.tags.split(/\s+/).forEach((tag) => {
      const t = tag.trim().toLowerCase();
      if (t) {
        weights.set(`tag:${t}`, (weights.get(`tag:${t}`) || 0) + amount * 0.6);
      }
    });
  }
}

function buildTasteWeights(
  allMovies: MovieItem[],
  signals: UserTasteSignals
): Map<string, number> {
  const byId = new Map(allMovies.map((m) => [m.id, m]));
  const weights = new Map<string, number>();

  signals.likedMovieIds.forEach((id) => addCategoryWeight(weights, byId.get(id), 6));
  signals.viewedMovieIds.forEach((id) => addCategoryWeight(weights, byId.get(id), 4));

  return weights;
}

function scoreMovie(movie: MovieItem, weights: Map<string, number>): number {
  let score = 0;
  const category = movie.category?.trim().toLowerCase();
  if (category) score += weights.get(`cat:${category}`) || 0;

  if (movie.tags) {
    movie.tags.split(/\s+/).forEach((tag) => {
      const t = tag.trim().toLowerCase();
      if (t) score += weights.get(`tag:${t}`) || 0;
    });
  }

  score += Math.log10((Number(movie.views) || 0) + 1) * 0.35;
  return score;
}

function getTopCategory(
  preferred: MovieItem[],
  weights: Map<string, number>
): string | undefined {
  if (preferred[0]?.category) return preferred[0].category;
  let top: string | undefined;
  let topScore = 0;
  weights.forEach((value, key) => {
    if (!key.startsWith('cat:')) return;
    if (value > topScore) {
      topScore = value;
      top = key.replace('cat:', '');
    }
  });
  return top;
}

function pickDiscoveryMovies(
  pool: MovieItem[],
  count: number,
  excludeIds: Set<string>,
  avoidCategory?: string
): MovieItem[] {
  const picked: MovieItem[] = [];
  const usedCategories = new Set<string>();
  const avoid = avoidCategory?.trim().toLowerCase();

  const sorted = sortByPopularity(pool);

  for (const movie of sorted) {
    if (picked.length >= count) break;
    if (excludeIds.has(movie.id)) continue;

    const cat = movie.category?.trim().toLowerCase() || 'other';
    if (avoid && cat === avoid) continue;
    if (usedCategories.has(cat) && picked.length > 0) continue;

    picked.push(movie);
    usedCategories.add(cat);
    excludeIds.add(movie.id);
  }

  for (const movie of sorted) {
    if (picked.length >= count) break;
    if (!excludeIds.has(movie.id)) {
      picked.push(movie);
      excludeIds.add(movie.id);
    }
  }

  return picked;
}

function mergeWithDiscovery(
  preferred: MovieItem[],
  discovery: MovieItem[],
  rest: MovieItem[]
): MovieItem[] {
  const result: MovieItem[] = [];
  const seen = new Set<string>();

  const push = (movie: MovieItem) => {
    if (!seen.has(movie.id)) {
      seen.add(movie.id);
      result.push(movie);
    }
  };

  let discoveryIndex = 0;
  let preferredIndex = 0;

  while (
    preferredIndex < preferred.length ||
    discoveryIndex < discovery.length ||
    result.length < preferred.length + discovery.length + rest.length
  ) {
    const slot = result.length;

    if (
      discoveryIndex < discovery.length &&
      DIVERSITY_INSERT_AT.includes(slot)
    ) {
      push(discovery[discoveryIndex++]);
      continue;
    }

    if (preferredIndex < preferred.length) {
      push(preferred[preferredIndex++]);
      continue;
    }

    if (discoveryIndex < discovery.length) {
      push(discovery[discoveryIndex++]);
      continue;
    }

    break;
  }

  rest.forEach(push);
  return result;
}

/**
 * Home feed: mostly videos matching user taste, plus a couple from other genres.
 */
export function buildPersonalizedHomeFeed(
  allMovies: MovieItem[],
  signals: UserTasteSignals
): PersonalizedFeedResult {
  if (!allMovies.length) {
    return { movies: [], isPersonalized: false };
  }

  const hasTaste =
    signals.viewedMovieIds.length > 0 || signals.likedMovieIds.length > 0;

  if (!hasTaste) {
    const base = sortByNewest(allMovies);
    const discovery = pickDiscoveryMovies(
      base,
      DIVERSITY_COUNT,
      new Set<string>()
    );
    return {
      movies: mergeWithDiscovery(base.slice(0, Math.max(base.length - DIVERSITY_COUNT, 0)), discovery, []),
      isPersonalized: false,
    };
  }

  const weights = buildTasteWeights(allMovies, signals);
  const scored = allMovies.map((movie) => ({
    movie,
    score: scoreMovie(movie, weights),
  }));

  const preferred = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.movie);

  const preferredIds = new Set(preferred.map((m) => m.id));
  const rest = sortByNewest(
    scored.filter((s) => !preferredIds.has(s.movie.id)).map((s) => s.movie)
  );

  const topCategory = getTopCategory(preferred, weights);
  const discovery = pickDiscoveryMovies(
    allMovies,
    DIVERSITY_COUNT,
    new Set(preferredIds),
    topCategory
  );

  const primary =
    preferred.length > 0 ? preferred : sortByPopularity(allMovies);

  return {
    movies: mergeWithDiscovery(primary, discovery, rest),
    isPersonalized: true,
    topCategory: preferred[0]?.category || topCategory,
  };
}

export function filterMoviesBySearch(
  movies: MovieItem[],
  searchQuery: string
): MovieItem[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return movies;
  return movies.filter(
    (movie) =>
      movie.title?.toLowerCase().includes(q) ||
      movie.category?.toLowerCase().includes(q) ||
      movie.description?.toString().toLowerCase().includes(q) ||
      (movie.tags && String(movie.tags).toLowerCase().includes(q))
  );
}

export function filterMoviesByCategory(
  movies: MovieItem[],
  category: string
): MovieItem[] {
  if (!category || category === 'All') return movies;
  const c = category.toLowerCase();
  return movies.filter((movie) => movie.category?.toLowerCase() === c);
}

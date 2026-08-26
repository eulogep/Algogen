/**
 * scraper.ts
 * Scrape les blogs officiels des plateformes pour détecter les changements d'algo
 */

export interface ScrapedArticle {
  url: string;
  platform: string;
  title: string;
  content: string;
  publishedAt: string | null;
  scrapedAt: string;
}

const PLATFORM_SOURCES: Record<string, { url: string; platform: string }[]> = {
  tiktok: [
    { url: "https://newsroom.tiktok.com/en-us", platform: "tiktok" },
  ],
  instagram_reels: [
    { url: "https://creators.instagram.com/blog", platform: "instagram_reels" },
  ],
  instagram_feed: [
    { url: "https://creators.instagram.com/blog", platform: "instagram_feed" },
  ],
  youtube_shorts: [
    { url: "https://blog.youtube", platform: "youtube_shorts" },
  ],
  youtube_longform: [
    { url: "https://blog.youtube", platform: "youtube_longform" },
  ],
  linkedin: [
    { url: "https://www.linkedin.com/blog/", platform: "linkedin" },
  ],
  // X est collecté via SocialCrawl dans l’observatoire : blog.x.com bloque
  // le HTML automatisé par HTTP 403 et ne doit donc pas faire échouer ce scraper.
};

const ALGO_KEYWORDS = [
  "algorithm",
  "algorithme",
  "ranking",
  "recommendation",
  "feed",
  "distribution",
  "reach",
  "creator",
  "engagement",
  "signal",
  "update",
  "change",
  "new feature",
  "visibility",
  "views",
  "impressions",
];

/**
 * Scrape un blog et retourne les articles potentiellement liés à l'algo
 */
export async function scrapeCreatorBlog(
  url: string,
  platform: string
): Promise<ScrapedArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AlgoLensBot/1.0; +https://algolens.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[scraper] ${url} → HTTP ${response.status}`);
      return [];
    }

    const html = await response.text();
    return parseArticlesFromHtml(html, url, platform);
  } catch (err) {
    console.error(`[scraper] Failed to fetch ${url}:`, err);
    return [];
  }
}

/**
 * Parse le HTML pour extraire les titres + snippets d'articles
 */
function parseArticlesFromHtml(
  html: string,
  sourceUrl: string,
  platform: string
): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];
  const now = new Date().toISOString();

  // Extraire les blocs <article>, <h1>, <h2>, <h3> + paragraphes proches
  const articleBlocks = extractArticleBlocks(html);

  for (const block of articleBlocks) {
    const title = block.title.toLowerCase();
    const content = block.content.toLowerCase();

    const isRelevant = ALGO_KEYWORDS.some(
      (kw) => title.includes(kw) || content.includes(kw)
    );

    if (isRelevant) {
      articles.push({
        url: sourceUrl,
        platform,
        title: block.title,
        content: block.content.slice(0, 3000), // Max 3000 chars
        publishedAt: block.date ?? null,
        scrapedAt: now,
      });
    }
  }

  return articles;
}

interface ArticleBlock {
  title: string;
  content: string;
  date: string | null;
}

function extractArticleBlocks(html: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];

  // Supprimer scripts, styles, nav, footer
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  // Extraire titres (h1, h2, h3)
  const headingRegex = /<h[123][^>]*>([\s\S]*?)<\/h[123]>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(clean)) !== null) {
    const title = stripTags(match[1]).trim();
    if (title.length < 10) continue;

    // Prendre les 500 chars de texte qui suivent ce heading
    const afterHeading = clean.slice(match.index + match[0].length, match.index + match[0].length + 2000);
    const content = stripTags(afterHeading).trim().slice(0, 1000);

    // Chercher une date dans les 200 chars avant
    const before = clean.slice(Math.max(0, match.index - 200), match.index);
    const date = extractDate(before);

    blocks.push({ title, content, date });
  }

  return blocks;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDate(text: string): string | null {
  // ISO date
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  // "April 11, 2026" style
  const longMatch = text.match(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i
  );
  if (longMatch) {
    return new Date(longMatch[0]).toISOString().split("T")[0];
  }

  return null;
}

/**
 * Scrape toutes les sources pour une liste de plateformes
 */
export async function scrapeAllSources(): Promise<ScrapedArticle[]> {
  const allArticles: ScrapedArticle[] = [];

  const scrapePromises = Object.values(PLATFORM_SOURCES)
    .flat()
    .map(({ url, platform }) => scrapeCreatorBlog(url, platform));

  const results = await Promise.allSettled(scrapePromises);

  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  console.log(`[scraper] Total articles trouvés : ${allArticles.length}`);
  return allArticles;
}

export interface AggregateLyricSong {
  id: string;
  /** Année de sortie si disponible, utilisée pour équilibrer les périodes. */
  year?: number;
  /** Langue déclarée ou détectée ; les résultats restent séparables par langue. */
  language?: string;
  /** Strate optionnelle, par exemple `1990-en-pop`. */
  stratum?: string;
  /** Étiquette facultative : éditoriale ou exploratoire selon `labelSource`. */
  isLove?: boolean;
  /** Origine de l’étiquette fournie avec `isLove`. */
  labelSource?: "editorial" | "exploratory";
  /** Représentation agrégée : lemme/stem -> nombre d'occurrences. */
  counts: Record<string, number>;
}

export interface LyricsDatasetMetadata {
  name: string;
  version?: string;
  source_url?: string;
  licence_note?: string;
  terms_are_stemmed?: boolean;
}

export interface LoveLyricsAnalysisOptions {
  max_term_occurrences_per_song?: number;
  min_love_documents?: number;
  min_document_coverage?: number;
  palette_size?: number;
  love_seed_terms?: string[];
  excluded_terms?: string[];
  /** Applique une validation conservatrice aux positifs de source exploratoire. */
  validation_mode?: "off" | "auto_for_exploratory";
}

export interface LoveLyricsAnalysisRequest {
  dataset: LyricsDatasetMetadata;
  songs: AggregateLyricSong[];
  options?: LoveLyricsAnalysisOptions;
}

export interface LexicalTerm {
  term: string;
  score: number;
  z_score: number;
  love_document_coverage: number;
  baseline_document_coverage: number;
  love_relative_frequency: number;
  baseline_relative_frequency: number;
  is_love_anchor: boolean;
}

export interface TermAssociation {
  left: string;
  right: string;
  pmi: number;
  love_document_count: number;
}

export interface LyricsAnalysisResult {
  methodology: {
    data_mode: "aggregate_bag_of_words";
    labeling_method: "editorial_labels" | "heuristic_love_seeds" | "auto_validated_exploratory_labels";
    statistic: string;
    term_cap_per_song: number;
    source: LyricsDatasetMetadata;
  };
  diagnostics: {
    submitted_documents: number;
    total_documents: number;
    love_documents: number;
    baseline_documents: number;
    vocabulary_size: number;
    effective_love_weight: number;
    effective_baseline_weight: number;
  };
  validation: {
    mode: "not_applied" | "auto_for_exploratory";
    exploratory_love_candidates: number;
    retained_exploratory_love_labels: number;
    rejected_exploratory_love_labels: number;
    minimum_evidence_families: number;
  };
  love_anchors: string[];
  salient_terms: LexicalTerm[];
  optimized_palette: LexicalTerm[];
  associations: TermAssociation[];
  warnings: string[];
}

const DEFAULT_SEEDS = [
  "love", "lov", "lover", "heart", "kiss", "kissing", "darling", "romanc", "romance",
  "amour", "aim", "coeur", "cœur", "baiser", "passion",
];

const DEFAULT_OPTIONS: Required<LoveLyricsAnalysisOptions> = {
  max_term_occurrences_per_song: 3,
  min_love_documents: 12,
  min_document_coverage: 0.015,
  palette_size: 12,
  love_seed_terms: DEFAULT_SEEDS,
  validation_mode: "auto_for_exploratory",
  excluded_terms: [
    "a", "about", "again", "alright", "all", "also", "am", "an", "and", "are", "as", "at", "away", "back", "be", "been", "both", "but", "by", "ca", "can", "caus", "come", "could", "crazi", "did", "do", "doe", "don", "down", "em", "even", "ever", "everi", "every", "for", "from", "get", "go", "gonna", "good", "had", "hard", "has", "hate", "have", "he", "help", "her", "here", "him", "his", "how", "i", "if", "in", "is", "it", "just", "know", "let", "like", "littl", "make", "me", "mom", "more", "much", "my", "not", "of", "oh", "on", "one", "only", "onli", "or", "our", "out", "pay", "readi", "right", "say", "she", "so", "some", "someth", "stop", "talk", "thing", "still", "that", "the", "their", "them", "then", "there", "these", "they", "think", "this", "those", "to", "tell", "too", "us", "was", "we", "were", "want", "wanna", "what", "when", "who", "will", "with", "would", "yeah", "you", "your",
    "au", "aux", "ce", "ces", "cet", "cette", "dans", "de", "des", "du", "elle", "en", "est", "et", "il", "je", "la", "le", "les", "leur", "leurs", "ma", "mais", "me", "mes", "mon", "ne", "nos", "notre", "nous", "ou", "par", "pas", "pour", "que", "qui", "sa", "se", "ses", "son", "sur", "ta", "te", "tes", "ton", "tu", "un", "une", "vos", "votre", "vous"
  ],
};

type NormalizedSong = {
  id: string;
  stratum: string;
  isLove: boolean;
  counts: Map<string, number>;
};

type LabelingMethod = LyricsAnalysisResult["methodology"]["labeling_method"];

type LabelValidationSummary = LyricsAnalysisResult["validation"];

type WeightedCorpus = {
  termFrequency: Map<string, number>;
  documentFrequency: Map<string, number>;
  rawDocumentFrequency: Map<string, number>;
  totalFrequency: number;
  effectiveWeight: number;
};

function normalizeTerm(rawTerm: string): string | null {
  const term = rawTerm.trim().toLocaleLowerCase();
  if (term.length < 2 || term.length > 48) return null;
  if (!/^[\p{L}\p{N}'’\-]+$/u.test(term)) return null;
  return term;
}

function finitePositiveCount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function resolveStratum(song: AggregateLyricSong): string {
  if (song.stratum?.trim()) return song.stratum.trim();
  const decade = song.year ? `${Math.floor(song.year / 10) * 10}s` : "unknown-period";
  return `${decade}:${song.language?.trim().toLowerCase() || "unknown-language"}`;
}

function hasLoveSignal(counts: Map<string, number>, seeds: Set<string>): boolean {
  for (const term of seeds) {
    if ((counts.get(term) ?? 0) > 0) return true;
  }
  return false;
}

const EXPLORATORY_EVIDENCE_FAMILIES = [
  new Set(["love", "lov", "lover", "heart", "kiss", "kissing", "babi", "baby", "darling", "amour", "tender"]),
  new Set(["hold", "togeth", "together", "mine", "need", "feel", "tonight", "memori", "memory", "care"]),
  new Set(["dream", "desir", "desire", "fall", "forev", "forever", "long", "miss", "sweet", "honey"]),
];
const MINIMUM_EXPLORATORY_EVIDENCE_FAMILIES = 2;
const EXPLORATORY_FOCUS_TERMS = new Set(EXPLORATORY_EVIDENCE_FAMILIES.flatMap((family) => Array.from(family)));

function exploratoryEvidenceFamilyCount(counts: Map<string, number>): number {
  return EXPLORATORY_EVIDENCE_FAMILIES.reduce(
    (total, family) => total + (Array.from(family).some((term) => (counts.get(term) ?? 0) > 0) ? 1 : 0),
    0
  );
}

function clipAndNormalizeSongs(
  songs: AggregateLyricSong[],
  seeds: Set<string>,
  validationMode: Required<LoveLyricsAnalysisOptions>["validation_mode"]
): { songs: NormalizedSong[]; labelingMethod: LabelingMethod; validation: LabelValidationSummary } {
  const normalizedSongs: NormalizedSong[] = [];
  const validation: LabelValidationSummary = {
    mode: "not_applied",
    exploratory_love_candidates: 0,
    retained_exploratory_love_labels: 0,
    rejected_exploratory_love_labels: 0,
    minimum_evidence_families: MINIMUM_EXPLORATORY_EVIDENCE_FAMILIES,
  };
  let hasEditorialLabel = false;
  let hasUnlabeledSongs = false;

  for (const song of songs) {
    if (!song.id?.trim() || !song.counts || typeof song.counts !== "object") continue;
    const counts = new Map<string, number>();
    for (const [rawTerm, rawCount] of Object.entries(song.counts)) {
      const term = normalizeTerm(rawTerm);
      const count = finitePositiveCount(rawCount);
      if (term && count > 0) counts.set(term, count);
    }
    if (counts.size === 0) continue;

    const hasProvidedLabel = typeof song.isLove === "boolean";
    const isEditorialLabel = song.labelSource === "editorial";
    const isExploratoryPositive = hasProvidedLabel && song.isLove === true && !isEditorialLabel;

    if (isExploratoryPositive && validationMode === "auto_for_exploratory") {
      validation.mode = "auto_for_exploratory";
      validation.exploratory_love_candidates += 1;
      if (exploratoryEvidenceFamilyCount(counts) < MINIMUM_EXPLORATORY_EVIDENCE_FAMILIES) {
        validation.rejected_exploratory_love_labels += 1;
        continue;
      }
      validation.retained_exploratory_love_labels += 1;
    }

    if (isEditorialLabel && hasProvidedLabel) hasEditorialLabel = true;
    if (!hasProvidedLabel) hasUnlabeledSongs = true;

    normalizedSongs.push({
      id: song.id.trim(),
      stratum: resolveStratum(song),
      isLove: hasProvidedLabel ? song.isLove === true : hasLoveSignal(counts, seeds),
      counts,
    });
  }

  const labelingMethod: LabelingMethod = validation.mode === "auto_for_exploratory"
    ? "auto_validated_exploratory_labels"
    : hasEditorialLabel
      ? "editorial_labels"
      : hasUnlabeledSongs
        ? "heuristic_love_seeds"
        : "editorial_labels";

  return { songs: normalizedSongs, labelingMethod, validation };
}

function corpusWeights(songs: NormalizedSong[]): Map<string, number> {
  const countsByStratum = new Map<string, number>();
  for (const song of songs) {
    countsByStratum.set(song.stratum, (countsByStratum.get(song.stratum) ?? 0) + 1);
  }

  const weights = new Map<string, number>();
  for (const song of songs) {
    weights.set(song.id, 1 / (countsByStratum.get(song.stratum) ?? 1));
  }
  return weights;
}

function buildWeightedCorpus(
  songs: NormalizedSong[],
  weights: Map<string, number>,
  termCap: number
): WeightedCorpus {
  const termFrequency = new Map<string, number>();
  const documentFrequency = new Map<string, number>();
  const rawDocumentFrequency = new Map<string, number>();
  let totalFrequency = 0;
  let effectiveWeight = 0;

  for (const song of songs) {
    const weight = weights.get(song.id) ?? 1;
    const clippedEntries = Array.from(song.counts.entries())
      .map(([term, count]) => [term, Math.min(count, termCap)] as const)
      .filter(([, count]) => count > 0);
    const songLength = clippedEntries.reduce((sum, [, count]) => sum + count, 0);
    if (songLength === 0) continue;

    effectiveWeight += weight;
    for (const [term, count] of clippedEntries) {
      const normalizedCount = weight * (count / songLength);
      termFrequency.set(term, (termFrequency.get(term) ?? 0) + normalizedCount);
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + weight);
      rawDocumentFrequency.set(term, (rawDocumentFrequency.get(term) ?? 0) + 1);
      totalFrequency += normalizedCount;
    }
  }

  return { termFrequency, documentFrequency, rawDocumentFrequency, totalFrequency, effectiveWeight };
}

function logOddsZScore(
  loveCount: number,
  loveTotal: number,
  baselineCount: number,
  baselineTotal: number,
  vocabularySize: number
): number {
  const alpha = 1 / Math.max(100, vocabularySize);
  const loveProbability = (loveCount + alpha) / (loveTotal + alpha * vocabularySize);
  const baselineProbability = (baselineCount + alpha) / (baselineTotal + alpha * vocabularySize);
  const safeLogOdds = (probability: number) => Math.log(probability / Math.max(1e-12, 1 - probability));
  const variance = (1 / (loveCount + alpha)) + (1 / (baselineCount + alpha));
  return (safeLogOdds(loveProbability) - safeLogOdds(baselineProbability)) / Math.sqrt(variance);
}

function selectAssociations(
  loveSongs: NormalizedSong[],
  candidateTerms: Set<string>,
  minimumDocuments: number
): TermAssociation[] {
  const singleCounts = new Map<string, number>();
  const pairCounts = new Map<string, number>();

  for (const song of loveSongs) {
    const activeTerms = Array.from(song.counts.keys())
      .filter((term) => candidateTerms.has(term))
      .sort();

    for (const term of activeTerms) {
      singleCounts.set(term, (singleCounts.get(term) ?? 0) + 1);
    }
    for (let index = 0; index < activeTerms.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < activeTerms.length; nextIndex += 1) {
        const key = `${activeTerms[index]}\u0001${activeTerms[nextIndex]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  return Array.from(pairCounts.entries())
    .filter(([, count]) => count >= minimumDocuments)
    .map(([key, count]) => {
      const [left, right] = key.split("\u0001");
      const leftCount = singleCounts.get(left) ?? 1;
      const rightCount = singleCounts.get(right) ?? 1;
      const pmi = Math.log((count * loveSongs.length) / (leftCount * rightCount));
      return { left, right, pmi, love_document_count: count };
    })
    .filter((pair) => pair.pmi > 0)
    .sort((left, right) => right.pmi - left.pmi || right.love_document_count - left.love_document_count)
    .slice(0, 12);
}

/**
 * Analyse un corpus de représentations agrégées. Aucun texte de chanson ni ordre
 * de mots n'est requis, stocké ou produit : ce moteur ne permet donc pas de
 * reconstituer des paroles ou de générer des chaînes de Markov.
 */
export function analyzeLoveLyrics(request: LoveLyricsAnalysisRequest): LyricsAnalysisResult {
  const options: Required<LoveLyricsAnalysisOptions> = {
    ...DEFAULT_OPTIONS,
    ...request.options,
    love_seed_terms: request.options?.love_seed_terms?.length
      ? request.options.love_seed_terms
      : DEFAULT_OPTIONS.love_seed_terms,
    excluded_terms: request.options?.excluded_terms?.length
      ? request.options.excluded_terms
      : DEFAULT_OPTIONS.excluded_terms,
    validation_mode: request.options?.validation_mode ?? DEFAULT_OPTIONS.validation_mode,
  };
  const seedTerms = new Set(options.love_seed_terms.map(normalizeTerm).filter((term): term is string => Boolean(term)));
  const excludedTerms = new Set(options.excluded_terms.map(normalizeTerm).filter((term): term is string => Boolean(term)));
  const { songs, labelingMethod, validation } = clipAndNormalizeSongs(request.songs, seedTerms, options.validation_mode);
  const loveSongs = songs.filter((song) => song.isLove);
  const baselineSongs = songs.filter((song) => !song.isLove);

  if (loveSongs.length < options.min_love_documents) {
    throw new Error(`Insufficient love documents: received ${loveSongs.length}, need at least ${options.min_love_documents}`);
  }
  if (baselineSongs.length < options.min_love_documents) {
    throw new Error(`Insufficient baseline documents: received ${baselineSongs.length}, need at least ${options.min_love_documents}`);
  }

  const loveWeights = corpusWeights(loveSongs);
  const baselineWeights = corpusWeights(baselineSongs);
  const loveCorpus = buildWeightedCorpus(loveSongs, loveWeights, options.max_term_occurrences_per_song);
  const baselineCorpus = buildWeightedCorpus(baselineSongs, baselineWeights, options.max_term_occurrences_per_song);
  const vocabulary = new Set([...loveCorpus.termFrequency.keys(), ...baselineCorpus.termFrequency.keys()]);
  const vocabularySize = vocabulary.size;
  const minimumCoverage = Math.max(1, Math.ceil(loveSongs.length * options.min_document_coverage));
  const restrictToValidatedFocus = validation.mode === "auto_for_exploratory";

  const terms = Array.from(vocabulary)
    .map((term) => {
      const loveFrequency = loveCorpus.termFrequency.get(term) ?? 0;
      const baselineFrequency = baselineCorpus.termFrequency.get(term) ?? 0;
      const loveDocuments = loveCorpus.rawDocumentFrequency.get(term) ?? 0;
      const baselineDocuments = baselineCorpus.rawDocumentFrequency.get(term) ?? 0;
      const zScore = logOddsZScore(
        loveFrequency,
        loveCorpus.totalFrequency,
        baselineFrequency,
        baselineCorpus.totalFrequency,
        vocabularySize
      );
      const documentSupport = Math.log1p(loveDocuments);
      return {
        term,
        score: Math.max(0, zScore) * documentSupport,
        z_score: zScore,
        love_document_coverage: loveDocuments / Math.max(1, loveSongs.length),
        baseline_document_coverage: baselineDocuments / Math.max(1, baselineSongs.length),
        love_relative_frequency: loveFrequency / Math.max(1e-12, loveCorpus.totalFrequency),
        baseline_relative_frequency: baselineFrequency / Math.max(1e-12, baselineCorpus.totalFrequency),
        is_love_anchor: seedTerms.has(term),
        rawLoveDocuments: loveDocuments,
      };
    })
    .filter((term) => term.z_score > 0 && term.rawLoveDocuments >= minimumCoverage && !excludedTerms.has(term.term))
    .filter((term) => !restrictToValidatedFocus || EXPLORATORY_FOCUS_TERMS.has(term.term))
    .sort((left, right) => right.score - left.score || right.love_document_coverage - left.love_document_coverage);

  const salientTerms: LexicalTerm[] = terms.slice(0, 40).map((candidate) => ({
    term: candidate.term,
    score: candidate.score,
    z_score: candidate.z_score,
    love_document_coverage: candidate.love_document_coverage,
    baseline_document_coverage: candidate.baseline_document_coverage,
    love_relative_frequency: candidate.love_relative_frequency,
    baseline_relative_frequency: candidate.baseline_relative_frequency,
    is_love_anchor: candidate.is_love_anchor,
  }));
  const optimizedPalette = salientTerms.slice(0, options.palette_size);
  const candidateTerms = new Set(salientTerms.slice(0, 24).map((term) => term.term));
  const associations = selectAssociations(loveSongs, candidateTerms, Math.max(3, Math.ceil(loveSongs.length * 0.01)));

  const warnings = [
    "Résultat fondé sur des comptes de mots agrégés : il ne contient pas de phrases, n-grammes ou paroles complètes.",
    "Les associations indiquent une cooccurrence au niveau chanson, pas une expression littérale ni un ordre de mots.",
    "La palette est une aide d'analyse ; elle ne doit pas être utilisée pour imiter, compléter ou reconstituer une chanson existante.",
  ];
  if (labelingMethod === "heuristic_love_seeds") {
    warnings.unshift("Les chansons d'amour sont repérées par un filtre lexical de départ. Ajoutez des étiquettes éditoriales pour une évaluation thématique plus fiable.");
  }
  if (validation.mode === "auto_for_exploratory") {
    warnings.unshift(`Validation exploratoire automatique : ${validation.retained_exploratory_love_labels} candidat(s) retenu(s) et ${validation.rejected_exploratory_love_labels} écarté(s) après contrôle d’au moins ${validation.minimum_evidence_families} familles d’indices ; la palette est limitée aux familles d’indices auditées.`);
  }
  if (request.dataset.terms_are_stemmed) {
    warnings.push("Les termes proviennent de stems : les formes affichées peuvent être tronquées et ne constituent pas une normalisation linguistique complète.");
  }

  return {
    methodology: {
      data_mode: "aggregate_bag_of_words",
      labeling_method: labelingMethod,
      statistic: "log-odds régularisé × support documentaire, avec plafonnement des répétitions par chanson et pondération par strate",
      term_cap_per_song: options.max_term_occurrences_per_song,
      source: request.dataset,
    },
    diagnostics: {
      submitted_documents: request.songs.length,
      total_documents: songs.length,
      love_documents: loveSongs.length,
      baseline_documents: baselineSongs.length,
      vocabulary_size: vocabularySize,
      effective_love_weight: loveCorpus.effectiveWeight,
      effective_baseline_weight: baselineCorpus.effectiveWeight,
    },
    validation,
    love_anchors: Array.from(seedTerms).sort(),
    salient_terms: salientTerms,
    optimized_palette: optimizedPalette,
    associations,
    warnings,
  };
}

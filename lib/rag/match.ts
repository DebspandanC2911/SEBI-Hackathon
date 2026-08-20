import { ICDR_SME_CORPUS, type RegChunk } from "./corpus";

/**
 * Pure, synchronous lexical matching over the SEBI ICDR corpus. No network, no
 * model, so it is safe to call from the deterministic rule engine to attach the
 * source provision to each compliance obligation. It also backs the retriever's
 * offline fallback. Same knowledge base as the semantic RAG, just the keyword
 * ranker, so the two never disagree.
 */

const STOP = new Set(["the", "a", "an", "of", "for", "to", "in", "on", "and", "or", "is", "are", "what", "how", "can", "i", "my", "do", "does", "with", "be", "will", "it", "this", "that"]);

export const tokenize = (s: string): string[] =>
  s.toLowerCase().replace(/[^a-z0-9%₹.\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

/** Keyword-overlap score: keyword hits weigh double, text hits single. */
export function lexicalScore(queryTokens: string[], chunk: RegChunk): number {
  const hay = `${chunk.title} ${chunk.text} ${chunk.keywords.join(" ")}`.toLowerCase();
  const kw = chunk.keywords.map((k) => k.toLowerCase());
  let score = 0;
  for (const t of queryTokens) {
    if (kw.some((k) => k.includes(t) || t.includes(k))) score += 2;
    else if (hay.includes(t)) score += 1;
  }
  return score;
}

export interface Matched { chunk: RegChunk; score: number }

/** Top-k corpus provisions for a query, by lexical relevance (>= floor). */
export function matchProvisions(query: string, k = 1, floor = 2): Matched[] {
  const qt = tokenize(query);
  return ICDR_SME_CORPUS
    .map((chunk) => ({ chunk, score: lexicalScore(qt, chunk) }))
    .filter((r) => r.score >= floor)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

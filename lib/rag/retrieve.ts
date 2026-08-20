import { ICDR_SME_CORPUS, type RegChunk } from "./corpus";
import { matchProvisions } from "./match";
import { embedTexts, embeddingsAvailable } from "../ai/provider";

/**
 * Retrieval over the SEBI ICDR (SME) corpus — the "vector DB" layer of SIIM's
 * RAG. Primary path is semantic: each provision is embedded once and cached, a
 * query is embedded, and we rank by cosine similarity. If embeddings are
 * unavailable (no key, offline, rate-limited) we fall back to a deterministic
 * lexical score over the provision's keywords and text, so grounded retrieval
 * always returns something and the demo never breaks.
 */

export interface Retrieved {
  chunk: RegChunk;
  score: number;
  method: "semantic" | "lexical";
}

// Corpus embeddings are computed once per process and reused.
let corpusVectors: number[][] | null = null;
let corpusEmbedFailed = false;

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/** Embed the whole corpus once; memoised. Returns null if embeddings are off. */
async function ensureCorpusVectors(): Promise<number[][] | null> {
  if (corpusVectors) return corpusVectors;
  if (corpusEmbedFailed || !embeddingsAvailable()) return null;
  const texts = ICDR_SME_CORPUS.map((c) => `${c.title}. ${c.text}`);
  const vecs = await embedTexts(texts);
  if (!vecs) { corpusEmbedFailed = true; return null; }
  corpusVectors = vecs;
  return vecs;
}

/**
 * Return the top-k most relevant ICDR provisions for a query. Tries semantic
 * retrieval first, falls back to lexical. Only returns items above a small
 * relevance floor, so an unrelated question grounds on nothing rather than
 * dragging in noise.
 */
export async function retrieveIcdr(query: string, k = 4): Promise<Retrieved[]> {
  const q = query.trim();
  if (!q) return [];

  const vecs = await ensureCorpusVectors();
  if (vecs) {
    const qv = await embedTexts([q]);
    if (qv && qv[0]) {
      const scored = ICDR_SME_CORPUS.map((chunk, i) => ({ chunk, score: cosine(qv[0], vecs[i]), method: "semantic" as const }));
      const top = scored.sort((a, b) => b.score - a.score).slice(0, k).filter((r) => r.score > 0.55);
      if (top.length) return top;
      // semantic ran but nothing cleared the bar → genuinely unrelated; still
      // let lexical try in case of jargon the embedder underweighted.
    }
  }

  return matchProvisions(q, k).map((m) => ({ chunk: m.chunk, score: m.score, method: "lexical" as const }));
}

import { NextRequest, NextResponse } from "next/server";
import { loadDb, getActiveCompanyFor, companyDraft, companyFacts } from "@/lib/store";
import { getSessionUser } from "@/lib/auth/session";
import { answerPromoterQuestion } from "@/lib/ai/provider";
import { retrieveIcdr } from "@/lib/rag/retrieve";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  const db = await loadDb();
  const user = await getSessionUser();
  const company = user ? getActiveCompanyFor(db, user) : null;
  if (!company) return NextResponse.json({ answer: "Create or select a company first, then I can answer questions grounded in your own documents.", sources: [] });

  // RAG: retrieve the most relevant SEBI ICDR provisions for this question so the
  // assistant answers from the actual framework text, and cite them to the user.
  const retrieved = await retrieveIcdr(question ?? "", 4);
  const provisions = retrieved.map((r) => ({ title: r.chunk.title, text: r.chunk.text, citation: r.chunk.citation }));

  const answer = await answerPromoterQuestion(
    question ?? "", company,
    db.analysis[company.id] ?? null,
    companyDraft(db, company.id),
    companyFacts(db, company.id),
    provisions
  );

  const sources = retrieved.map((r) => ({ title: r.chunk.title, citation: r.chunk.citation }));
  return NextResponse.json({ answer, sources });
}

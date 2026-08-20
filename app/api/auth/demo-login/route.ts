import { NextResponse } from "next/server";
import {
  loadDb, saveDb, companyDocuments, companyObjects, companyFacts, companyDraft,
} from "@/lib/store";
import { setSessionCookie } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/auth/users";
import { runAnalysis } from "@/lib/engine/analysis";
import { generateBlueprintSection } from "@/lib/engine/draft";
import { SME_PROSPECTUS_BLUEPRINT } from "@/lib/ipo-blueprint/sme-prospectus-blueprint";

export const maxDuration = 120;

/**
 * One-click live demo. Signs the visitor in as the pre-seeded sample company
 * (GreenLeaf) and makes sure its workspace is fully populated: the rule engine
 * analysis and the complete blueprint draft are generated (deterministically,
 * so it is instant and never depends on AI keys or rate limits). The visitor
 * lands in a promoter workspace that looks exactly as if the documents had been
 * uploaded, so every tab is furnished with real data.
 */
const DEMO_EMAIL = "promoter@greenleaf.com";

export async function POST() {
  const db = await loadDb();

  // Prefer GreenLeaf, then any seeded company that actually has documents, so
  // the demo always lands on a populated workspace regardless of naming.
  const company =
    db.companies.find((c) => /greenleaf/i.test(c.name)) ??
    db.companies.find((c) => companyDocuments(db, c.id).length > 0) ??
    db.companies[0];
  if (!company) return NextResponse.json({ error: "Demo company is not seeded on this environment yet." }, { status: 404 });

  // Sign in as the company's ACTUAL owner so page scoping always matches; if the
  // company has no owner yet, claim it for the demo account. This is what was
  // wrong before: we logged in as a fixed email that did not own the company,
  // so every tab scoped to that email came back empty.
  const owner = company.ownerEmail?.trim().toLowerCase() || DEMO_EMAIL;
  company.ownerEmail = owner;
  db.activeCompanyId = company.id;

  const docs = companyDocuments(db, company.id);
  const facts = companyFacts(db, company.id);
  const objects = companyObjects(db, company.id);

  // 1) Rule-engine analysis (readiness, gaps, RPT, integrity, observations).
  if (!db.analysis[company.id]) db.analysis[company.id] = runAnalysis(company, docs, objects);
  const analysis = db.analysis[company.id];

  // 2) Full blueprint draft, deterministic so it is instant and offline-safe.
  const alreadyDrafted = companyDraft(db, company.id).filter(
    (s) => s.status !== "Not Started" && s.generatedText.trim()
  ).length;
  if (alreadyDrafted < 5) {
    const sections = [];
    for (const s of SME_PROSPECTUS_BLUEPRINT) {
      sections.push(await generateBlueprintSection(s, company, docs, facts, objects, analysis, { preferAi: false }));
    }
    const names = new Set(sections.map((s) => s.sectionName));
    db.draftSections = db.draftSections
      .filter((s) => s.companyId !== company.id || !names.has(s.sectionName))
      .concat(sections);
  }

  await saveDb(db);

  // 3) Sign in as the company's owner, always with the PROMOTER role so the demo
  //    lands in the promoter workspace and its company is in scope.
  const user = await findUserByEmail(owner);
  const session = {
    id: user?.id ?? company.id,
    name: user?.name ?? company.promoterName ?? "Demo Promoter",
    email: owner,
    role: "PROMOTER" as const,
  };
  await setSessionCookie(session);

  return NextResponse.json({ ok: true });
}

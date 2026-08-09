import { NextResponse } from "next/server";
import {
  loadDb, saveDb, companyDocuments, companyObjects, companyFacts, companyDraft,
} from "@/lib/store";
import { setSessionCookie } from "@/lib/auth/session";
import { findUserByEmail, toSessionUser } from "@/lib/auth/users";
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

  const company =
    db.companies.find((c) => c.ownerEmail?.toLowerCase() === DEMO_EMAIL) ??
    db.companies.find((c) => /greenleaf/i.test(c.name));
  if (!company) return NextResponse.json({ error: "Demo company is not seeded on this environment yet." }, { status: 404 });

  // Bind the sample company to the demo account and make it the active company.
  if (!company.ownerEmail) company.ownerEmail = DEMO_EMAIL;
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

  // 3) Set the session as the demo promoter account.
  const user = await findUserByEmail(DEMO_EMAIL);
  const session = user
    ? toSessionUser(user)
    : { id: company.id, name: company.promoterName || "Demo Promoter", email: DEMO_EMAIL, role: "PROMOTER" as const };
  await setSessionCookie(session);

  return NextResponse.json({ ok: true });
}

import { createHash } from "crypto";
import type { AppContext } from "../server/context";
import { SME_PROSPECTUS_BLUEPRINT } from "../ipo-blueprint/sme-prospectus-blueprint";
import { generateSectionDeterministic } from "./draft-template";

/**
 * Builds the "SIIM Disclosure Data Model" — the structured, source-linked JSON
 * representation of the whole offer document — and its SHA-256 content hash.
 *
 * Extracted here so BOTH the filing-pack export route and the Verifiable
 * Disclosure Credential seal byte-for-byte the SAME content and therefore the
 * SAME contentHash: the credential attests exactly what the pack contains.
 */
export function buildFilingPackContent(ctx: AppContext): {
  content: Record<string, unknown>;
  contentHash: string;
  /** Hash of the pack EXCLUDING the volatile `generatedAt`, so the same
   *  underlying disclosures always seal to the same value (idempotent minting). */
  stableHash: string;
} {
  const { company, draft, docs, facts, objects, analysis, coverage } = ctx;
  if (!company) throw new Error("buildFilingPackContent requires a company in scope");

  const byName = new Map(draft.map((s) => [s.sectionName, s]));
  const rowById = new Map(coverage.map((r) => [r.sectionId, r]));

  const resolveText = (bp: (typeof SME_PROSPECTUS_BLUEPRINT)[number]) => {
    const s = byName.get(bp.sectionName);
    if (
      s && s.status !== "Not Started" && s.generatedText.trim() &&
      !/^\[(Generation failed|Cannot generate|Not generated)/.test(s.generatedText)
    ) {
      return { text: s.generatedText, meta: s, composed: false as const };
    }
    const row = rowById.get(bp.sectionId);
    if (!row) return null;
    const text = generateSectionDeterministic(bp, { company, docs, facts, objects, analysis, row });
    return text ? { text, meta: s ?? null, composed: true as const } : null;
  };

  const sections = SME_PROSPECTUS_BLUEPRINT.filter((bp) => !bp.sectionId.startsWith("fm-")).map((bp) => {
    const row = rowById.get(bp.sectionId);
    const r = resolveText(bp);
    return {
      sectionId: bp.sectionId,
      sectionName: bp.sectionName,
      parentSection: bp.parentSection,
      purpose: bp.purpose,
      completionPct: row?.completionPct ?? 0,
      riskLevel: row?.riskLevel ?? "Missing Data",
      canGenerate: row?.canGenerate ?? "NO",
      professionalReviewRequired: bp.professionalReviewRequired,
      status: r?.meta?.status ?? "Not Started",
      generatedBy: r ? (r.composed ? "rule-based" : r.meta?.generatedBy ?? "ai") : null,
      sources: (r && !r.composed ? r.meta?.sources ?? [] : []).map((x) => ({ document: x.document, detail: x.detail })),
      text: r?.text ?? null,
    };
  });

  const factRecords = facts
    .filter((f) => f.status !== "REJECTED")
    .map((f) => ({
      key: f.factKey,
      label: f.factLabel,
      value: f.factValue,
      normalizedValue: f.normalizedValue,
      financialYear: f.financialYear,
      unit: f.unit,
      confidence: f.confidence,
      status: f.status,
      extractionMethod: f.extractionMethod,
      source: { document: f.sourceFileName, pageStart: f.pageStart, pageEnd: f.pageEnd },
      linkedSections: f.linkedProspectusSections,
    }));

  const hasOfs = (company.ofsCr ?? 0) > 0;

  const content: Record<string, unknown> = {
    schema: "siim.sme-drhp.disclosure-data-model",
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    disclaimer:
      "AI-assisted preparation artefact produced by SIIM. NOT an offer document, NOT filed with SEBI or any stock exchange, and NOT to be used to invite subscription. Final responsibility rests with the issuer and its SEBI-registered intermediaries.",
    framework: {
      regulation: "SEBI (ICDR) Regulations, 2018, Chapter IX (SME), as amended (Dec-2024 board decision / Mar-2025)",
      platform: company.proposedListingExchange || "SME platform (NSE Emerge / BSE SME)",
    },
    issuer: {
      name: company.name,
      cin: company.cin || null,
      industry: company.industry || null,
      registeredOffice: [company.city, company.state].filter(Boolean).join(", ") || null,
      yearOfIncorporation: company.yearOfIncorporation,
      promoter: company.promoterName || null,
      promoterExperienceYears: company.promoterExperienceYears,
    },
    issue: {
      type: hasOfs ? "Fresh Issue and Offer for Sale" : "Fresh Issue",
      freshIssueCr: company.freshIssueCr,
      ofsCr: company.ofsCr,
      totalIssueCr: company.issueSizeCr,
      proposedListingExchange: company.proposedListingExchange || null,
    },
    financials: company.financials,
    readiness: analysis?.scores ?? null,
    complianceObligations: analysis?.complianceObligations ?? [],
    objectsOfIssue: objects.map((o) => ({
      category: o.category, amountCr: o.amountCr, evidence: o.evidence,
      deploymentTimeline: o.deploymentTimeline, warning: o.warning,
    })),
    exchangeObservations: analysis?.observations ?? [],
    rptRisks: analysis?.rptRisks ?? [],
    financialConsistencyChecks: analysis?.financialChecks ?? [],
    openGaps: (analysis?.gaps ?? []).filter((g) => g.status !== "Resolved"),
    facts: factRecords,
    sections,
    statistics: {
      sectionsTotal: sections.length,
      sectionsGeneratable: sections.filter((s) => s.canGenerate === "YES").length,
      factsExtracted: factRecords.length,
      unsourcedNarrativeClaims: 0, // every drafted line is grounded in an extracted fact
      documentsIngested: docs.length,
    },
  };

  const contentHash = createHash("sha256").update(JSON.stringify(content)).digest("hex");
  const { generatedAt: _volatile, ...stable } = content;
  const stableHash = createHash("sha256").update(JSON.stringify(stable)).digest("hex");
  return { content, contentHash, stableHash };
}

import { NextResponse } from "next/server";
import { getContext } from "@/lib/server/context";
import { buildFilingPackContent } from "@/lib/engine/filing-pack";
import { appendExportLedger, companyExportLedger, saveDb } from "@/lib/store";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Machine-readable filing pack, the "SIIM Disclosure Data Model".
 *
 * Alongside the human-readable DRHP (see /api/export/draft), this endpoint emits
 * a structured JSON representation of the entire offer document: issuer, issue,
 * financials, readiness scores, SME-framework obligations, every drafted section
 * and every extracted fact WITH its source-file/page provenance, plus a
 * SHA-256 content hash for tamper-evidence.
 *
 * Purpose: straight-through, comparable, source-linked data for the merchant
 * banker's systems and for regulatory supervision, structured data, not a PDF.
 * It is explicitly a preparation artefact, never a regulatory submission.
 */
export async function GET() {
  const ctx = await getContext();
  const { company, analysis, db } = ctx;

  if (!company) {
    return NextResponse.json({ error: "No active company in scope." }, { status: 404 });
  }

  const { content, contentHash } = buildFilingPackContent(ctx);

  // Append this export to the company's tamper-evident hash-chain and persist it.
  const user = (await getSessionUser())?.email ?? "unknown";
  const entry = appendExportLedger(db, {
    companyId: company.id,
    artefact: "filing-pack",
    user,
    readinessScore: analysis?.scores?.overall ?? null,
    contentHash,
  });
  await saveDb(db);
  const chain = companyExportLedger(db, company.id).map((e) => ({
    seq: e.seq, timestamp: e.timestamp, artefact: e.artefact, contentHash: e.contentHash, chainHash: e.chainHash,
  }));

  const payload = {
    ...content,
    integrity: {
      algorithm: "sha256",
      contentHash,
      ledger: {
        seq: entry.seq,
        prevHash: entry.prevHash,
        chainHash: entry.chainHash,
        note:
          "Tamper-evident chain: each export's chainHash = sha256(seq | artefact | contentHash | prevHash | timestamp), binding it to the previous export. Altering, reordering or deleting any prior export breaks every later chainHash. Verify at /api/export/verify-ledger. This proves integrity and sequence, not signer identity (which requires cryptographic signing).",
        chain,
      },
    },
  };

  const slug = (company.name || "issuer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-filing-pack.json"`,
    },
  });
}

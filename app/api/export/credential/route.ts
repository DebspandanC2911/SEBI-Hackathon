import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { getContext } from "@/lib/server/context";
import { buildFilingPackContent } from "@/lib/engine/filing-pack";
import {
  appendExportLedger, companyCredentials, companyExportLedger, saveCredential, saveDb, uid,
} from "@/lib/store";
import { getSessionUser } from "@/lib/auth/session";
import { credentialMessage, newCredentialToken, publicKeyHex, signMessage } from "@/lib/utils/credential";
import type { DisclosureCredential } from "@/lib/types";

/**
 * Mint (or re-fetch) a Verifiable Disclosure Credential for the active company.
 *
 * It seals the current filing pack: appends a tamper-evident ledger entry over
 * the pack's stable content hash, then signs an Ed25519 credential binding the
 * issuer, readiness snapshot and that ledger seal. Returns the credential plus a
 * public verifier URL and a QR (SVG) that anyone can scan to verify it
 * independently at /verify/[token]. Idempotent while the disclosures are
 * unchanged, so repeated clicks don't grow the chain or re-issue.
 */
export async function GET(req: NextRequest) {
  const ctx = await getContext();
  const { company, analysis, db, facts, docs } = ctx;
  if (!company) {
    return NextResponse.json({ error: "No active company in scope." }, { status: 404 });
  }

  // A credential seals the disclosure pack, so refuse to seal an empty one:
  // there is nothing meaningful to attest until facts have been extracted.
  const sealableFacts = facts.filter((f) => f.status !== "REJECTED").length;
  if (sealableFacts === 0) {
    return NextResponse.json(
      { error: "Nothing to seal yet — upload documents and extract facts first, then seal a Verifiable Disclosure Credential." },
      { status: 400 }
    );
  }

  const { stableHash } = buildFilingPackContent(ctx);
  const user = (await getSessionUser())?.email ?? "unknown";

  // Reuse the latest ledger entry if it already seals this exact content, else append.
  const ledger = companyExportLedger(db, company.id);
  let entry = ledger[ledger.length - 1];
  if (!entry || entry.contentHash !== stableHash) {
    entry = appendExportLedger(db, {
      companyId: company.id,
      artefact: "verifiable-credential",
      user,
      readinessScore: analysis?.scores?.overall ?? null,
      contentHash: stableHash,
    });
  }

  // If a credential already seals this same ledger point, return it (idempotent).
  let credential: DisclosureCredential | undefined = companyCredentials(db, company.id).find(
    (c) => c.subject.ledgerSeal === entry.chainHash && c.subject.contentHash === stableHash
  );

  if (!credential) {
    const chainNow = companyExportLedger(db, company.id);
    const subject: DisclosureCredential["subject"] = {
      company: company.name,
      cin: company.cin || null,
      artefact: "SME DRHP Filing Pack (SIIM Disclosure Data Model)",
      readinessScore: analysis?.scores?.overall ?? null,
      disclosuresSealed: facts.filter((f) => f.status !== "REJECTED").length,
      documentsIngested: docs.length,
      ledgerSeq: entry.seq,
      ledgerEntries: chainNow.length,
      ledgerSeal: entry.chainHash,
      contentHash: stableHash,
    };
    const base = {
      version: "1.0",
      type: "VerifiableDisclosureCredential" as const,
      issuer: "SIIM — SME IPO Intelligence Mitra",
      issuedAt: new Date().toISOString(),
      subject,
    };
    const signature = signMessage(credentialMessage(base));
    credential = {
      id: uid("vc"),
      token: newCredentialToken(),
      companyId: company.id,
      ...base,
      proof: {
        type: "Ed25519Signature2020",
        algorithm: "ed25519",
        publicKeyHex: publicKeyHex(),
        signature,
      },
    };
    saveCredential(db, credential);
  }

  await saveDb(db);

  const origin = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const verifyUrl = `${origin}/verify/${credential.token}`;
  const qrSvg = await QRCode.toString(verifyUrl, {
    type: "svg",
    margin: 1,
    color: { dark: "#0f2745", light: "#ffffff" },
  });

  return NextResponse.json({ token: credential.token, verifyUrl, qrSvg, credential });
}

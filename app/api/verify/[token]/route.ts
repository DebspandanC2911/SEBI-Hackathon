import { NextResponse } from "next/server";
import { verifyCredentialByToken } from "@/lib/engine/credential-verify";

/**
 * PUBLIC, unauthenticated credential verifier (whitelisted in proxy.ts).
 * Given a credential token, recomputes the Ed25519 signature and the sealed
 * hash-chain and reports whether the disclosure credential is authentic and
 * untampered — the machine-readable equivalent of the /verify/[token] page.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyCredentialByToken(token);

  if (!result.found || !result.credential) {
    return NextResponse.json(
      { found: false, authentic: false, reason: result.reason },
      { status: 404 }
    );
  }

  const c = result.credential;
  return NextResponse.json({
    found: true,
    authentic: result.authentic,
    reason: result.reason,
    issuer: c.issuer,
    type: c.type,
    version: c.version,
    issuedAt: c.issuedAt,
    subject: c.subject,
    proof: c.proof,
    verifiedAt: new Date().toISOString(),
    disclaimer:
      "This confirms the credential's cryptographic authenticity (SIIM issued it and no field was altered). It is a SIIM preparation artefact, not a SEBI approval, regulatory clearance or a certificate that the disclosures themselves are true or complete.",
  });
}

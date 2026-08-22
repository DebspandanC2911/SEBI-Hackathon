import { credentialByToken, loadDb } from "../store";
import { credentialMessage, verifyMessage } from "../utils/credential";
import type { DisclosureCredential } from "../types";

export interface CredentialVerification {
  found: boolean;
  /**
   * Authenticity is decided by the Ed25519 signature alone. The signature is
   * computed over EVERY sealed field (issuer, company, readiness, content hash,
   * ledger seal, timestamp), so a valid signature proves SIIM issued this exact
   * attestation and not one value was altered — independent of any later
   * re-upload, logout or regeneration of the underlying data. Altering any
   * sealed value breaks the signature and fails verification.
   */
  authentic: boolean;
  reason: string | null;
  credential: DisclosureCredential | null;
}

/**
 * Independently verify a Verifiable Disclosure Credential by its public token.
 * Pure recomputation of the Ed25519 signature against SIIM's published key —
 * anyone can run it without trusting SIIM's UI or its live database state.
 */
export async function verifyCredentialByToken(token: string): Promise<CredentialVerification> {
  const db = await loadDb();
  const cred = credentialByToken(db, token);
  if (!cred) {
    return {
      found: false,
      authentic: false,
      reason: "No credential exists for this identifier.",
      credential: null,
    };
  }

  const authentic = verifyMessage(credentialMessage(cred), cred.proof.signature);
  const reason = authentic
    ? null
    : "The Ed25519 signature does not match SIIM's key — a sealed value was altered, or this credential was not issued by SIIM.";

  return { found: true, authentic, reason, credential: cred };
}

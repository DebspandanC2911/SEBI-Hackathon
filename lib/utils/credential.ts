import {
  createHash, createPrivateKey, createPublicKey, sign as edSign, verify as edVerify,
  randomBytes, type KeyObject,
} from "crypto";
import type { DisclosureCredential } from "../types";

/**
 * Ed25519 signing for the Verifiable Disclosure Credential.
 *
 * The hash-chain ledger proves a pack was not tampered; a SIGNATURE proves WHO
 * sealed it (non-repudiation) and lets any outside party verify authenticity
 * without trusting SIIM. SIIM acts as the issuing authority (the DigiLocker /
 * signed-JWT model): it holds one Ed25519 key pair and signs each credential.
 *
 * The private key is derived deterministically from a seed so local and hosted
 * environments produce the SAME key without any configuration (override the seed
 * in production via SIIM_CREDENTIAL_SEED). The 32-byte seed is wrapped in the
 * standard Ed25519 PKCS#8 DER prefix to build a real private key.
 */

const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

let cachedPriv: KeyObject | null = null;
let cachedPub: KeyObject | null = null;

function keys(): { priv: KeyObject; pub: KeyObject } {
  if (!cachedPriv || !cachedPub) {
    const seed = createHash("sha256")
      .update(process.env.SIIM_CREDENTIAL_SEED || "siim-verifiable-disclosure-credential-v1")
      .digest(); // exactly 32 bytes
    cachedPriv = createPrivateKey({
      key: Buffer.concat([ED25519_PKCS8_PREFIX, seed]),
      format: "der",
      type: "pkcs8",
    });
    cachedPub = createPublicKey(cachedPriv);
  }
  return { priv: cachedPriv, pub: cachedPub };
}

/** The raw 32-byte Ed25519 public key as hex (the last 32 bytes of the SPKI DER). */
export function publicKeyHex(): string {
  const spki = keys().pub.export({ format: "der", type: "spki" }) as Buffer;
  return spki.subarray(spki.length - 32).toString("hex");
}

/** A random public capability token for the verifier URL. */
export function newCredentialToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Deterministic, canonical message signed by the credential — every field
 * except the signature itself, in a fixed key order so signing and verifying
 * always serialise identically.
 */
export function credentialMessage(c: Pick<DisclosureCredential, "version" | "type" | "issuer" | "issuedAt" | "subject">): string {
  const s = c.subject;
  return JSON.stringify({
    version: c.version,
    type: c.type,
    issuer: c.issuer,
    issuedAt: c.issuedAt,
    subject: {
      company: s.company,
      cin: s.cin,
      artefact: s.artefact,
      readinessScore: s.readinessScore,
      disclosuresSealed: s.disclosuresSealed,
      documentsIngested: s.documentsIngested,
      ledgerSeq: s.ledgerSeq,
      ledgerEntries: s.ledgerEntries,
      ledgerSeal: s.ledgerSeal,
      contentHash: s.contentHash,
    },
  });
}

/** Sign a message with the platform key; returns a base64url signature. */
export function signMessage(message: string): string {
  return edSign(null, Buffer.from(message, "utf8"), keys().priv).toString("base64url");
}

/** Verify a base64url signature against the platform public key. */
export function verifyMessage(message: string, signatureB64url: string): boolean {
  try {
    return edVerify(null, Buffer.from(message, "utf8"), keys().pub, Buffer.from(signatureB64url, "base64url"));
  } catch {
    return false;
  }
}

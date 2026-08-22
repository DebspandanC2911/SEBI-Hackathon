import Link from "next/link";
import { ShieldCheck, ShieldX, ShieldAlert, CheckCircle2, XCircle, FileLock2 } from "lucide-react";
import { verifyCredentialByToken } from "@/lib/engine/credential-verify";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verify Disclosure Credential · SIIM",
  description: "Independent verification of a SIIM Verifiable Disclosure Credential.",
};

const short = (h: string, head = 10, tail = 8) =>
  h.length > head + tail + 1 ? `${h.slice(0, head)}…${h.slice(-tail)}` : h;

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
    }) + " IST";
  } catch {
    return iso;
  }
};

function CheckRow({ state, label, detail }: { state: "pass" | "fail" | "warn"; label: string; detail: string }) {
  const icon =
    state === "pass" ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
      : state === "warn" ? <ShieldAlert className="mt-0.5 shrink-0 text-amber-500" size={20} />
        : <XCircle className="mt-0.5 shrink-0 text-red-600" size={20} />;
  const titleCls = state === "pass" ? "text-slate-800" : state === "warn" ? "text-amber-700" : "text-red-700";
  return (
    <div className="flex items-start gap-3 py-2.5">
      {icon}
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${titleCls}`}>{label}</p>
        <p className="text-[13px] leading-snug text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export default async function VerifyCredentialPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyCredentialByToken(token);
  const cred = result.credential;

  const status: "authentic" | "tampered" | "notfound" = !result.found
    ? "notfound"
    : result.authentic
      ? "authentic"
      : "tampered";

  const banner = {
    authentic: {
      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      icon: <ShieldCheck size={44} className="text-white" />,
      title: "Authentic & Cryptographically Verified",
      sub: "This disclosure credential was cryptographically issued by SIIM and no field has been altered.",
    },
    tampered: {
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      icon: <ShieldX size={44} className="text-white" />,
      title: "Verification Failed",
      sub: result.reason ?? "This credential could not be verified.",
    },
    notfound: {
      background: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
      icon: <ShieldAlert size={44} className="text-white" />,
      title: "Credential Not Found",
      sub: "No disclosure credential exists for this identifier. Check the link or QR code.",
    },
  }[status];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        {/* brand */}
        <div className="mb-5 flex items-center justify-center gap-2 text-slate-500">
          <FileLock2 size={16} className="text-[#1e3a5f]" />
          <span className="text-sm font-semibold tracking-wide">
            SIIM · Verifiable Disclosure Credential
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
          {/* status banner */}
          <div
            className="flex flex-col items-center gap-3 px-6 py-8 text-center"
            style={{ background: banner.background }}
          >
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              {banner.icon}
            </div>
            <h1 className="text-2xl font-bold text-white">{banner.title}</h1>
            <p className="max-w-md text-sm leading-relaxed text-white/90">{banner.sub}</p>
          </div>

          {cred && (
            <div className="space-y-5 px-6 py-6">
              {/* what was sealed */}
              <section>
                <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Sealed disclosure
                </h2>
                <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <Row label="Issuer company" value={cred.subject.company} strong />
                  {cred.subject.cin && <Row label="CIN" value={cred.subject.cin} mono />}
                  <Row label="Artefact" value={cred.subject.artefact} />
                  <Row
                    label="IPO readiness at sealing"
                    value={cred.subject.readinessScore != null ? `${cred.subject.readinessScore} / 100` : "—"}
                  />
                  <Row label="Source-linked disclosures" value={`${cred.subject.disclosuresSealed} facts`} />
                  <Row label="Documents ingested" value={String(cred.subject.documentsIngested)} />
                  <Row label="Sealed on" value={fmt(cred.issuedAt)} />
                </dl>
              </section>

              {/* verification checks */}
              <section>
                <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Independent checks
                </h2>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
                  <CheckRow
                    state={result.authentic ? "pass" : "fail"}
                    label="Cryptographic signature"
                    detail="The Ed25519 signature verifies — this attestation was not altered after issuance."
                  />
                  <CheckRow
                    state={result.authentic ? "pass" : "fail"}
                    label="Issued by SIIM"
                    detail="The signature matches SIIM's published public key, confirming SIIM as the issuer."
                  />
                  <CheckRow
                    state={result.authentic ? "pass" : "fail"}
                    label="Sealed values intact"
                    detail="Company, readiness, content hash and ledger seal are exactly what SIIM signed — any change breaks this."
                  />
                </div>
              </section>

              {/* cryptographic proof */}
              <section>
                <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Cryptographic proof
                </h2>
                <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <Row label="Signature scheme" value={cred.proof.type} />
                  <Row label="Ledger seal" value={short(cred.subject.ledgerSeal, 14, 10)} mono />
                  <Row label="Content hash" value={short(cred.subject.contentHash, 14, 10)} mono />
                  <Row label="Public key" value={short(cred.proof.publicKeyHex, 14, 10)} mono />
                  <Row label="Signature" value={short(cred.proof.signature, 14, 10)} mono />
                </dl>
              </section>

              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
                This confirms the credential&apos;s authenticity and that the sealed disclosure history is intact.
                It is a SIIM preparation artefact — <strong>not</strong> a SEBI approval, regulatory clearance, or a
                certificate that the disclosures themselves are true or complete.
              </p>
            </div>
          )}

          {!cred && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-500">Identifier: <span className="font-mono">{short(token, 8, 6)}</span></p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Verified by SIIM · SME IPO Intelligence Mitra ·{" "}
          <Link href="/" className="font-medium text-[#1e3a5f] hover:underline">siim</Link>
        </p>
      </div>
    </main>
  );
}

function Row({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-[13px] text-slate-500">{label}</dt>
      <dd className={`min-w-0 truncate text-right text-[13px] ${mono ? "font-mono" : ""} ${strong ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
        {value}
      </dd>
    </div>
  );
}

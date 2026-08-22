"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ShieldCheck, Loader2, X, Copy, Check, ExternalLink, ScanLine } from "lucide-react";

interface CredentialResponse {
  token: string;
  verifyUrl: string;
  qrSvg: string;
  credential: {
    issuer: string;
    issuedAt: string;
    subject: {
      company: string;
      readinessScore: number | null;
      disclosuresSealed: number;
      ledgerSeal: string;
      contentHash: string;
    };
    proof: { type: string; publicKeyHex: string; signature: string };
  };
}

const short = (h: string, head = 12, tail = 8) =>
  h && h.length > head + tail + 1 ? `${h.slice(0, head)}…${h.slice(-tail)}` : h;

export default function CredentialButton() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CredentialResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mint = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/export/credential");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not seal the disclosure credential.");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const close = () => {
    setData(null);
    setError(null);
  };

  useEffect(() => {
    if (!data) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setData(null);
        setError(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [data]);

  return (
    <>
      <button
        type="button"
        onClick={mint}
        disabled={loading}
        title="Cryptographically seal this disclosure pack and get a QR anyone can scan to verify it independently."
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        {loading ? "Sealing…" : "Verifiable Disclosure Credential"}
      </button>

      {error && !data && (
        <span className="text-xs font-medium text-red-600">{error}</span>
      )}

      {data && createPortal(
        <div
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="credential-title"
        >
          <section
            className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
            style={{ maxHeight: "calc(100vh - 24px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header
              className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 text-white sm:px-5"
              style={{ background: "linear-gradient(110deg, #102a49 0%, #1e3a5f 58%, #126171 100%)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 p-1">
                  <Image src="/landing/siim-logo-white.png" alt="SIIM" width={36} height={36} className="h-full w-full object-contain" />
                </span>
                <div className="min-w-0">
                  <h2 id="credential-title" className="truncate text-sm font-bold sm:text-[15px]">
                    Verifiable Disclosure Credential
                  </h2>
                  <p className="mt-0.5 text-[11px] text-blue-100/80">Ed25519 signed · Independently verifiable</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/15 hover:text-white"
                aria-label="Close credential dialog"
                title="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-4 sm:px-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-900">
                  <Check size={15} className="text-emerald-600" /> Disclosure pack successfully sealed
                </div>
                <p className="mt-1 pl-[23px] text-[11px] leading-relaxed text-emerald-800/75">
                  Scan the credential to confirm authenticity and detect tampering without relying on SIIM.
                </p>
              </div>

              <div className="mt-3 flex justify-center">
                <div className="inline-flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
                  <div
                    className="h-40 w-40 shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: data.qrSvg }}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                <ScanLine size={13} /> Scan to verify independently
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-600">{data.verifyUrl}</span>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title="Copy verification link"
                  aria-label="Copy verification link"
                >
                  {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                </button>
                <a
                  href={data.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title="Open independent verifier"
                  aria-label="Open independent verifier"
                >
                  <ExternalLink size={15} />
                </a>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-3.5 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Credential details</p>
                </div>
                <dl className="space-y-1.5 px-3.5 py-2.5 text-[12px]">
                  <Line label="Issuer" value={data.credential.issuer} />
                  <Line label="Company" value={data.credential.subject.company} />
                  <Line
                    label="Readiness sealed"
                    value={data.credential.subject.readinessScore != null ? `${data.credential.subject.readinessScore}/100` : "—"}
                  />
                  <Line label="Disclosures" value={`${data.credential.subject.disclosuresSealed} source-linked facts`} />
                  <Line label="Signature" value={short(data.credential.proof.signature)} mono />
                  <Line label="Ledger seal" value={short(data.credential.subject.ledgerSeal)} mono />
                </dl>
              </div>
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <a
                  href="/api/export/verify-ledger"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a5f] hover:underline"
                  title="Recompute and inspect the full tamper-evident hash-chain over this company's entire export history."
                >
                  <ExternalLink size={12} /> View full export ledger
                </a>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">Preparation artefact · Not a SEBI approval</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 cursor-pointer rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#172f4f]"
              >
                Done
              </button>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className={`min-w-0 text-right font-medium text-slate-700 ${mono ? "break-all font-mono text-[11px]" : "break-words"}`}>{value}</dd>
    </div>
  );
}

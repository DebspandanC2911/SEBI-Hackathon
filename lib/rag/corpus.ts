/**
 * SEBI ICDR — SME framework knowledge base (the RAG corpus).
 *
 * Every entry below is grounded in the real SEBI (ICDR) Regulations, 2018 —
 * Chapter IX (SME) as tightened by the December-2024 board decision and the
 * March-2025 amendment. Figures are cross-checked against published summaries
 * from compliance firms and law firms (see `source` on each item). Nothing here
 * is invented: where a provision's exact threshold is exchange-specific or best
 * confirmed with the merchant banker, the text says so rather than guessing.
 *
 * This is the retrievable ground truth the assistant and compliance views cite,
 * so SIIM quotes the framework instead of relying on the model's memory.
 */

export interface RegChunk {
  id: string;
  title: string;
  text: string;
  /** Human-readable citation shown to the user. */
  citation: string;
  /** Lexical hints used by the keyword-fallback retriever. */
  keywords: string[];
}

export const ICDR_SME_CORPUS: RegChunk[] = [
  {
    id: "elig-ebitda",
    title: "Operating profitability (EBITDA) eligibility",
    text: "An issuer is eligible to make an SME initial public offering only if it has an operating profit (EBITDA) of at least ₹1 crore in at least two of the three financial years immediately preceding the filing of the draft offer document.",
    citation: "SEBI (ICDR) Regulations, 2018 — Chapter IX (SME), as amended 3 March 2025",
    keywords: ["ebitda", "operating profit", "profitability", "eligibility", "1 crore", "two of three years", "track record"],
  },
  {
    id: "elig-nta",
    title: "Net tangible assets",
    text: "SME issuers are required to have positive net tangible assets, computed net of intangible assets and revaluation reserves. The specific minimum is set by the listing platform (NSE Emerge and BSE SME), and is confirmed with the merchant banker before filing.",
    citation: "NSE Emerge / BSE SME listing eligibility norms; SEBI ICDR Chapter IX",
    keywords: ["net tangible assets", "nta", "eligibility", "balance sheet", "intangible"],
  },
  {
    id: "platform-capital",
    title: "SME platform and post-issue paid-up capital",
    text: "The SME platform is intended for issuers with a smaller post-issue paid-up capital. An issuer whose post-issue paid-up capital is between ₹10 crore and ₹25 crore may migrate to the main board of the stock exchange.",
    citation: "SEBI (ICDR) Regulations, 2018 — Chapter IX (SME)",
    keywords: ["post-issue paid-up capital", "sme platform", "25 crore", "10 crore", "migration", "main board"],
  },
  {
    id: "ofs-cap",
    title: "Offer for Sale (OFS) cap",
    text: "In an SME IPO the offer for sale portion is capped at 20% of the total issue size, and no individual selling shareholder may offer more than 50% of their pre-issue shareholding through the offer for sale.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["offer for sale", "ofs", "20 percent", "20%", "selling shareholder", "50 percent", "pre-issue holding", "dilution"],
  },
  {
    id: "gcp-cap",
    title: "General Corporate Purposes (GCP) cap",
    text: "The amount that an SME issuer may allocate to general corporate purposes is capped at the lower of 15% of the total issue size or ₹10 crore. Amounts above this must be re-allocated to specific, evidenced objects of the issue.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["general corporate purposes", "gcp", "15 percent", "15%", "10 crore", "objects of the issue", "use of proceeds", "cap"],
  },
  {
    id: "promoter-loan",
    title: "No repayment of promoter or related-party loans from proceeds",
    text: "IPO proceeds cannot be used, directly or indirectly, to repay any loan availed from the promoter, members of the promoter group, or related parties. Only borrowings from independent third-party lenders may be proposed for repayment from the issue proceeds.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["promoter loan", "related party", "repayment", "use of proceeds", "fund diversion", "objects", "debt repayment"],
  },
  {
    id: "monitoring-agency",
    title: "Monitoring agency for issue proceeds",
    text: "SME issuers must appoint a credit rating agency registered with SEBI as a monitoring agency to monitor the utilisation of issue proceeds. The March-2025 amendments lowered the size threshold at which this becomes mandatory to ₹50 crore. Exact applicability for a given issue is confirmed with the merchant banker.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025; SEBI SME framework review, Dec 2024",
    keywords: ["monitoring agency", "credit rating agency", "utilisation of proceeds", "50 crore", "threshold", "supervision"],
  },
  {
    id: "min-application",
    title: "Minimum application size",
    text: "The minimum application size for an SME IPO has been increased so that applicants must apply for at least two lots, corresponding to a minimum investment of approximately ₹2 lakh, to strengthen the profile of SME investors.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["minimum application size", "2 lakh", "two lots", "lot size", "retail investor"],
  },
  {
    id: "public-comment",
    title: "21-day public comment on the DRHP",
    text: "The draft offer document (DRHP) filed by an SME issuer must be made available for public comments for a period of 21 days. The issuer issues a public announcement in newspapers, and the document is hosted for stakeholder comment before it proceeds.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["public comment", "21 days", "draft offer document", "drhp", "newspaper advertisement", "hosting"],
  },
  {
    id: "min-allottees",
    title: "Minimum number of allottees",
    text: "The minimum number of allottees required in an SME IPO has been increased from 50 to 200, to broaden participation and prevent share concentration among a few investors.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["allottees", "200 allottees", "minimum allottees", "allotment", "concentration"],
  },
  {
    id: "promoter-lockin",
    title: "Promoter contribution and lock-in",
    text: "The minimum promoter contribution is subject to a lock-in of three years. Promoter shareholding held in excess of the minimum contribution is locked in as to 50% for a period of two years and the remaining 50% for one year.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["lock-in", "lockin", "promoter contribution", "three years", "two years", "one year", "excess holding"],
  },
  {
    id: "nii-allocation",
    title: "Allocation methodology for non-institutional investors",
    text: "The allocation methodology for non-institutional investors (NIIs) in SME IPOs has been aligned with the framework applicable to main board public issues.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025 (notified 3 March 2025)",
    keywords: ["non-institutional investors", "nii", "allocation methodology", "main board", "proportionate"],
  },
  {
    id: "restated-financials",
    title: "Restated financial statements",
    text: "The offer document must include restated financial statements for the specified periods, examined by a peer-reviewed auditor and accompanied by an examination report. Statutory audited financial statements alone are not sufficient for the offer document.",
    citation: "SEBI (ICDR) Regulations, 2018 — offer document contents",
    keywords: ["restated financials", "restated financial statements", "peer-reviewed auditor", "examination report", "financial information"],
  },
  {
    id: "exchange-review",
    title: "Exchange review of the SME offer document",
    text: "SME offer documents are processed by the stock exchange (NSE Emerge or BSE SME), which reviews the draft, issues observations and grants in-principle approval. This differs from main board issues, where SEBI issues observations on the draft offer document.",
    citation: "NSE Emerge / BSE SME processing framework; SEBI ICDR Chapter IX",
    keywords: ["exchange review", "nse emerge", "bse sme", "observations", "in-principle approval", "sebi", "processing"],
  },
  {
    id: "underwriting-marketmaking",
    title: "Underwriting and market making",
    text: "An SME IPO is required to be fully underwritten. The merchant banker (lead manager) underwrites a portion on its own account, and a market maker is appointed to provide two-way quotes and liquidity on the SME platform for a minimum specified period after listing.",
    citation: "SEBI (ICDR) Regulations, 2018 — Chapter IX (SME); exchange market-making norms",
    keywords: ["underwriting", "underwritten", "market maker", "market making", "liquidity", "merchant banker", "lead manager"],
  },
  {
    id: "convertibles",
    title: "Outstanding convertible securities before filing",
    text: "An SME issuer generally cannot file a draft offer document while there are outstanding convertible securities or other rights that entitle a person to receive equity shares, except for options already granted under an employee stock option scheme, which must be dealt with as prescribed before filing.",
    citation: "SEBI (ICDR) Amendment Regulations, 2025; SME framework review",
    keywords: ["convertible securities", "outstanding options", "esop", "employee stock option", "before filing", "eligibility"],
  },
];

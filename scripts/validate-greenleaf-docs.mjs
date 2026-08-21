/**
 * Regression-check the GreenLeaf demo pack against SIIM's real deterministic
 * upload pipeline. Run with Node 22+:
 *
 *   node --experimental-strip-types scripts/validate-greenleaf-docs.mjs [pdf-directory]
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";

const require = createRequire(import.meta.url);
globalThis.require = require;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const inputDir = path.resolve(process.argv[2] || "C:/Users/Admin/Downloads");
const { readFileText } = await import(pathToFileURL(path.join(repoRoot, "lib/document-processing/read-file.ts")).href);
const { classifyDocument, extractFields } = await import(pathToFileURL(path.join(repoRoot, "lib/document-processing/extract.ts")).href);
const { parseCompanyProfile } = await import(pathToFileURL(path.join(repoRoot, "lib/document-processing/profile-parser.ts")).href);
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

const expected = {
  "GreenLeaf Audited Financials FY2023.pdf": { pages: 2, category: "Financial Statements", fields: { fy: "FY2023", revenueCr: 68, ebitdaCr: 9.2, patCr: 4.1, netWorthCr: 22, borrowingsCr: 15, receivablesCr: 14, cfoCr: 5.5 } },
  "GreenLeaf Audited Financials FY2024.pdf": { pages: 2, category: "Financial Statements", fields: { fy: "FY2024", revenueCr: 84, ebitdaCr: 12.1, patCr: 6, netWorthCr: 28, borrowingsCr: 18, receivablesCr: 19, cfoCr: 6.8 } },
  "GreenLeaf Audited Financials FY2025.pdf": { pages: 2, category: "Financial Statements", fields: { fy: "FY2025", revenueCr: 108, ebitdaCr: 16.5, patCr: 8.9, netWorthCr: 37, borrowingsCr: 21, receivablesCr: 27, cfoCr: 7.9 } },
  "GreenLeaf Board Resolution IPO.pdf": { pages: 1, category: "Corporate Approvals", fields: { cin: "U15400GJ2012PLC071234", din: "02345670" } },
  "GreenLeaf Certificate of Incorporation.pdf": { pages: 1, category: "Constitutional", fields: { cin: "U15400GJ2012PLC071234", authorisedCapitalCr: 20 } },
  "GreenLeaf Factory License and Approvals.pdf": { pages: 1, category: "Licenses & Approvals", fields: { gstin: "24AACPG1234F1Z5" } },
  "GreenLeaf GST Summary FY2025.pdf": { pages: 1, category: "Tax Returns", fields: { fy: "FY2025", gstTurnoverCr: 106.4, demandNoticeCr: 0.22 } },
  "GreenLeaf Independent Director Consents.pdf": { pages: 1, category: "Governance", fields: { cin: "U15400GJ2012PLC071234" } },
  "GreenLeaf Litigation Declaration.pdf": { pages: 1, category: "Legal", fields: { litigationDeclared: "DISCLOSED", demandNoticeCr: 0.22 } },
  "GreenLeaf MOA-AOA.pdf": { pages: 1, category: "Constitutional", fields: { authorisedCapitalCr: 20 } },
  "GreenLeaf Machinery Quotation.pdf": { pages: 1, category: "Objects Evidence", fields: { gstin: "24AABCF7654Q1Z3", quotationAmountCr: 30, quotationHasGstin: true } },
  "GreenLeaf Promoter KYC.pdf": { pages: 1, category: "KYC", fields: { pan: "AACPP2345M", din: "02345670" } },
  "GreenLeaf RPT Register FY2025.pdf": { pages: 1, category: "Related Party", fields: { rptPurchasesCr: 4.6, promoterLoanCr: 2.2 } },
  "GreenLeaf Supply Agreements Summary.pdf": { pages: 1, category: "Contracts", fields: { leaseValidTill: "2031" } },
  "GreenLeaf Working Capital Assessment.pdf": { pages: 1, category: "Objects Evidence", fields: { wcRequirementCr: 12 } },
};

const financialFields = ["revenueCr", "patCr", "ebitdaCr", "netWorthCr", "borrowingsCr", "receivablesCr", "cfoCr"];
const failures = [];
const profileSources = [];

for (const [name, rule] of Object.entries(expected)) {
  const filePath = path.join(inputDir, name);
  if (!fs.existsSync(filePath)) {
    failures.push(`${name}: file missing`);
    continue;
  }

  const buffer = fs.readFileSync(filePath);
  const { pages, text } = await readFileText(name, buffer);
  const classification = classifyDocument(name, text);
  const fields = extractFields(name, text, classification.category);
  profileSources.push({ fileName: name, category: classification.category, text });

  if (pages.length !== rule.pages) failures.push(`${name}: expected ${rule.pages} page(s), got ${pages.length}`);
  if (pages.some((page) => page.trim().length < 150)) failures.push(`${name}: blank or near-blank page detected`);
  if (classification.category !== rule.category) failures.push(`${name}: expected ${rule.category}, got ${classification.category}`);

  for (const [field, value] of Object.entries(rule.fields)) {
    if (fields[field] !== value) failures.push(`${name}: ${field} expected ${value}, got ${fields[field]}`);
  }

  if (classification.category !== "Financial Statements") {
    for (const field of financialFields) {
      if (fields[field] !== undefined) failures.push(`${name}: unexpected financial field ${field}=${fields[field]}`);
    }
  }

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true, useSystemFonts: true }).promise;
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const content = await (await pdf.getPage(pageNo)).getTextContent();
    for (const item of content.items) {
      const value = item.str.trim();
      if (!value || value === "ILLUSTRATIVE SAMPLE") continue;
      const left = item.transform[4];
      const right = left + item.width;
      if (left < 48 || right > 547) {
        failures.push(`${name}: page ${pageNo} text outside safe width (${left.toFixed(1)}–${right.toFixed(1)}): ${value.slice(0, 45)}`);
        break;
      }
    }
  }

  console.log(`✓ ${name} — ${pages.length}p — ${classification.category}`);
}

const parsed = parseCompanyProfile(profileSources);
const expectedProfile = {
  name: "GreenLeaf Agro Foods Limited",
  cin: "U15400GJ2012PLC071234",
  industry: "Processing, packaging and sale of frozen and dehydrated fruits, vegetables and ready-to-cook food products",
  city: "Ahmedabad",
  state: "Gujarat",
  yearOfIncorporation: 2012,
  promoterName: "Rakesh Bhai Patel",
  promoterExperienceYears: 18,
  issueSizeCr: 48.5,
  freshIssueCr: 40,
  ofsCr: 8.5,
  proposedListingExchange: "NSE Emerge",
  top3CustomerPct: 52,
  independentDirectorsAppointed: true,
  auditCommitteeConstituted: true,
  pendingLitigationNote: "GST demand notice of Rs. 0.22 crore for FY2024; reply filed 15 December 2024; disputed",
};
for (const [field, value] of Object.entries(expectedProfile)) {
  if (parsed.profile[field] !== value) failures.push(`Onboarding profile: ${field} expected ${value}, got ${parsed.profile[field]}`);
}
if (parsed.financials.length !== 3) failures.push(`Onboarding profile: expected 3 financial years, got ${parsed.financials.length}`);
for (const rule of Object.values(expected).filter((item) => item.category === "Financial Statements")) {
  const fy = rule.fields.fy;
  const actual = parsed.financials.find((row) => row.fy === fy);
  if (!actual) {
    failures.push(`Onboarding profile: missing ${fy}`);
    continue;
  }
  for (const field of financialFields) {
    if (actual[field] !== rule.fields[field]) failures.push(`Onboarding profile ${fy}: ${field} expected ${rule.fields[field]}, got ${actual[field]}`);
  }
}

if (failures.length) {
  console.error(`\nGreenLeaf validation failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  failures.forEach((failure) => console.error(`  • ${failure}`));
  process.exit(1);
}

console.log(`\nPASS: ${Object.keys(expected).length} documents preserved their text layers, page bounds, classifications, document facts and complete onboarding profile.`);

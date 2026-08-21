/**
 * Professional GreenLeaf IPO-readiness evidence pack — letterheads with a monogram,
 * It uses document-specific letterheads, controlled-document metadata,
 * Schedule III-style financial presentation, signature blocks, seals and an
 * honest sample marker.
 *
 * Every fact-bearing document carries a "KEY PARTICULARS" / "FINANCIAL
 * HIGHLIGHTS" panel whose lines are single strings in the exact "Label: Rs. X
 * crore" shape the platform's line-based extractor parses instantly (no AI).
 * Honestly labelled as illustrative sample data.
 *
 *   node scripts/make-greenleaf-pro-docs.mjs ["C:/Users/Admin/Downloads"]
 */
import fs from "fs";
import path from "path";
const { default: PDFDocument } = await import("pdfkit");

const OUT = process.argv[2] || "C:/Users/Admin/Downloads";
fs.mkdirSync(OUT, { recursive: true });

// ── GreenLeaf data ────────────────────────────────────────────────────────────
const co = {
  name: "GreenLeaf Agro Foods Limited", short: "GreenLeaf", mono: "GL",
  cin: "U15400GJ2012PLC071234", incorpDate: "18 March 2012", roc: "Gujarat", publicYear: "2023",
  regOffice: "Plot No. 45, GIDC Estate, Ahmedabad, Gujarat 382330",
  city: "Ahmedabad", state: "Gujarat",
  business: "Processing, packaging and sale of frozen and dehydrated fruits, vegetables and ready-to-cook food products",
  mainObject: "processing, packaging and sale of frozen and dehydrated fruits, vegetables and ready-to-cook food products",
  authCapital: 20,
  promoter: { name: "Rakesh Bhai Patel", din: "02345670", pan: "AACPP2345M", experience: 18 },
  promoter2: { name: "Nita Patel", din: "02345671", pan: "AACPP2345N" },
  boardDate: "12 January 2025", egmDate: "08 February 2025",
  issueSize: 48.5, freshIssue: 40, ofs: 8.5,
  exchange: "SME Platform of the National Stock Exchange (NSE Emerge)",
  financials: {
    FY2023: { revenue: 68, ebitda: 9.2, pat: 4.1, netWorth: 22, borrowings: 15, receivables: 14, cfo: 5.5 },
    FY2024: { revenue: 84, ebitda: 12.1, pat: 6.0, netWorth: 28, borrowings: 18, receivables: 19, cfo: 6.8 },
    FY2025: { revenue: 108, ebitda: 16.5, pat: 8.9, netWorth: 37, borrowings: 21, receivables: 27, cfo: 7.9 },
  },
  latestFy: "FY2025", gstin: "24AACPG1234F1Z5", gstTurnover: 106.4,
  auditor: "Shah & Associates, Chartered Accountants", auditFrn: "112233W", auditPartner: "CA Mehul R. Shah", auditMno: "045678",
  idDate: "06 March 2025", idName1: "Dr. Meera Desai", idDin1: "03345678", idName2: "Rajiv Menon", idDin2: "03345679", acDate: "14 March 2025",
  top3Pct: 52, leaseTill: "31 March 2031",
  vendor: "FrostTech Systems India Private Limited", vendorGstin: "24AABCF7654Q1Z3",
  capexAmount: 30, wcAmount: 12, factoryTill: "31 December 2028", pcbTill: "30 September 2027",
};

// ── palette / geometry ────────────────────────────────────────────────────────
const L = 52, R = 543, CW = R - L, TOP = 44, BOTTOM = 775;
const GREEN = "#123c31", GREEN2 = "#176247", GOLD = "#b58a36", INK = "#17221e", MUT = "#61706a";
const SOFT = "#edf5f1", ZEBRA = "#f7faf8", BORD = "#b9c7c0", NAVY = "#183552", RED = "#a53c35";
const rs = (n) => `Rs. ${Number(n).toFixed(2)} crore`;
const cr = (n) => Number(n).toFixed(2);

function begin(name) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: TOP, right: L, bottom: 18, left: L },
    bufferPages: true,
    info: {
      Title: name.replace(/\.pdf$/i, ""),
      Author: co.name,
      Subject: "Illustrative SIIM IPO-readiness evidence",
      Keywords: "SIIM, SME IPO, illustrative sample, GreenLeaf",
      Creator: "SIIM — SME IPO Intelligence",
    },
  });
  const stream = fs.createWriteStream(path.join(OUT, name));
  doc.pipe(stream);
  doc._finished = new Promise((res) => stream.on("finish", res));
  doc._documentName = name.replace(/\.pdf$/i, "");
  doc.on("pageAdded", () => continuationHead(doc));
  return doc;
}

function monogram(doc, x, y, s = 40) {
  doc.save();
  doc.roundedRect(x, y, s, s, 7).fillColor(GREEN).fill();
  // leaf mark
  const cx = x + s / 2, cy = y + s / 2;
  doc.fillColor("#a9d6b8");
  doc.moveTo(cx, cy - 11).quadraticCurveTo(cx + 10, cy, cx, cy + 11).quadraticCurveTo(cx - 10, cy, cx, cy - 11).fill();
  doc.strokeColor(GREEN).lineWidth(0.8).moveTo(cx, cy - 9).lineTo(cx, cy + 9).stroke();
  doc.restore(); doc.fillColor(INK);
}

function continuationHead(doc) {
  const y = 33;
  doc.save();
  doc.roundedRect(L, y, 22, 22, 5).fillColor(GREEN).fill();
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff").text("GL", L, y + 7, { width: 22, align: "center", lineBreak: false });
  doc.font("Times-Bold").fontSize(10.5).fillColor(GREEN).text(co.name, L + 30, y + 3, { width: 275, lineBreak: false });
  doc.font("Helvetica").fontSize(6.8).fillColor(MUT).text("CONTROLLED DEMO RECORD  •  CONTINUED", R - 180, y + 6, { width: 180, align: "right", lineBreak: false });
  doc.moveTo(L, y + 29).lineTo(R, y + 29).lineWidth(0.8).strokeColor(BORD).stroke();
  doc.restore();
  doc.x = L; doc.y = 75;
}

function sampleChip(doc, text = "ILLUSTRATIVE SAMPLE • NOT FOR STATUTORY USE") {
  const w = 208, h = 16, x = R - w;
  doc.save();
  doc.roundedRect(x, 18, w, h, 8).fillColor("#f6ead2").fill();
  doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#785614").text(text, x + 7, 23, { width: w - 14, align: "center", lineBreak: false, characterSpacing: 0.25 });
  doc.restore();
}

function documentControl(doc, { refNo = "—", date = "—", status = "VERIFIED COPY", owner = "Company Secretarial" } = {}) {
  const y = doc.y, h = 36;
  doc.roundedRect(L, y, CW, h, 5).fillColor("#f7faf8").fill().strokeColor(BORD).lineWidth(0.6).stroke();
  const items = [["DOCUMENT ID", refNo], ["DOCUMENT DATE", date], ["STATUS", status], ["RECORD OWNER", owner]];
  const widths = [132, 112, 112, 135];
  let x = L;
  items.forEach(([label, value], i) => {
    if (i) doc.moveTo(x, y + 7).lineTo(x, y + h - 7).strokeColor("#d7e0dc").lineWidth(0.5).stroke();
    doc.font("Helvetica-Bold").fontSize(5.8).fillColor(GOLD).text(label, x + 8, y + 7, { width: widths[i] - 16, lineBreak: false, characterSpacing: 0.5 });
    doc.font("Helvetica-Bold").fontSize(7.3).fillColor(INK).text(value, x + 8, y + 20, { width: widths[i] - 16, lineBreak: false, ellipsis: true });
    x += widths[i];
  });
  doc.x = L; doc.y = y + h + 12;
}

function corporateHead(doc, { subtitle, refNo, date, status = "VERIFIED COPY", owner = "Company Secretarial" }) {
  sampleChip(doc);
  monogram(doc, L, TOP, 48);
  doc.font("Times-Bold").fontSize(19).fillColor(GREEN).text(co.name, L + 60, TOP + 1, { width: CW - 60, lineBreak: false });
  doc.font("Helvetica").fontSize(7.4).fillColor(MUT).text("FOOD PROCESSING  •  COLD CHAIN  •  EXPORTS", L + 60, TOP + 27, { width: CW - 60, lineBreak: false, characterSpacing: 0.5 });
  doc.fontSize(7.4).fillColor(MUT).text(`CIN ${co.cin}   |   GSTIN ${co.gstin}`, L + 60, TOP + 40, { width: CW - 60, lineBreak: false });
  doc.moveTo(L, TOP + 60).lineTo(R, TOP + 60).lineWidth(2.2).strokeColor(GREEN).stroke();
  doc.moveTo(L, TOP + 63).lineTo(R, TOP + 63).lineWidth(0.6).strokeColor(GOLD).stroke();
  doc.y = TOP + 76;
  if (subtitle) {
    doc.font("Times-Bold").fontSize(15).fillColor(NAVY).text(subtitle, L, doc.y, { width: CW, align: "left" });
    doc.font("Helvetica").fontSize(7).fillColor(MUT).text("IPO READINESS EVIDENCE • CONTROLLED DOCUMENT", L, doc.y + 5, { width: CW, align: "right", lineBreak: false, characterSpacing: 0.35 });
    doc.moveDown(0.85);
  }
  documentControl(doc, { refNo, date, status, owner });
  doc.fillColor(INK);
}

function vendorHead(doc, { subtitle, refNo, date }) {
  sampleChip(doc, "ILLUSTRATIVE COMMERCIAL RECORD • DEMO ONLY");
  doc.save();
  doc.roundedRect(L, TOP, 48, 48, 8).fillColor(NAVY).fill();
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#ffffff").text("FT", L, TOP + 16, { width: 48, align: "center", lineBreak: false });
  doc.restore();
  doc.font("Times-Bold").fontSize(17.5).fillColor(NAVY).text(co.vendor, L + 60, TOP + 2, { width: CW - 60, lineBreak: false });
  doc.font("Helvetica").fontSize(7.5).fillColor(MUT).text("FOOD PROCESSING & FREEZING EQUIPMENT  •  PUNE, MAHARASHTRA", L + 60, TOP + 29, { width: CW - 60, lineBreak: false, characterSpacing: 0.25 });
  doc.fontSize(7.5).text(`GSTIN ${co.vendorGstin}`, L + 60, TOP + 41, { width: CW - 60, lineBreak: false });
  doc.moveTo(L, TOP + 60).lineTo(R, TOP + 60).lineWidth(2.2).strokeColor(NAVY).stroke();
  doc.moveTo(L, TOP + 63).lineTo(R, TOP + 63).lineWidth(0.6).strokeColor(GOLD).stroke();
  doc.y = TOP + 76;
  doc.font("Times-Bold").fontSize(15).fillColor(NAVY).text(subtitle, L, doc.y, { width: CW });
  doc.moveDown(0.85);
  documentControl(doc, { refNo, date, status: "VALID QUOTATION", owner: "Sales & Projects" });
}

function govHead(doc, { authority, subtitle }) {
  sampleChip(doc, "ILLUSTRATIVE MCA-STYLE EXTRACT • NOT MCA ISSUED");
  const cx = L + CW / 2;
  doc.save().circle(cx, TOP + 23, 21).fillColor("#f0e4c9").fill().strokeColor(GOLD).lineWidth(1).stroke();
  doc.font("Times-Bold").fontSize(10).fillColor(GREEN).text("MCA", cx - 20, TOP + 19, { width: 40, align: "center", lineBreak: false }).restore();
  doc.font("Times-Bold").fontSize(14.5).fillColor(GREEN).text("GOVERNMENT OF INDIA", L, TOP + 51, { width: CW, align: "center" });
  doc.font("Times-Roman").fontSize(9.6).fillColor(INK).text(authority, L, TOP + 70, { width: CW, align: "center" });
  doc.moveTo(L, TOP + 91).lineTo(R, TOP + 91).lineWidth(1.5).strokeColor(GREEN).stroke();
  doc.y = TOP + 105;
  doc.font("Times-Bold").fontSize(16).fillColor(NAVY).text(subtitle, { width: CW, align: "center" });
  doc.font("Helvetica-Bold").fontSize(6.8).fillColor(RED).text("CERTIFIED EXTRACT FOR SIIM DEMONSTRATION — NOT A GOVERNMENT-ISSUED CERTIFICATE", { width: CW, align: "center", characterSpacing: 0.2 });
  doc.moveDown(1);
}

function sectionTab(doc, text) {
  if (doc.y + 40 > BOTTOM) doc.addPage();
  const y = doc.y;
  doc.roundedRect(L, y, CW, 22, 4).fillColor(SOFT).fill();
  doc.rect(L, y, 5, 22).fillColor(GOLD).fill();
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(GREEN).text(text.toUpperCase(), L + 13, y + 7, { width: CW - 20, characterSpacing: 0.25, lineBreak: false });
  doc.x = L; doc.y = y + 29; doc.fillColor(INK);
}

function para(doc, text, o = {}) {
  doc.font(o.font || "Helvetica").fontSize(o.size || 9.7).fillColor(o.color || INK)
    .text(text, L, doc.y, { width: CW, align: o.align || "left", lineGap: 2.2 });
  doc.moveDown(o.gap ?? 0.6);
  doc.x = L;
}

/** Bordered panel of single-line, extractor-friendly "Label: Rs. X crore" rows. */
function particulars(doc, title, lines) {
  const pad = 11;
  doc.font("Helvetica").fontSize(9);
  const lineHeights = lines.map((line) => Math.max(17, Math.ceil(doc.heightOfString(line, { width: CW - 34, lineGap: 1 })) + 5));
  const h = 30 + lineHeights.reduce((sum, height) => sum + height, 0) + 9;
  if (doc.y + h > BOTTOM) doc.addPage();
  const y = doc.y;
  doc.roundedRect(L, y, CW, h, 7).fillColor("#fbfdfc").fill().strokeColor("#9cbcaf").lineWidth(0.8).stroke();
  doc.roundedRect(L, y, CW, 24, 7).fillColor(GREEN).fill();
  doc.rect(L, y + 17, CW, 7).fillColor(GREEN).fill();
  doc.font("Helvetica-Bold").fontSize(8.4).fillColor("#ffffff").text(title.toUpperCase(), L + pad, y + 8, { width: CW - pad * 2, characterSpacing: 0.65, lineBreak: false });
  let ly = y + 31;
  for (const [i, line] of lines.entries()) {
    doc.circle(L + 13, ly + 4, 2.2).fillColor(i === 0 ? GOLD : GREEN2).fill();
    doc.font("Helvetica").fontSize(9).fillColor(INK).text(line, L + 22, ly, { width: CW - 34, lineGap: 1 });
    ly += lineHeights[i];
  }
  doc.x = L; doc.y = y + h + 10; doc.fillColor(INK);
}

function table(doc, cols, rows, { rowH = 18, zebra = true } = {}) {
  const startY = doc.y;
  let y = startY;
  const suppliedWidth = cols.reduce((sum, col) => sum + col.w, 0);
  const fittedCols = cols.map((col) => ({ ...col, w: (col.w / suppliedWidth) * CW }));
  const line = (cells, kind) => {
    const fontSize = kind === "head" ? 7.5 : 8.7;
    const fontName = kind === "head" || kind === "total" ? "Helvetica-Bold" : "Helvetica";
    doc.font(fontName).fontSize(fontSize);
    const contentHeights = fittedCols.map((c, i) => doc.heightOfString(String(cells[i] ?? ""), { width: c.w - 12, lineGap: 1 }));
    const actualH = Math.max(kind === "head" ? 25 : rowH, Math.ceil(Math.max(...contentHeights)) + 8);
    if (y + actualH > BOTTOM) { doc.addPage(); y = doc.y; }
    if (kind === "head") doc.rect(L, y, CW, actualH).fillColor(GREEN).fill();
    else if (kind === "total") doc.rect(L, y, CW, actualH).fillColor(SOFT).fill();
    else if (zebra && kind === "alt") doc.rect(L, y, CW, actualH).fillColor(ZEBRA).fill();
    let x = L;
    fittedCols.forEach((c, i) => {
      const bold = kind === "head" || kind === "total" || c.bold;
      const cellHeight = contentHeights[i];
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize)
        .fillColor(kind === "head" ? "#ffffff" : INK)
        .text(String(cells[i] ?? ""), x + 6, y + Math.max(4, (actualH - cellHeight) / 2), { width: c.w - 12, align: c.align || "left", lineGap: 1 });
      x += c.w;
    });
    doc.rect(L, y, CW, actualH).lineWidth(kind === "head" ? 0 : 0.5).strokeColor(BORD).stroke();
    let cx = L; fittedCols.forEach((c) => { cx += c.w; if (cx < R - 0.5) doc.moveTo(cx, y).lineTo(cx, y + actualH).lineWidth(0.4).strokeColor("#cdd8d2").stroke(); });
    y += actualH;
  };
  line(cols.map((c) => c.label), "head");
  rows.forEach((r, i) => {
    const total = r._total; const cells = r._total ? r.cells : r;
    line(cells, total ? "total" : (i % 2 ? "alt" : "body"));
  });
  if (y > startY) doc.rect(L, startY, CW, Math.min(y, BOTTOM) - startY).lineWidth(0.9).strokeColor(GREEN).stroke();
  doc.x = L; doc.y = y + 9; doc.fillColor(INK);
}
const T = (cells) => ({ _total: true, cells });

function signature(doc, { forName, name, role, extra = [], place = co.city, date }) {
  if (doc.y + 108 > BOTTOM) doc.addPage();
  doc.moveDown(1.15);
  const y = doc.y;
  doc.roundedRect(L, y, CW, 84, 6).fillColor("#fbfdfc").fill().strokeColor(BORD).lineWidth(0.6).stroke();
  doc.font("Helvetica-Bold").fontSize(6.3).fillColor(GOLD).text("EXECUTION DETAILS", L + 12, y + 11, { width: 150, lineBreak: false, characterSpacing: 0.55 });
  doc.font("Helvetica").fontSize(8.4).fillColor(INK).text(`Place: ${place}`, L + 12, y + 29, { lineBreak: false });
  if (date) doc.text(`Date: ${date}`, L + 12, y + 44, { lineBreak: false });
  const sx = R - 210;
  if (forName) doc.font("Helvetica-Bold").fontSize(8.2).fillColor(INK).text(`For ${forName}`, sx, y + 10, { width: 198, lineBreak: false, ellipsis: true });
  doc.font("Times-Italic").fontSize(12).fillColor(GREEN2).text("Digitally signed", sx, y + 27, { width: 198, lineBreak: false });
  doc.moveTo(sx, y + 47).lineTo(sx + 198, y + 47).lineWidth(0.7).strokeColor(INK).stroke();
  doc.font("Helvetica-Bold").fontSize(8.7).fillColor(INK).text(name, sx, y + 52, { width: 198, lineBreak: false, ellipsis: true });
  doc.font("Helvetica").fontSize(7.4).fillColor(MUT).text(role, sx, y + 65, { width: 198, lineBreak: false, ellipsis: true });
  extra.slice(0, 1).forEach((e) => doc.text(e, sx, y + 75, { width: 198, lineBreak: false, ellipsis: true }));
  doc.x = L; doc.y = y + 92; doc.fillColor(INK);
}

function seal(doc, cx, cy, top, mid) {
  doc.save();
  doc.circle(cx, cy, 32).lineWidth(1.4).strokeColor(GREEN).stroke();
  doc.circle(cx, cy, 25).lineWidth(0.5).strokeColor(GREEN).stroke();
  doc.font("Helvetica-Bold").fontSize(5.6).fillColor(GREEN).text(top, cx - 26, cy - 8, { width: 52, align: "center" });
  doc.font("Helvetica").fontSize(5).fillColor(GREEN).text(mid, cx - 24, cy + 2, { width: 48, align: "center" });
  doc.restore(); doc.fillColor(INK);
}

function finish(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.save();
    doc.opacity(0.025).font("Helvetica-Bold").fontSize(44).fillColor(GREEN)
      .rotate(-34, { origin: [297, 421] })
      .text("ILLUSTRATIVE SAMPLE", 63, 407, { width: 470, align: "center", lineBreak: false, characterSpacing: 1.2 });
    doc.restore();
    doc.moveTo(L, 801).lineTo(R, 801).lineWidth(0.5).strokeColor("#d5ddd8").stroke();
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(GREEN).text("SIIM EVIDENCE PACK", L, 808, { width: 115, lineBreak: false });
    doc.font("Helvetica-Oblique").fontSize(6.3).fillColor("#899790")
      .text("Illustrative sample data • Searchable text layer • Not a statutory filing", L + 108, 808, { width: 275, align: "center", lineBreak: false });
    doc.font("Helvetica").fontSize(6.5).fillColor("#899790").text(`Page ${i - range.start + 1} of ${range.count}`, R - 68, 808, { width: 68, align: "right", lineBreak: false });
  }
  doc.end();
  return doc._finished;
}

// ── financial derivations (tie out to core figures) ──────────────────────────
function pnl(f) {
  const otherIncome = 1, totalIncome = f.revenue + otherIncome, opex = totalIncome - f.ebitda;
  const materials = Math.round(opex * 0.68 * 10) / 10, employee = Math.round(opex * 0.15 * 10) / 10;
  const other = Math.round((opex - materials - employee) * 10) / 10;
  const dep = Math.round(f.revenue * 0.03 * 10) / 10, finance = Math.round(f.borrowings * 0.09 * 10) / 10;
  const pbt = Math.round((f.ebitda - dep - finance) * 10) / 10, tax = Math.round((pbt - f.pat) * 10) / 10;
  return { otherIncome, totalIncome, materials, employee, other, dep, finance, pbt, tax };
}
function bs(f) {
  const shareCap = 12, otherEquity = Math.round((f.netWorth - shareCap) * 10) / 10;
  const ltBorrow = Math.round(f.borrowings * 0.7 * 10) / 10, stBorrow = Math.round((f.borrowings - ltBorrow) * 10) / 10;
  const deferredTax = 2, payables = Math.round(f.receivables * 0.6 * 10) / 10, otherCL = 3;
  const totalEL = Math.round((f.netWorth + f.borrowings + deferredTax + payables + otherCL) * 10) / 10;
  const ppe = Math.round(totalEL * 0.42 * 10) / 10, inventory = Math.round(f.revenue * 0.11 * 10) / 10;
  const cash = Math.round((totalEL - (ppe + inventory + f.receivables)) * 10) / 10;
  return { shareCap, otherEquity, ltBorrow, stBorrow, deferredTax, payables, otherCL, totalEL, ppe, inventory, cash };
}

// ── documents ─────────────────────────────────────────────────────────────────
const docs = [];

docs.push(["GreenLeaf Certificate of Incorporation.pdf", (doc) => {
  govHead(doc, { authority: "MINISTRY OF CORPORATE AFFAIRS  ·  OFFICE OF THE REGISTRAR OF COMPANIES, GUJARAT", subtitle: "Certificate of Incorporation" });
  documentControl(doc, { refNo: `ROC-GJ/${co.cin}/2012`, date: co.incorpDate, status: "CERTIFIED EXTRACT", owner: "Registrar record" });
  para(doc, `Corporate Identity Number (CIN): ${co.cin}`, { font: "Helvetica-Bold", align: "center", size: 10.5, gap: 1 });
  doc.moveDown(0.6);
  para(doc, `I hereby certify that ${co.name} is incorporated on this ${co.incorpDate} under the Companies Act, and that the company is limited by shares.`, { size: 10.5 });
  para(doc, `The registered office of the company is situated at ${co.regOffice}, within the jurisdiction of the Registrar of Companies, ${co.roc}. The company was converted into a public limited company in the year ${co.publicYear}.`, { size: 10.5 });
  particulars(doc, "Key Particulars", [
    `Corporate Identity Number: ${co.cin}`,
    `Date of incorporation: ${co.incorpDate}`,
    `Registered office: ${co.regOffice}`,
    `Authorised Share Capital: Rs. ${cr(co.authCapital)} crore`,
  ]);
  para(doc, `Given under my hand at ${co.roc}.`, { size: 10.5 });
  signature(doc, { name: "Registrar of Companies", role: `${co.roc}`, date: co.incorpDate });
  seal(doc, R - 88, doc.y + 4, "REGISTRAR OF", "COMPANIES GUJARAT");
}]);

docs.push(["GreenLeaf MOA-AOA.pdf", (doc) => {
  corporateHead(doc, { subtitle: "Memorandum and Articles of Association" });
  const clause = (n, t, b) => { doc.font("Helvetica-Bold").fontSize(9.8).fillColor(INK).text(`${n}.  ${t}`); doc.moveDown(0.15); para(doc, b, { size: 9.5 }); };
  clause("I", "Name Clause", `The name of the company is ${co.name}.`);
  clause("II", "Registered Office Clause", `The registered office of the company will be situated in the State of ${co.state}, at ${co.regOffice}.`);
  clause("III", "Objects Clause", `The main object of the company is the ${co.mainObject}, together with all activities incidental and ancillary thereto.`);
  clause("IV", "Liability Clause", "The liability of the members is limited by shares.");
  clause("V", "Capital Clause", `The authorised share capital of the company is Rs. ${cr(co.authCapital)} crore divided into equity shares of Rs. 10 each.`);
  particulars(doc, "Key Particulars", [
    `Authorised Share Capital: Rs. ${cr(co.authCapital)} crore`,
    `CIN: ${co.cin}`,
    `Articles amended in ${co.publicYear} to permit a public issue of equity shares.`,
  ]);
  signature(doc, { forName: co.name, name: co.promoter.name, role: "Managing Director", extra: [`DIN: ${co.promoter.din}`] });
}]);

docs.push(["GreenLeaf Promoter KYC.pdf", (doc) => {
  corporateHead(doc, { subtitle: "Promoter and Director KYC Summary", refNo: "GL/SEC/KYC/2025", date: "31 March 2025", status: "KYC VERIFIED", owner: "Compliance" });
  table(doc, [{ label: "Name", w: 150 }, { label: "Designation", w: 118 }, { label: "DIN", w: 78, align: "center" }, { label: "PAN", w: 88, align: "center" }, { label: "Exp.(yrs)", w: 53, align: "center" }],
    [[co.promoter.name, "Managing Director", co.promoter.din, co.promoter.pan, String(co.promoter.experience)],
     [co.promoter2.name, "Whole-time Director", co.promoter2.din, co.promoter2.pan, "12"]]);
  particulars(doc, "Key Particulars", [
    `Promoter 1: ${co.promoter.name}  |  DIN: ${co.promoter.din}  |  PAN: ${co.promoter.pan}`,
    `Promoter 2: ${co.promoter2.name}  |  DIN: ${co.promoter2.din}  |  PAN: ${co.promoter2.pan}`,
  ]);
  para(doc, `Identity and address of both promoters have been verified against PAN, DIN and Aadhaar records. There is no debarment, disqualification under Section 164 of the Companies Act, or any pending regulatory prohibition on either promoter or director.`, { size: 9.5 });
  signature(doc, { forName: co.name, name: "Company Secretary & Compliance Officer", role: "Membership No. A28765", date: "31 March 2025" });
}]);

docs.push(["GreenLeaf Board Resolution IPO.pdf", (doc) => {
  corporateHead(doc, { subtitle: "Certified True Copy of Board Resolution", refNo: "GL/BOD/2025/07", date: co.boardDate, status: "CERTIFIED TRUE COPY", owner: "Board Secretariat" });
  para(doc, `Certified true copy of the resolution passed at the meeting of the Board of Directors of ${co.name} held on ${co.boardDate} at the registered office of the company.`, { size: 10 });
  para(doc, `"RESOLVED THAT consent of the Board be and is hereby accorded for an initial public offering of equity shares aggregating up to Rs. ${cr(co.issueSize)} crore, and for listing on the ${co.exchange}, comprising a fresh issue and an offer for sale as set out below:"`, { size: 9.8 });
  table(doc, [{ label: "Component of the Issue", w: 340 }, { label: "Amount (Rs. crore)", w: 167, align: "right" }],
    [["Fresh issue of equity shares", cr(co.freshIssue)], ["Offer for sale by the promoters", cr(co.ofs)], T(["Total issue size", cr(co.issueSize)])]);
  para(doc, `"RESOLVED FURTHER THAT the company do appoint a SEBI-registered merchant banker as lead manager, and that the Managing Director be authorised to do all acts necessary to give effect to this resolution."`, { size: 9.8 });
  particulars(doc, "Key Particulars", [
    `Total issue size: Rs. ${cr(co.issueSize)} crore`,
    `Fresh issue: Rs. ${cr(co.freshIssue)} crore  |  Offer for sale: Rs. ${cr(co.ofs)} crore`,
    `Board meeting date: ${co.boardDate}  |  EGM special resolution: ${co.egmDate}`,
  ]);
  signature(doc, { forName: co.name, name: co.promoter.name, role: "Managing Director", extra: [`DIN: ${co.promoter.din}`], date: co.boardDate });
  seal(doc, L + 66, doc.y - 28, "GREENLEAF AGRO", "FOODS LIMITED");
}]);

for (const [fy, f] of Object.entries(co.financials)) {
  docs.push([`GreenLeaf Audited Financials ${fy}.pdf`, (doc) => {
    const yr = fy.replace("FY", ""), p = pnl(f), b = bs(f);
    corporateHead(doc, { subtitle: `Restated Audited Financial Information — ${fy}`, refNo: `GL/FIN/${yr}`, date: `30 June ${yr}`, status: "AUDITED • RESTATED", owner: "Financial Reporting" });
    particulars(doc, `Financial Highlights — ${fy}`, [
      `Revenue from Operations: Rs. ${cr(f.revenue)} crore`,
      `EBITDA: Rs. ${cr(f.ebitda)} crore`,
      `Profit after Tax: Rs. ${cr(f.pat)} crore`,
      `Net Worth: Rs. ${cr(f.netWorth)} crore`,
      `Total Borrowings: Rs. ${cr(f.borrowings)} crore`,
      `Trade Receivables: Rs. ${cr(f.receivables)} crore`,
      `Cash Flow from Operations: Rs. ${cr(f.cfo)} crore`,
    ]);
    sectionTab(doc, `Statement of Profit and Loss for the year ended 31 March ${yr}   (Rs. in crore)`);
    table(doc, [{ label: "Particulars", w: 380 }, { label: `Year ended 31 Mar ${yr}`, w: 127, align: "right" }],
      [["Revenue from operations", cr(f.revenue)], ["Other income", cr(p.otherIncome)], T(["Total income", cr(p.totalIncome)]),
       ["Cost of materials consumed", cr(p.materials)], ["Employee benefits expense", cr(p.employee)], ["Other expenses", cr(p.other)],
       T(["EBITDA", cr(f.ebitda)]), ["Depreciation and amortisation", cr(p.dep)], ["Finance costs", cr(p.finance)],
       T(["Profit before tax", cr(p.pbt)]), ["Tax expense", cr(p.tax)], T(["Profit after tax", cr(f.pat)])], { rowH: 17 });
    sectionTab(doc, `Balance Sheet as at 31 March ${yr}   (Rs. in crore)`);
    table(doc, [{ label: "Particulars", w: 380 }, { label: `As at 31 Mar ${yr}`, w: 127, align: "right" }],
      [["Equity share capital", cr(b.shareCap)], ["Other equity (reserves & surplus)", cr(b.otherEquity)], T(["Net worth", cr(f.netWorth)]),
       ["Non-current borrowings", cr(b.ltBorrow)], ["Deferred tax liabilities (net)", cr(b.deferredTax)], ["Current borrowings", cr(b.stBorrow)],
       ["Trade payables", cr(b.payables)], ["Other current liabilities", cr(b.otherCL)], T(["Total equity and liabilities", cr(b.totalEL)]),
       ["Property, plant and equipment", cr(b.ppe)], ["Inventories", cr(b.inventory)], ["Trade receivables", cr(f.receivables)],
       ["Cash and bank balances", cr(b.cash)], T(["Total assets", cr(b.totalEL)])], { rowH: 16 });
    sectionTab(doc, "Independent Auditor's Report — Extract");
    para(doc, `Opinion. In our opinion and to the best of our information, the restated financial information gives a true and fair view of the company's financial position and performance for ${fy}, in accordance with the basis of preparation described in the accompanying notes.`, { size: 8.7, color: INK, gap: 0.35 });
    para(doc, `Basis of preparation. The schedules have been derived from the audited books of account, presented in a Schedule III-style format and examined for their intended inclusion in the illustrative offer-document workflow. Figures are rounded to the nearest Rs. 0.10 crore unless stated otherwise.`, { size: 8.3, color: MUT });
    signature(doc, { forName: co.auditor, name: co.auditPartner, role: `Partner  |  M. No. ${co.auditMno}  |  FRN ${co.auditFrn}`, extra: [`UDIN: ${co.auditMno}AAAA${yr}1234`], place: co.city, date: `30 June ${yr}` });
    seal(doc, L + 66, doc.y - 26, "SHAH & ASSOCIATES", "CHARTERED ACCOUNTANTS");
  }]);
}

docs.push([`GreenLeaf GST Summary ${co.latestFy}.pdf`, (doc) => {
  corporateHead(doc, { subtitle: `GSTR-9 Annual Return — Summary (${co.latestFy})`, refNo: "GSTR-9/2024-25", date: "31 December 2025", status: "FILED SUMMARY", owner: "Indirect Tax" });
  particulars(doc, "Key Particulars", [
    `GSTIN: ${co.gstin}`,
    `Aggregate Taxable Turnover: Rs. ${cr(co.gstTurnover)} crore`,
    `GST demand notice of Rs. 0.22 crore for FY2024 pending; reply filed 15 December 2024; the demand is disputed.`,
  ]);
  table(doc, [{ label: "Particulars", w: 380 }, { label: "Amount (Rs. crore)", w: 127, align: "right" }],
    [["Aggregate taxable turnover (outward supplies)", cr(co.gstTurnover)], ["Exempt / nil-rated / non-GST turnover", "0.00"], T(["Total turnover as per GST records", cr(co.gstTurnover)])]);
  para(doc, `Note: A GST demand notice for Rs. 0.22 crore (Rs. 22 lakh) pertaining to FY2024 is pending. A reply was filed on 15 December 2024 and a personal hearing is awaited. The demand is disputed by the company.`, { size: 9.4 });
  signature(doc, { forName: co.name, name: "Authorised Signatory (GST)", role: "Finance Department", date: "31 March 2025" });
}]);

docs.push([`GreenLeaf RPT Register ${co.latestFy}.pdf`, (doc) => {
  corporateHead(doc, { subtitle: `Register of Related Party Transactions (${co.latestFy})`, refNo: "GL/SEC/RPT/2025", date: "31 March 2025", status: "REVIEW PENDING", owner: "Audit Committee" });
  para(doc, `Maintained under Section 189 of the Companies Act and Accounting Standard 18. The following transactions were entered into with related parties during the financial year:`, { size: 9.5 });
  table(doc, [{ label: "Related party", w: 150 }, { label: "Relationship", w: 118 }, { label: "Nature of transaction", w: 132 }, { label: "Amount (Rs. cr)", w: 107, align: "right" }],
    [["Patel Cold Storage LLP", "Promoter family interest", "Purchase of cold-storage services", "4.60"],
     ["Rakesh Bhai Patel (Promoter)", "Managing Director", "Unsecured loan to the company", "2.20"]], { rowH: 30 });
  particulars(doc, "Key Particulars", [
    `Purchases from Patel Cold Storage LLP: Rs. 4.60 crore (promoter family interest)`,
    `Unsecured loan from promoter outstanding: Rs. 2.20 crore`,
  ]);
  para(doc, `The arm's-length basis and audit-committee approval for the above transactions are being finalised. Comparative independent-vendor pricing for the cold-storage services is to be placed on record.`, { size: 9 });
  signature(doc, { forName: co.name, name: co.promoter2.name, role: "Whole-time Director", extra: [`DIN: ${co.promoter2.din}`], date: "31 March 2025" });
}]);

docs.push(["GreenLeaf Litigation Declaration.pdf", (doc) => {
  corporateHead(doc, { subtitle: "Declaration on Outstanding Litigation", refNo: "GL/LEG/DECL/2025", date: "31 March 2025", status: "MATTER DISCLOSED", owner: "Legal & Compliance" });
  para(doc, `We, the Board of Directors of ${co.name}, identify the following outstanding regulatory matter as at the date of this declaration. No other material litigation, arbitration or regulatory proceeding has been identified against the company, its promoters or its directors:`, { size: 10 });
  table(doc, [{ label: "No.", w: 34, align: "center" }, { label: "Matter", w: 340 }, { label: "Amount (Rs. cr)", w: 133, align: "right" }],
    [["1", "GST demand notice for FY2024 from the jurisdictional officer; reply filed on 15 December 2024, personal hearing awaited. The demand is disputed.", "0.22"]], { rowH: 42 });
  particulars(doc, "Key Particulars", [
    `Outstanding litigation status: DISCLOSED — one disputed GST regulatory matter.`,
    `GST demand notice of Rs. 0.22 crore for FY2024; reply filed 15 December 2024; disputed.`,
  ]);
  signature(doc, { forName: co.name, name: co.promoter.name, role: "Managing Director", extra: [`DIN: ${co.promoter.din}`], date: "31 March 2025" });
}]);

docs.push(["GreenLeaf Independent Director Consents.pdf", (doc) => {
  corporateHead(doc, { subtitle: "Corporate Governance — Independent Directors & Committees", refNo: "GL/SEC/GOV/2025", date: co.acDate, status: "CONSENTS RECEIVED", owner: "Nomination Committee" });
  para(doc, `Consent to act as director (Form DIR-2) has been received from the following independent directors, appointed on ${co.idDate}:`, { size: 9.5 });
  table(doc, [{ label: "Independent Director", w: 240 }, { label: "DIN", w: 140, align: "center" }, { label: "Date of appointment", w: 127, align: "center" }],
    [[co.idName1, co.idDin1, co.idDate], [co.idName2, co.idDin2, co.idDate]]);
  sectionTab(doc, "Board committees constituted");
  table(doc, [{ label: "Committee", w: 300 }, { label: "Composition", w: 120 }, { label: "Constituted", w: 87, align: "center" }],
    [["Audit Committee", "2 ID + 1 ED", co.acDate], ["Nomination & Remuneration Committee", "2 ID + 1 ED", co.acDate], ["Stakeholders' Relationship Committee", "2 ID + 1 ED", co.acDate]], { rowH: 20 });
  signature(doc, { forName: co.name, name: "Company Secretary", role: "Compliance Officer", date: co.acDate });
}]);

docs.push(["GreenLeaf Supply Agreements Summary.pdf", (doc) => {
  corporateHead(doc, { subtitle: "Material Contracts — Summary of Supply Agreements", refNo: "GL/CON/2025", date: "31 March 2025", status: "MANAGEMENT SUMMARY", owner: "Commercial" });
  para(doc, `The company has entered into long-term supply agreements with its principal institutional customers for frozen and dehydrated food products. Key terms are summarised below:`, { size: 9.5 });
  table(doc, [{ label: "Counterparty", w: 200 }, { label: "Nature", w: 160 }, { label: "Tenure", w: 127, align: "center" }],
    [["Institutional customer A (name redacted)", "Annual supply contract", "3 years"], ["Retail-chain customer B (name redacted)", "Framework supply agreement", "2 years"], ["Export customer C (name redacted)", "Purchase-order arrangement", "Rolling"]], { rowH: 20 });
  particulars(doc, "Key Particulars", [
    `Top 3 customers contributed approximately ${co.top3Pct}% of revenue in ${co.latestFy}.`,
    `Principal factory premises held under a lease valid until ${co.leaseTill}.`,
  ]);
  signature(doc, { forName: co.name, name: co.promoter.name, role: "Managing Director", extra: [`DIN: ${co.promoter.din}`] });
}]);

docs.push(["GreenLeaf Machinery Quotation.pdf", (doc) => {
  vendorHead(doc, { subtitle: "Quotation for Capital Equipment", refNo: "FTS/2025/GL/0417", date: "05 March 2025" });
  const y = doc.y;
  doc.font("Helvetica").fontSize(9).fillColor(INK).text("Quotation No.: FTS/2025/GL/0417", L, y).text(`To: ${co.name}, ${co.city}`, L, doc.y);
  doc.text("Date: 05 March 2025", L, y, { width: CW, align: "right" }).text("Validity: 120 days", L, doc.y, { width: CW, align: "right" });
  doc.moveDown(1.2);
  table(doc, [{ label: "Item", w: 300 }, { label: "Qty", w: 47, align: "center" }, { label: "Amount (Rs. cr)", w: 160, align: "right" }],
    [["Individual Quick Freezing (IQF) tunnel", "1", "18.50"], ["Industrial blanchers and pre-cooling line", "1", "6.20"], ["Automated weighing & packaging line", "1", "5.30"], T(["Basic price total", "", "30.00"])], { rowH: 20 });
  particulars(doc, "Key Particulars", [
    `Basic price total: Rs. ${cr(co.capexAmount)} crore plus applicable GST`,
    `Vendor GSTIN: ${co.vendorGstin}  |  Delivery: 20 weeks  |  Installation included`,
  ]);
  para(doc, `Applicable GST is extra as per prevailing rates. This quotation supports the capital-expenditure object of the proposed issue.`, { size: 9 });
  signature(doc, { forName: co.vendor, name: "Authorised Signatory", role: "Sales & Projects", place: "Pune", date: "05 March 2025" });
  seal(doc, L + 66, doc.y - 26, "FROSTTECH SYSTEMS", "INDIA PVT LTD");
}]);

docs.push(["GreenLeaf Working Capital Assessment.pdf", (doc) => {
  corporateHead(doc, { subtitle: `Working Capital Requirement Assessment — ${co.latestFy}`, refNo: "GL/FIN/WC/2025", date: "20 March 2025", status: "CA CERTIFIED", owner: "Treasury & Finance" });
  para(doc, `Prepared on the holding-period method, consistent with the historical operating cycle of the company, to determine the incremental working-capital requirement to be funded from the proceeds of the proposed issue.`, { size: 9.5 });
  table(doc, [{ label: "Particulars", w: 380 }, { label: "Amount (Rs. cr)", w: 127, align: "right" }],
    [["Projected inventory holding", "8.50"], ["Projected trade receivables", "9.00"], ["Less: trade payables and spontaneous finance", "5.50"], T(["Net incremental working capital requirement", cr(co.wcAmount)])], { rowH: 20 });
  particulars(doc, "Key Particulars", [
    `Incremental working capital requirement: Rs. ${cr(co.wcAmount)} crore for the projected year.`,
    `Basis: holding-period method consistent with the historical operating cycle.`,
  ]);
  signature(doc, { forName: co.auditor, name: co.auditPartner, role: `Chartered Accountant  |  M. No. ${co.auditMno}`, place: co.city, date: "20 March 2025" });
}]);

docs.push(["GreenLeaf Factory License and Approvals.pdf", (doc) => {
  corporateHead(doc, { subtitle: "Register of Government Licenses and Approvals", refNo: "GL/SEC/LIC/2025", date: "31 March 2025", status: "ACTIVE REGISTER", owner: "Plant Compliance" });
  table(doc, [{ label: "Approval / License", w: 200 }, { label: "Issuing authority", w: 160 }, { label: "Valid until", w: 127, align: "center" }],
    [["GST registration", `State GST, ${co.state}`, "Active"], ["Factory licence / establishment approval", "Directorate of Industrial Safety", co.factoryTill],
     ["Consent to Operate", "State Pollution Control Board", co.pcbTill], ["Udyam registration (Medium Enterprise)", "Ministry of MSME", "Active"],
     ["FSSAI central license 10012345000123", "FSSAI", "31 August 2027"], ["ISO 22000:2018 (Food Safety)", "Accredited certification body", "Active"]], { rowH: 22 });
  particulars(doc, "Key Particulars", [
    `GSTIN: ${co.gstin}  |  Factory license valid until ${co.factoryTill}`,
    `Consent to Operate valid until ${co.pcbTill}  |  FSSAI and ISO 22000 certifications in force.`,
  ]);
  signature(doc, { forName: co.name, name: "Company Secretary", role: "Compliance Officer", date: "31 March 2025" });
}]);

// ── run ───────────────────────────────────────────────────────────────────────
let n = 0;
for (const [name, build] of docs) { const doc = begin(name); build(doc); await finish(doc); n++; console.log(`  ✓ ${name}`); }
console.log(`\nGenerated ${n} professional documents into: ${OUT}`);

/**
 * SEED — restore the pre-built "GreenLeaf Agro Foods Limited" demo company and
 * its entire object graph (company profile + uploaded documents, chunks, facts,
 * draft sections, conflicts, audit log and analysis) into MongoDB from the
 * committed fixture scripts/fixtures/greenleaf.json.
 *
 * Idempotent: it replaces exactly GreenLeaf's own rows (scoped by companyId /
 * owner email) and leaves every other company untouched, so it can be re-run
 * safely and produces the same state each time. Regenerate the fixture with
 * scripts/export-greenleaf.mjs.
 *
 * Usage:
 *   node scripts/seed-greenleaf.mjs                 # seed into MONGODB_URI (.env.local)
 *   node scripts/seed-greenleaf.mjs --keep-password # don't reset the login password
 *   node scripts/seed-greenleaf.mjs --activate      # also set it as the global active company
 *
 * Demo login it (re)creates unless --keep-password:
 *   promoter@greenleaf.com  /  Demo@123   (role PROMOTER)
 *
 * Note: uploaded PDF bytes are NOT part of the fixture — on serverless hosting
 * uploads live on ephemeral disk. The document records, extracted text, facts,
 * drafts and analysis all come from MongoDB and render fully; only the raw-file
 * download returns a graceful "file no longer on this server" notice.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env"]) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("❌ MONGODB_URI is not set. Add it to .env.local first."); process.exit(1); }
const dbName = process.env.MONGODB_DB || "siim";

const KEEP_PASSWORD = process.argv.includes("--keep-password");
const ACTIVATE = process.argv.includes("--activate");
const DEMO_PASSWORD = process.env.GREENLEAF_PASSWORD || "Demo@123";

const fixturePath = path.join(root, "scripts", "fixtures", "greenleaf.json");
if (!fs.existsSync(fixturePath)) {
  console.error(`❌ Fixture not found: ${path.relative(root, fixturePath)}\n   Run: node scripts/export-greenleaf.mjs`);
  process.exit(1);
}
const fx = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
const cid = fx.company.id;
const ownerEmail = (fx.company.ownerEmail || fx.meta.ownerEmail).toLowerCase();

/** Delete this company's rows from an array collection, then insert the fixture
 *  rows appended after the current max `_i` (preserves fixture order). */
async function reseedArray(db, col, rows) {
  const c = db.collection(col);
  await c.deleteMany({ companyId: cid });
  if (!rows.length) return 0;
  const last = await c.find({}).sort({ _i: -1 }).limit(1).next();
  const base = (last?._i ?? -1) + 1;
  await c.insertMany(rows.map((r, i) => ({ ...r, _i: base + i })));
  return rows.length;
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(dbName);
  console.log(`Connected to ${dbName} @ ${uri.replace(/\/\/[^@]*@/, "//***@")}\n`);

  // company (upsert by id)
  await db.collection("companies").replaceOne({ id: cid }, fx.company, { upsert: true });
  console.log(`  company: ${fx.company.name} [${cid}] owner=${ownerEmail} code=${fx.company.companyCode}`);

  // owning promoter user (upsert by email; reset password unless --keep-password)
  if (fx.user) {
    const set = { name: fx.user.name, role: fx.user.role || "PROMOTER", email: ownerEmail };
    if (!KEEP_PASSWORD) set.passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    else if (fx.user.passwordHash) set.passwordHash = fx.user.passwordHash;
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").updateOne(
      { email: ownerEmail },
      { $set: set, $setOnInsert: { id: fx.user.id, createdAt: fx.user.createdAt || new Date().toISOString() } },
      { upsert: true }
    );
    console.log(`  user: ${ownerEmail} (${set.role})${KEEP_PASSWORD ? " — password kept" : ` — password = ${DEMO_PASSWORD}`}`);
  }

  // array collections scoped to this company
  for (const [col, rows] of [
    ["documents", fx.documents], ["chunks", fx.chunks], ["facts", fx.facts],
    ["conflicts", fx.conflicts], ["draftSections", fx.draftSections],
    ["flags", fx.flags], ["auditLog", fx.auditLog], ["exportLedger", fx.exportLedger],
  ]) {
    const n = await reseedArray(db, col, rows || []);
    console.log(`  ${col}: ${n} docs`);
  }

  // objectsByCompany + analysis (one doc per company)
  await db.collection("objectsByCompany").deleteOne({ companyId: cid });
  if ((fx.objects || []).length)
    await db.collection("objectsByCompany").insertOne({ companyId: cid, items: fx.objects });
  console.log(`  objectsByCompany: ${(fx.objects || []).length} objects`);

  await db.collection("analysis").deleteOne({ companyId: cid });
  if (fx.analysis) await db.collection("analysis").insertOne({ companyId: cid, result: fx.analysis });
  console.log(`  analysis: ${fx.analysis ? "1 result" : "none"}`);

  if (ACTIVATE) {
    await db.collection("meta").updateOne({ _id: "app" }, { $set: { activeCompanyId: cid } }, { upsert: true });
    console.log(`  meta.activeCompanyId = ${cid}`);
  }

  console.log(`\n✅ GreenLeaf seeded. Log in as ${ownerEmail}${KEEP_PASSWORD ? "" : ` / ${DEMO_PASSWORD}`} to view it.`);
} finally {
  await client.close();
}

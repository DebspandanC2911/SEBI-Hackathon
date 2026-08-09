/**
 * EXPORT — snapshot the fully-seeded "GreenLeaf Agro Foods Limited" company and
 * its entire object graph from the live MongoDB into a portable JSON fixture
 * (scripts/fixtures/greenleaf.json). Pair with scripts/seed-greenleaf.mjs to restore
 * the exact same pre-seeded state into any target database (local or the DB the
 * deployed app uses).
 *
 * Usage:  node scripts/export-greenleaf.mjs
 * Reads MONGODB_URI / MONGODB_DB from .env.local.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

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
if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }
const dbName = process.env.MONGODB_DB || "siim";

// Which GreenLeaf to snapshot (the promoter-owned canonical demo company).
const OWNER_EMAIL = process.env.GREENLEAF_OWNER || "promoter@greenleaf.com";

const strip = (doc) => { if (doc) { delete doc._id; delete doc._i; } return doc; };

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const company = strip(await db.collection("companies").findOne({ ownerEmail: OWNER_EMAIL }));
if (!company) { console.error(`No company owned by ${OWNER_EMAIL}`); process.exit(1); }
const cid = company.id;

const many = async (col, q) => (await db.collection(col).find(q).sort({ _i: 1 }).toArray()).map(strip);

const documents = await many("documents", { companyId: cid });
const chunks = await many("chunks", { companyId: cid });
const facts = await many("facts", { companyId: cid });
const conflicts = await many("conflicts", { companyId: cid });
const draftSections = await many("draftSections", { companyId: cid });
const flags = await many("flags", { companyId: cid });
const auditLog = await many("auditLog", { companyId: cid });
const exportLedger = await many("exportLedger", { companyId: cid });
const objectsByCompanyDoc = strip(await db.collection("objectsByCompany").findOne({ companyId: cid }));
const analysisDoc = strip(await db.collection("analysis").findOne({ companyId: cid }));
const user = strip(await db.collection("users").findOne({ email: OWNER_EMAIL }));

const fixture = {
  meta: { exportedAt: new Date().toISOString(), source: dbName, companyId: cid, ownerEmail: OWNER_EMAIL },
  company,
  user, // includes existing passwordHash; seeder can override password
  documents,
  chunks,
  facts,
  conflicts,
  draftSections,
  flags,
  auditLog,
  exportLedger,
  objects: objectsByCompanyDoc ? objectsByCompanyDoc.items : [],
  analysis: analysisDoc ? analysisDoc.result : null,
};

const outDir = path.join(root, "scripts", "fixtures");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "greenleaf.json");
fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));

console.log(`Exported GreenLeaf snapshot → ${path.relative(root, outPath)}`);
console.log(`  company: ${company.name} [${cid}] owner=${OWNER_EMAIL} code=${company.companyCode}`);
console.log(`  documents=${documents.length} chunks=${chunks.length} facts=${facts.length} drafts=${draftSections.length}`);
console.log(`  conflicts=${conflicts.length} objects=${fixture.objects.length} analysis=${analysisDoc ? "yes" : "no"} user=${user ? "yes" : "no"}`);
console.log(`  storedPaths present: ${documents.filter(d=>d.storedPath).length}/${documents.length} (local paths; not portable to Vercel)`);
await client.close();

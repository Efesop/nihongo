import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync(".env.prod", "utf8");
const dbLine = env.split("\n").find(l => l.startsWith("DATABASE_URL="));
const DATABASE_URL = dbLine.replace("DATABASE_URL=", "").replace(/^"(.*)"$/, "$1");
const sql = neon(DATABASE_URL);

const users = await sql`SELECT id, username, data FROM users`;
console.log("Total users:", users.length);

for (const u of users) {
  const d = u.data || {};
  const phr = d.phr || {};
  const kana = d.kana || {};
  const log = d.answerLog || [];
  const errors = d.errors || {};

  const phrBox = {};
  Object.values(phr).forEach(p => { phrBox[p.box || 0] = (phrBox[p.box || 0] || 0) + 1; });

  const topErrors = Object.entries(errors).sort((a, b) => b[1] - a[1]).slice(0, 15);

  const byType = {};
  log.forEach(e => {
    if (!byType[e.type]) byType[e.type] = { c: 0, w: 0, totalMs: 0, count: 0 };
    byType[e.type][e.correct ? "c" : "w"]++;
    byType[e.type].totalMs += e.ms || 0;
    byType[e.type].count++;
  });
  const typeStats = Object.entries(byType).map(([type, s]) => ({
    type, total: s.c + s.w,
    accuracy: s.c + s.w > 0 ? Math.round(s.c / (s.c + s.w) * 100) : 0,
    avgMs: Math.round(s.totalMs / s.count),
  })).sort((a, b) => b.total - a.total);

  const recent = log.slice(-40);

  console.log("\n=== USER", u.id, u.username || "", "===");
  console.log("Sessions:", d.sessions, "| TotalC:", d.totalC, "| Streak:", d.streak);
  console.log("Phrases learned:", Object.keys(phr).length, "/ 101");
  console.log("Kana learned:", Object.keys(kana).length);
  console.log("Phrase box dist:", phrBox);
  console.log("Log size:", log.length);
  console.log("\nTop errors (item: count):");
  topErrors.forEach(([id, n]) => console.log(`  ${id}: ${n}`));
  console.log("\nPer-exercise stats:");
  typeStats.forEach(s => console.log(`  ${s.type.padEnd(22)} ${String(s.total).padStart(4)} attempts, ${String(s.accuracy).padStart(3)}%, avg ${s.avgMs}ms`));
  console.log("\nLast 40 answers:");
  recent.forEach(r => console.log(`  ${r.correct ? "✓" : "✗"} ${(r.type || "?").padEnd(20)} [${(r.item || "").padEnd(8)}] ${r.ms || 0}ms`));
}

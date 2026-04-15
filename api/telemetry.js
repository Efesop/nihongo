import { neon } from "@neondatabase/serverless";
import { verifyToken } from "@clerk/backend";

const sql = neon(process.env.DATABASE_URL);

async function getUserId(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload.sub;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "events array required" });
    }
    // cap batch at 200
    const batch = events.slice(0, 200);

    // bulk insert via single query — neon serverless supports parameterised arrays
    const values = batch.map(e => ({
      user_id: userId,
      event: String(e.event || "unknown").slice(0, 64),
      payload: e.payload || {},
      ts: e.ts ? new Date(e.ts) : new Date(),
    }));

    // simple loop insert — small batches, fine for our scale
    for (const v of values) {
      await sql`
        INSERT INTO telemetry_events (user_id, event, payload, ts)
        VALUES (${v.user_id}, ${v.event}, ${JSON.stringify(v.payload)}, ${v.ts})
      `;
    }

    return res.status(200).json({ ok: true, inserted: values.length });
  } catch (e) {
    console.error("telemetry error:", e);
    return res.status(500).json({ error: "internal" });
  }
}

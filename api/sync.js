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
    return payload.sub; // Clerk user ID
  } catch (e) {
    console.error("Token verification failed:", e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  try {
    // GET — load user data
    if (req.method === "GET") {
      const rows = await sql`SELECT data FROM users WHERE id = ${userId}`;
      if (rows.length === 0) return res.status(404).json({ error: "not found" });
      return res.status(200).json({ data: rows[0].data });
    }

    // POST — upsert user data
    if (req.method === "POST") {
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: "data required" });

      await sql`
        INSERT INTO users (id, data, updated_at)
        VALUES (${userId}, ${JSON.stringify(data)}, NOW())
        ON CONFLICT (id) DO UPDATE
        SET data = ${JSON.stringify(data)}, updated_at = NOW()
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error("sync error", e);
    return res.status(500).json({ error: e.message });
  }
}

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // GET /api/sync?id=<uuid>  — load user data
    if (req.method === "GET") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id required" });

      const rows = await sql`SELECT data, username FROM users WHERE id = ${id}`;
      if (rows.length === 0) return res.status(404).json({ error: "not found" });
      return res.status(200).json({ data: rows[0].data, username: rows[0].username });
    }

    // POST /api/sync  — upsert user data
    // body: { id, data, username? }
    if (req.method === "POST") {
      const { id, data, username } = req.body;
      if (!id || !data) return res.status(400).json({ error: "id and data required" });

      // If username provided, check it's not taken by someone else
      if (username) {
        const conflict = await sql`
          SELECT id FROM users WHERE username = ${username} AND id != ${id}
        `;
        if (conflict.length > 0) {
          return res.status(409).json({ error: "username_taken" });
        }
      }

      await sql`
        INSERT INTO users (id, username, data, updated_at)
        VALUES (${id}, ${username || null}, ${JSON.stringify(data)}, NOW())
        ON CONFLICT (id) DO UPDATE
        SET data = ${JSON.stringify(data)},
            username = COALESCE(${username || null}, users.username),
            updated_at = NOW()
      `;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error("sync error", e);
    return res.status(500).json({ error: e.message });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "code required" });

  const valid = (code || "").trim().toLowerCase() === (process.env.ACCESS_CODE || "").trim().toLowerCase();
  return res.status(200).json({ valid });
}

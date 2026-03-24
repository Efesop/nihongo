export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { character, romaji, currentMnemonic, interests } = req.body;

    const systemPrompt = `Generate a personalised mnemonic for remembering a Japanese character. The user has specific interests — use those to create a memorable, vivid association.

RULES:
- Connect the CHARACTER'S SHAPE to something from the user's interests
- Make it vivid, specific, and memorable
- One sentence, punchy
- The mnemonic should help remember both the shape AND the sound

Return ONLY valid JSON:
{
  "mnemonic": "the personalised mnemonic story (1-2 sentences)",
  "emoji": "a relevant emoji",
  "title": "2-3 word title"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: JSON.stringify({ character, romaji, currentMnemonic, interests }) }],
      }),
    });

    const data = await response.json();
    const aiText = data.content?.[0]?.text || '{}';
    let parsed;
    try { parsed = JSON.parse(aiText); } catch { parsed = { error: 'Failed' }; }
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate mnemonic' });
  }
}

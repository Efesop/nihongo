export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { knownPhrases, scenario, previousChoice, turnNumber } = req.body;

    const systemPrompt = `You are a Japanese conversation scenario generator. Create an interactive, branching dialogue scene where the user must choose what to say in Japanese.

RULES:
- Use ONLY vocabulary/phrases the user already knows (provided in their known list)
- Each turn: describe the scene briefly in English, then show what the Japanese speaker says (in Japanese + romaji + English)
- Provide 3 response options for the user (in Japanese), each leading to a different outcome
- One option should be clearly best, one okay, one wrong/funny
- Keep it engaging — add personality, small details, reactions
- Write in hiragana/katakana only (no kanji)

Return ONLY valid JSON:
{
  "scene": "Brief scene description in English",
  "npcLine": {
    "japanese": "what the NPC says",
    "romaji": "romaji reading",
    "english": "English translation",
    "speaker": "who is speaking (e.g. waiter, station staff)"
  },
  "options": [
    {
      "japanese": "response option in Japanese",
      "romaji": "romaji",
      "english": "what this means",
      "quality": "best|okay|wrong",
      "consequence": "what happens next (1 sentence)"
    }
  ],
  "isEnd": false
}

If turnNumber >= 4 or the scenario has a natural conclusion, set isEnd: true and add a "summary" field with a brief wrap-up.`;

    const userMessage = JSON.stringify({
      knownPhrases: knownPhrases || [],
      scenario: scenario || "restaurant",
      previousChoice: previousChoice || null,
      turnNumber: turnNumber || 1,
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const aiText = data.content?.[0]?.text || '{}';

    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = { error: 'Failed to parse conversation', raw: aiText };
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate conversation' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { knownPhrases, knownKana, level, interests } = req.body;

    const systemPrompt = `You are a Japanese story generator for language learners. Generate a short story (3-5 sentences) in Japanese using ONLY the vocabulary and grammar the user already knows.

RULES:
- Use ONLY words/phrases from the user's known list
- You may use basic particles (は, を, に, で, が, の, と, も, か) even if not explicitly listed — these are taught through phrase breakdowns
- Keep sentences short and simple
- Write in hiragana/katakana only (no kanji unless the user knows it)
- Include a natural, engaging mini-narrative (someone doing something, a small problem, a resolution)
- Make it feel like a real scene in Japan

Return ONLY valid JSON:
{
  "title": "short title in English",
  "sentences": [
    {
      "japanese": "the sentence in Japanese",
      "romaji": "the romaji reading",
      "english": "English translation",
      "breakdown": [[japanese_part, romaji_part, meaning, grammar_type], ...]
    }
  ],
  "comprehensionQuestion": {
    "question": "simple question about the story in English",
    "options": ["answer A", "answer B", "answer C"],
    "correctIndex": 0
  }
}`;

    const userMessage = JSON.stringify({
      knownPhrases: knownPhrases || [],
      knownKana: knownKana || 0,
      level: level || 'beginner',
      interests: interests || [],
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
        max_tokens: 800,
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
      parsed = { error: 'Failed to parse story', raw: aiText };
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate story' });
  }
}

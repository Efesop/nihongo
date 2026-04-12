export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { knownPhrases, errorPatterns } = req.body;

    const systemPrompt = `You are a Japanese phrase remixer and error analyst for TinySenpai, a language learning app.

You have two jobs depending on the request:

JOB 1 — PHRASE REMIX (when knownPhrases provided):
Take the user's known Japanese vocabulary words/components and create 3 NEW phrases they haven't seen.
Rules:
- Recombine known building blocks into natural Japanese phrases
- Each new phrase must be comprehensible from known components
- Keep it practical and useful for travelers/daily life
- Write in hiragana/katakana only (no kanji)
- Include romaji and English translation
- Make them progressively harder

JOB 2 — MISTAKE ANALYSIS (when errorPatterns provided):
Analyze the user's error patterns and generate a targeted micro-lesson.
- Identify WHY they're confusing certain items
- Explain the underlying pattern or rule they're missing
- Give a memorable tip or mnemonic
- Suggest what to focus on

Return ONLY valid JSON:
{
  "remixes": [
    { "jp": "phrase in Japanese", "romaji": "romaji", "en": "English", "components": ["word1", "word2"] }
  ],
  "analysis": "markdown string with mistake analysis (only if errorPatterns provided)",
  "tip": "one-line memorable tip (only if errorPatterns provided)"
}`;

    const userMsg = [];
    if (knownPhrases?.length) {
      userMsg.push(`Known phrases and vocabulary:\n${knownPhrases.map(p => `${p.jp} (${p.en})`).join('\n')}`);
      userMsg.push('\nCreate 3 remixed phrases using components from the above.');
    }
    if (errorPatterns?.length) {
      userMsg.push(`\nError patterns:\n${errorPatterns.map(e => `Confused "${e.item}" (${e.correct}) — picked "${e.wrong}" instead, ${e.count} times`).join('\n')}`);
      userMsg.push('\nAnalyze these mistakes and explain what the user is doing wrong.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg.join('\n') }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Claude API error: ${err}` });
    }

    const data = await response.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Invalid response format' });

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

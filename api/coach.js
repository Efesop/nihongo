export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { mode, userData, sessionResults } = req.body;

    let systemPrompt, userMessage;

    if (mode === 'plan') {
      systemPrompt = `You are an AI Japanese learning coach. Analyze the user's learning data and return a JSON session plan.

RULES:
- Return ONLY valid JSON, no markdown, no explanation
- Be concise — minimize output tokens
- Focus on what the user needs MOST right now
- Consider their stated goals, streak, and time since last session
- Prioritise review of struggling items over new content
- If user has feedback notes, incorporate them

JSON format:
{
  "focus": "kana|phrases|listening|mixed",
  "weakItems": ["list of specific characters or phrase IDs they struggle with"],
  "introduce": "category or content type to introduce next",
  "exerciseWeights": {"visual": 0.3, "listen": 0.3, "scenario": 0.2, "production": 0.2},
  "difficulty": -1 to 1 (negative=easier, positive=harder),
  "sessionNotes": "one sentence about what this session should focus on"
}`;

      // Build a concise summary of user data (not the whole object — save tokens)
      const kanaStats = userData.kana ? Object.entries(userData.kana) : [];
      const masteredKana = kanaStats.filter(([_, v]) => (v?.box || 0) >= 3).length;
      const learningKana = kanaStats.filter(([_, v]) => (v?.box || 0) >= 1 && (v?.box || 0) < 3).length;
      const dueKana = kanaStats.filter(([_, v]) => (v?.box || 0) >= 1 && Date.now() >= (v?.next || 0)).length;

      const phrStats = userData.phr ? Object.entries(userData.phr) : [];
      const masteredPhr = phrStats.filter(([_, v]) => (v?.box || 0) >= 3).length;
      const learningPhr = phrStats.filter(([_, v]) => (v?.box || 0) >= 1 && (v?.box || 0) < 3).length;
      const duePhr = phrStats.filter(([_, v]) => (v?.box || 0) >= 1 && Date.now() >= (v?.next || 0)).length;

      userMessage = JSON.stringify({
        kana: { mastered: masteredKana, learning: learningKana, due: dueKana, total: 92 },
        phrases: { mastered: masteredPhr, learning: learningPhr, due: duePhr, total: 56 },
        streak: userData.streak || 1,
        totalSessions: userData.sessions || 0,
        level: userData.onboarding?.level || 'beginner',
        goal: userData.onboarding?.why || 'travel',
        tripDate: userData.onboarding?.tripDate || null,
        previousCoaching: userData.settings?.coaching || null,
        sessionDifficulty: userData.settings?.sessionDifficulty || 0,
        feedbackNotes: userData.settings?.feedbackNotes || [],
      });

    } else if (mode === 'review') {
      systemPrompt = `You are an AI Japanese learning coach. Analyze the session results and return JSON with coaching feedback.

RULES:
- Return ONLY valid JSON, no markdown, no explanation
- userCoaching: one encouraging sentence about progress + one actionable suggestion
- platformInsight: one observation about the learning experience that could help improve the app (be specific)
- nextFocus: what the next session should prioritise

JSON format:
{
  "userCoaching": "string",
  "platformInsight": "string",
  "nextFocus": "kana|phrases|listening|mixed",
  "nextDifficulty": -1 to 1
}`;

      userMessage = JSON.stringify(sessionResults);
    } else {
      return res.status(400).json({ error: 'Invalid mode. Use "plan" or "review".' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();

    // Parse the AI's JSON response
    const aiText = data.content?.[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = { error: 'Failed to parse AI response', raw: aiText };
    }

    // If review mode, store platform insight in DB (fire and forget)
    if (mode === 'review' && parsed.platformInsight) {
      const neonUrl = process.env.DATABASE_URL;
      if (neonUrl) {
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(neonUrl);
          await sql`INSERT INTO platform_insights (user_id, insight, session_data)
                    VALUES (${req.body.userId || 'anonymous'}, ${parsed.platformInsight}, ${JSON.stringify(sessionResults)})`;
        } catch (e) {
          // Don't fail the response if DB insert fails
          console.error('Failed to store platform insight:', e.message);
        }
      }
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to contact coaching API' });
  }
}

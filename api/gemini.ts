import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting in-memory (si azzera ad ogni cold start, sufficiente per traffico basso)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_DAY = 10;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + ONE_DAY_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_DAY) {
    return true;
  }

  entry.count += 1;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Rate limiting per IP
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Hai raggiunto il limite giornaliero di analisi AI. Riprova domani.',
    });
  }

  // Verifica chiave API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configurazione server mancante.' });
  }

  // Leggi il prompt dal body
  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt mancante o non valido.' });
  }

  // Limite lunghezza prompt (prevenzione abusi)
  if (prompt.length > 20000) {
    return res.status(400).json({ error: 'Prompt troppo lungo.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return res.status(502).json({
        error: 'Errore nella generazione AI. Riprova tra qualche secondo.',
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return res.status(502).json({ error: 'Risposta AI vuota.' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

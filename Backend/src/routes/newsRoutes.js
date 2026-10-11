const express = require('express');
const router = express.Router();

const DEFAULT_SUGGESTIONS = [
  { title: 'Explain quantum computing in simple terms' },
  { title: 'Compare microservices vs modular monoliths' },
  { title: 'Recent breakthroughs in renewable energy technology' },
  { title: 'Best practices for securing Node.js APIs in production' },
];

router.get('/suggestions', async (req, res) => {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    return res.json({ suggestions: DEFAULT_SUGGESTIONS });
  }

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      country: 'in,cn,au,wo',
      language: 'en',
      category: 'technology,education,science',
    });

    const response = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`);
    if (!response.ok) {
      return res.json({ suggestions: DEFAULT_SUGGESTIONS });
    }

    const data = await response.json();
    const seen = new Set();
    const suggestions = [];

    for (const item of data.results || []) {
      const raw = item.title || item.description || '';
      const cleaned = raw.replace(/\s+/g, ' ').trim();
      if (!cleaned) continue;
      const title = cleaned.length > 90 ? `${cleaned.slice(0, 90)}...` : cleaned;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ title });
      if (suggestions.length >= 4) break;
    }

    return res.json({
      suggestions: suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS,
    });
  } catch (error) {
    console.error('Error fetching NewsData in backend proxy:', error.message);
    return res.json({ suggestions: DEFAULT_SUGGESTIONS });
  }
});

module.exports = router;

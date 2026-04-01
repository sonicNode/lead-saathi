const axios = require('axios');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

// ─── Small-talk / irrelevant filter (keyword fallback) ────────────────────────
const IRRELEVANT_PATTERNS = [
  /^(hi|hello|hey|howdy|hiya|sup)\b/i,
  /^how are you/i,
  /^good (morning|afternoon|evening|night)/i,
  /^(what's up|whats up|wassup|yo)\b/i,
  /^(thanks|thank you|ok|okay|sure|cool|nice|great)\b/i,
  /^(lol|haha|😂|👍|🙏)\b/i,
];

function isIrrelevantByKeyword(text) {
  const t = text.trim();
  return IRRELEVANT_PATTERNS.some(p => p.test(t));
}

// ─── Generic Sarvam helper ────────────────────────────────────────────────────
async function callSarvam(systemPrompt, userMessage) {
  if (!SARVAM_API_KEY) return null;

  try {
    const response = await axios.post(
      SARVAM_API_URL,
      {
        model: 'saarika:v1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  },
        ],
        max_tokens: 120,
      },
      {
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    return response?.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('⚠️  Sarvam AI unavailable:', err.message);
    return null;
  }
}

// ─── Check if message is relevant to sales qualification ──────────────────────
// Returns: true = relevant (should be recorded), false = irrelevant (redirect)
async function isRelevantAnswer(userText, step) {
  // Fast path: keyword check first
  if (isIrrelevantByKeyword(userText)) return false;
  if (userText.trim().length < 3) return false;

  // Sarvam-powered relevance check
  const systemPrompt = `You are a sales qualification assistant checking if a user's reply is relevant to a business question.
The current question is about: "${step}".
Answer ONLY with "YES" if the reply is relevant, or "NO" if it's small talk / completely off-topic.`;

  const result = await callSarvam(systemPrompt, userText);
  if (!result) {
    // Fallback: anything > 4 words is probably relevant
    return userText.trim().split(/\s+/).length >= 2;
  }
  return result.toUpperCase().startsWith('YES');
}

// ─── Extract a clean answer summary from user reply ───────────────────────────
async function extractAnswer(userText, step) {
  const systemPrompt = `You are a concise sales data extractor. 
The question was about: "${step}".
Extract and return ONLY the key information from the user's reply in 1–2 sentences. 
Do not add opinions or extra context.`;

  const result = await callSarvam(systemPrompt, userText);
  // fallback: return trimmed user text itself
  return result || userText.trim();
}

// ─── Legacy: text enhancement for /api/process ────────────────────────────────
async function enhanceWithSarvam(text) {
  const systemPrompt =
    'You are a lead qualification assistant. Summarize the following sales lead message in one sentence.';
  const result = await callSarvam(systemPrompt, text);
  return result || text;
}

module.exports = { isRelevantAnswer, extractAnswer, enhanceWithSarvam };

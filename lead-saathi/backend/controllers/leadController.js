const { enhanceWithSarvam } = require('../services/sarvamService');
const Lead = require('../models/leadModel');

// ─── BANT Detection ───────────────────────────────────────────────────────────
function detectBANT(text) {
  const lower = text.toLowerCase();

  const budget =
    lower.includes('budget') ||
    lower.includes('₹') ||
    lower.includes('rs.') ||
    lower.includes('lakh') ||
    lower.includes('crore') ||
    lower.includes('cost') ||
    lower.includes('price') ||
    lower.includes('afford');

  const authority =
    lower.includes('owner') ||
    lower.includes('decision') ||
    lower.includes('ceo') ||
    lower.includes('founder') ||
    lower.includes('manager') ||
    lower.includes('head') ||
    lower.includes('director') ||
    lower.includes('i decide') ||
    lower.includes('i am the');

  const timeline =
    lower.includes('month') ||
    lower.includes('week') ||
    lower.includes('soon') ||
    lower.includes('urgent') ||
    lower.includes('asap') ||
    lower.includes('quarter') ||
    lower.includes('immediate');

  // Need is always true – the lead reached out, so there's an implied need.
  const need = true;

  return { budget, authority, need, timeline };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
function calculateScore(bant) {
  let score = 0;
  if (bant.budget) score += 3;
  if (bant.need) score += 3;   // always +3
  if (bant.timeline) score += 2;
  if (bant.authority) score += 2;
  return score;
}

// ─── Category ─────────────────────────────────────────────────────────────────
function getCategory(score) {
  if (score >= 8) return 'Hot';
  if (score >= 5) return 'Warm';
  return 'Cold';
}

// ─── Response Text ────────────────────────────────────────────────────────────
function buildResponse(category) {
  const map = {
    Hot: 'High intent lead detected. Scheduling immediate follow-up. 🔥',
    Warm: 'Lead shows strong interest. Needs further qualification before advancing. ✅',
    Cold: 'Low intent detected. Adding to nurture sequence for future engagement. 🧊',
  };
  return map[category];
}

// ─── Controller: POST /api/process ───────────────────────────────────────────
exports.processLead = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text field is required and must be a non-empty string.' });
    }

    // Step 1 – Optionally enhance with Sarvam AI (falls back if unavailable)
    const enhancedText = await enhanceWithSarvam(text.trim());

    // Step 2 – BANT analysis
    const bant = detectBANT(text); // use original for BANT (more reliable)

    // Step 3 – Score & classify
    const score = calculateScore(bant);
    const category = getCategory(score);
    const response = buildResponse(category);

    // Step 4 – Persist to MongoDB (non-blocking – failure won't crash API)
    try {
      const lead = new Lead({ text: text.trim(), score, category, bant, response });
      await lead.save();
    } catch (dbErr) {
      console.warn('⚠️  DB save skipped:', dbErr.message);
    }

    // Step 5 – Return result
    return res.json({
      original: text.trim(),
      enhanced: enhancedText,
      bant,
      score,
      category,
      response,
    });
  } catch (err) {
    console.error('processLead error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
};

// ─── Controller: GET /api/leads ───────────────────────────────────────────────
exports.getLeads = async (_req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).limit(50);
    return res.json(leads);
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch leads.' });
  }
};

const { isRelevantAnswer, extractAnswer } = require('../services/sarvamService');
const Lead = require('../models/leadModel');

// ─── Conversation Config ───────────────────────────────────────────────────────

const STEPS = ['need', 'budget', 'timeline', 'authority'];

const QUESTIONS = {
  need:      "What service or product are you looking for today?",
  budget:    "Do you have a budget range in mind for this?",
  timeline:  "When are you planning to start or go live?",
  authority: "Are you the decision maker for this purchase?",
};

const STEP_LABELS = {
  need:      "Understanding your needs",
  budget:    "Evaluating budget",
  timeline:  "Assessing timeline",
  authority: "Confirming authority",
};

const REDIRECT_MSG =
  "I'm here to help qualify your requirements. Let's keep focused — ";

// ─── In-memory Session Store ──────────────────────────────────────────────────
// Sessions auto-expire after 30 minutes
const sessions = new Map();

function createSession(sessionId) {
  const session = {
    id: sessionId,
    currentStepIndex: 0,
    collectedData: { need: null, budget: null, timeline: null, authority: null },
    done: false,
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  // Expire sessions older than 30 min
  if (Date.now() - session.createdAt > 30 * 60 * 1000) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

// ─── BANT Scoring ─────────────────────────────────────────────────────────────
function scoreSession(collectedData) {
  let score = 0;
  // Need always collected (user reached step 4 means all filled)
  if (collectedData.need)      score += 3;
  if (collectedData.budget)    score += 3;
  if (collectedData.timeline)  score += 2;
  if (collectedData.authority) score += 2;

  // Refine: budget/authority might be negative answers
  const budgetText    = (collectedData.budget    || '').toLowerCase();
  const authorityText = (collectedData.authority || '').toLowerCase();
  const timelineText  = (collectedData.timeline  || '').toLowerCase();

  // Deduct if clearly negative
  if (budgetText.match(/no budget|not sure|don't know|no idea|unclear/))        score -= 2;
  if (authorityText.match(/not me|someone else|my boss|need approval|manager/)) score -= 2;
  if (timelineText.match(/no rush|someday|maybe|not sure|no timeline/))         score -= 1;

  score = Math.max(0, Math.min(10, score));

  let category = 'Cold';
  if (score >= 8) category = 'Hot';
  else if (score >= 5) category = 'Warm';

  return { score, category };
}

function buildFinalMessage(category) {
  const map = {
    Hot:  "🔥 Great! You seem like a strong fit. We'll schedule a follow-up call shortly.",
    Warm: "✅ Thanks! We may need a few more details before proceeding. Our team will reach out.",
    Cold: "🧊 This may not be a priority lead right now. We'll add you to our nurture list.",
  };
  return map[category];
}

// ─── Controller: POST /api/chat ───────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    // ── NEW SESSION: return first question ──────────────────────────────────
    if (!userMessage || userMessage.trim() === '') {
      const session = createSession(sessionId);
      const firstStep = STEPS[0];
      return res.json({
        message:       QUESTIONS[firstStep],
        stepLabel:     STEP_LABELS[firstStep],
        currentStep:   firstStep,
        stepIndex:     0,
        totalSteps:    STEPS.length,
        collectedData: session.collectedData,
        done:          false,
      });
    }

    // ── EXISTING SESSION ────────────────────────────────────────────────────
    let session = getSession(sessionId);
    if (!session) {
      // Session expired or doesn't exist → restart
      session = createSession(sessionId);
      return res.json({
        message:       "Let's start fresh. " + QUESTIONS[STEPS[0]],
        stepLabel:     STEP_LABELS[STEPS[0]],
        currentStep:   STEPS[0],
        stepIndex:     0,
        totalSteps:    STEPS.length,
        collectedData: session.collectedData,
        done:          false,
      });
    }

    if (session.done) {
      return res.json({ message: "This session is complete. Start a new one to qualify another lead.", done: true });
    }

    const currentStep = STEPS[session.currentStepIndex];

    // ── Relevance check ─────────────────────────────────────────────────────
    const relevant = await isRelevantAnswer(userMessage, currentStep);

    if (!relevant) {
      return res.json({
        message:       REDIRECT_MSG + QUESTIONS[currentStep],
        stepLabel:     STEP_LABELS[currentStep],
        currentStep,
        stepIndex:     session.currentStepIndex,
        totalSteps:    STEPS.length,
        collectedData: session.collectedData,
        done:          false,
        redirected:    true,
      });
    }

    // ── Extract and store answer ─────────────────────────────────────────────
    const extractedAnswer = await extractAnswer(userMessage, currentStep);
    session.collectedData[currentStep] = extractedAnswer;

    // ── Advance to next step ─────────────────────────────────────────────────
    session.currentStepIndex += 1;

    // ── All steps complete → score and finalize ──────────────────────────────
    if (session.currentStepIndex >= STEPS.length) {
      session.done = true;
      const { score, category } = scoreSession(session.collectedData);
      const finalMessage = buildFinalMessage(category);

      // Persist to MongoDB (non-blocking)
      try {
        const bant = {
          budget:    !!session.collectedData.budget,
          authority: !!session.collectedData.authority,
          need:      !!session.collectedData.need,
          timeline:  !!session.collectedData.timeline,
        };
        const lead = new Lead({
          text: JSON.stringify(session.collectedData),
          score, category, bant, response: finalMessage,
        });
        await lead.save();
      } catch (dbErr) {
        console.warn('⚠️  DB save skipped:', dbErr.message);
      }

      return res.json({
        message:       finalMessage,
        currentStep:   'done',
        stepIndex:     STEPS.length,
        totalSteps:    STEPS.length,
        collectedData: session.collectedData,
        done:          true,
        score,
        category,
      });
    }

    // ── Ask next question ────────────────────────────────────────────────────
    const nextStep = STEPS[session.currentStepIndex];
    const transitions = {
      budget:    "Got it! Now, ",
      timeline:  "Noted! Next, ",
      authority: "Perfect! Lastly, ",
    };
    const prefix = transitions[nextStep] || '';

    return res.json({
      message:       prefix + QUESTIONS[nextStep],
      stepLabel:     STEP_LABELS[nextStep],
      currentStep:   nextStep,
      stepIndex:     session.currentStepIndex,
      totalSteps:    STEPS.length,
      collectedData: session.collectedData,
      done:          false,
    });

  } catch (err) {
    console.error('chat controller error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
};

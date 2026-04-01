const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const chatController = require('../controllers/chatController');

// ─── Guided Conversation (Step-by-step BANT flow) ─────────────────────────────
// POST /api/chat  –  stateful conversation endpoint
router.post('/chat', chatController.chat);

// ─── Single-shot Lead Processing ──────────────────────────────────────────────
// POST /api/process
router.post('/process', leadController.processLead);

// ─── Lead History ─────────────────────────────────────────────────────────────
// GET  /api/leads
router.get('/leads', leadController.getLeads);

module.exports = router;

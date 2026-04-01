const storageService = require("../services/storageService");
const { createHttpError } = require("../utils/httpError");

async function createLead(req, res) {
  const { userId, category, summary, status, notes } = req.body;

  if (!userId) {
    throw createHttpError(400, "userId is required.");
  }

  if (!summary || !summary.trim()) {
    throw createHttpError(400, "Lead summary is required.");
  }

  const lead = await storageService.createLead({
    userId,
    category: category?.trim() || "general",
    summary: summary.trim(),
    status: status?.trim() || "new",
    notes: notes?.trim() || ""
  });

  res.status(201).json({
    message: "Lead saved successfully.",
    lead
  });
}

async function listLeads(req, res) {
  const leads = await storageService.listLeads(req.query.userId);

  res.json({
    items: leads
  });
}

module.exports = {
  createLead,
  listLeads
};


function detectIntent(transcriptText) {
  const normalized = transcriptText.toLowerCase();

  if (normalized.includes("job") || normalized.includes("employment")) {
    return "employment";
  }

  if (
    normalized.includes("admission") ||
    normalized.includes("school") ||
    normalized.includes("college")
  ) {
    return "education";
  }

  if (
    normalized.includes("loan") ||
    normalized.includes("scheme") ||
    normalized.includes("subsidy")
  ) {
    return "government-support";
  }

  if (
    normalized.includes("doctor") ||
    normalized.includes("hospital") ||
    normalized.includes("health")
  ) {
    return "healthcare";
  }

  return "general";
}

function buildGuidance(intent) {
  const guidanceMap = {
    employment:
      "The next step is to capture job preference, experience, and location so we can shortlist matching opportunities.",
    education:
      "The next step is to confirm the course, class level, and required documents so we can guide the application process.",
    "government-support":
      "The next step is to verify eligibility details and list the documents needed before moving ahead.",
    healthcare:
      "The next step is to understand urgency, location, and support needed so the case can be routed quickly.",
    general:
      "The next step is to capture a short summary and one preferred follow-up action so the case moves forward cleanly."
  };

  return guidanceMap[intent];
}

async function generateAssistantReply({ transcriptText, user }) {
  const safeTranscript = transcriptText.trim();
  const userName = user?.name ? user.name.split(" ")[0] : "friend";
  const intent = detectIntent(safeTranscript);
  const nextStep = buildGuidance(intent);

  return {
    intent,
    responseText: `${userName}, I understood your request as: "${safeTranscript}". ${nextStep}`
  };
}

module.exports = {
  generateAssistantReply
};

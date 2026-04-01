const env = require("../config/env");
const { getStorageStatus } = require("../services/storageService");

function getHealth(req, res) {
  res.json({
    ok: true,
    app: "Lead Saathi API",
    storage: getStorageStatus(),
    voiceProvider: env.voiceProvider,
    sarvamConfigured: Boolean(env.sarvamApiKey)
  });
}

module.exports = {
  getHealth
};


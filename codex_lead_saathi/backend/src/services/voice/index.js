const env = require("../../config/env");
const mockProvider = require("./mockProvider");
const sarvamProvider = require("./sarvamProvider");

function getVoiceProvider() {
  return env.voiceProvider === "sarvam" ? sarvamProvider : mockProvider;
}

module.exports = {
  getVoiceProvider
};

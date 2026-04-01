const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "",
  voiceProvider: process.env.VOICE_PROVIDER || "mock",
  sarvamApiKey: process.env.SARVAM_API_KEY || "",
  sarvamSttModel: process.env.SARVAM_STT_MODEL || "saaras:v3",
  sarvamTtsModel: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
  sarvamSpeaker: process.env.SARVAM_SPEAKER || "shubh",
  sarvamDefaultLanguage: process.env.SARVAM_DEFAULT_LANGUAGE || "en-IN"
};

module.exports = env;
